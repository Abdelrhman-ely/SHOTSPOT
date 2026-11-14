// Canvas renderers, ported from web/app.js. Pure drawing: every number comes from the engine.
import { CmpRow } from './analysis';
import { CurvePt, SiteData, Vis, WEAK_GAP_M, eph, hzAt, spot } from './engine';

const C = { sun: '#ffc94a', earth: '#5aa9ff', pass: '#2fd0a0', grid: '#1a2436', muted: '#8b98b0', text: '#e6ebf5', weak: '#c9a7ff', sel: '#ffc94a' };

/** landing area: pass/fail grid, weak terrain, aim and best-aim drift circles */
export function drawMap(cv: HTMLCanvasElement, d: SiteData, pg: Uint8Array, o: { aim: number; best: number; sel: number; drift: number }) {
  const g = cv.getContext('2d')!, W = cv.width, H = cv.height, M = d.M;
  const ext = M.spots.half_m + 300, sc = W / (2 * ext), sp = M.spots.spacing_m * sc;
  g.clearRect(0, 0, W, H); g.drawImage(d.img, 0, 0, W, H);
  const px = (k: number) => { const s = spot(d, k); return [W / 2 + s.x * sc, H / 2 - s.y * sc]; };
  for (let k = 0; k < d.N; k++) {
    const [x, y] = px(k), weak = spot(d, k).gap > WEAK_GAP_M;
    if (pg[k]) { g.fillStyle = 'rgba(47,208,160,.55)'; g.fillRect(x - sp / 2, y - sp / 2, sp, sp); }
    else { g.strokeStyle = 'rgba(255,93,108,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - sp / 2, y + sp / 2); g.lineTo(x + sp / 2, y - sp / 2); g.stroke(); }
    if (weak) { g.fillStyle = 'rgba(201,167,255,.9)'; g.fillRect(x - 1, y - 1, 2, 2); }
  }
  const ring = (k: number, style: string, dash: number[]) => { const [x, y] = px(k); g.setLineDash(dash); g.strokeStyle = style; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, Math.max(o.drift * sc, 4), 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(x, y, 3, 0, 2 * Math.PI); g.fillStyle = style; g.fill(); };
  ring(o.aim, '#fff', [6, 4]);
  if (o.best >= 0 && o.best !== o.aim) ring(o.best, C.pass, []);
  const [sx, sy] = px(o.sel); g.strokeStyle = C.sel; g.lineWidth = 2; g.strokeRect(sx - 6, sy - 6, 12, 12);
  // north arrow: local north = away from the pole = direction of (x, y) in the grid
  const [ax, ay] = M.site.aim_xy, n = Math.hypot(ax, ay), ux = ax / n, uy = -ay / n;
  g.strokeStyle = g.fillStyle = C.text; g.lineWidth = 2;
  g.beginPath(); g.moveTo(40, 50); g.lineTo(40 + 22 * ux, 50 + 22 * uy); g.stroke();
  g.font = '12px system-ui'; g.fillText('N', 36 + 32 * ux, 54 + 32 * uy);
  g.fillRect(W - 20 - 500 * sc, H - 24, 500 * sc, 3); g.fillText('500 m', W - 20 - 500 * sc, H - 30);
}
/** map click → spot index, or -1 */
export function mapPick(cv: HTMLCanvasElement, d: SiteData, e: MouseEvent): number {
  const r = cv.getBoundingClientRect(), W = cv.width, M = d.M, ext = M.spots.half_m + 300, sc = W / (2 * ext);
  const x = ((e.clientX - r.left) * (W / r.width) - W / 2) / sc, y = -((e.clientY - r.top) * (W / r.width) - W / 2) / sc;
  const c = Math.round((x + M.spots.half_m) / M.spots.spacing_m), rr = Math.round((M.spots.half_m - y) / M.spots.spacing_m);
  return c < 0 || rr < 0 || c >= d.COLS || rr >= d.COLS ? -1 : rr * d.COLS + c;
}

export function drawCurve(cv: HTMLCanvasElement, curve: CurvePt[], flip: CurvePt | null, drift: number) {
  const g = cv.getContext('2d')!, W = cv.width, H = cv.height, L = 40, B = 26;
  g.clearRect(0, 0, W, H); g.font = '11px system-ui'; g.lineWidth = 1;
  const X = (r: number) => L + (r / 500) * (W - L - 10), Y = (v: number) => H - B - v * (H - B - 10);
  g.strokeStyle = '#233047'; g.fillStyle = C.muted;
  for (const v of [0, 0.25, 0.5, 0.75, 1]) { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(W - 10, Y(v)); g.stroke(); g.fillText(`${v * 100}%`, 4, Y(v) + 4); }
  for (let r = 0; r <= 500; r += 100) g.fillText(`${r} m`, X(r) - 12, H - 8);
  const line = (key: 'best' | 'nominal', style: string, dash: number[]) => { g.setLineDash(dash); g.strokeStyle = style; g.lineWidth = 2; g.beginPath();
    let started = false; for (const c of curve) { const v = c[key]; if (!Number.isFinite(v)) continue; started ? g.lineTo(X(c.r), Y(v)) : g.moveTo(X(c.r), Y(v)); started = true; } g.stroke(); g.setLineDash([]); };
  line('nominal', '#ffffff', [5, 4]); line('best', C.pass, []);
  g.strokeStyle = C.sel; g.lineWidth = 1; g.beginPath(); g.moveTo(X(drift), 8); g.lineTo(X(drift), H - B); g.stroke();
  if (flip) { g.fillStyle = C.weak; g.beginPath(); g.arc(X(flip.r), Y(flip.best), 5, 0, 2 * Math.PI); g.fill(); }
  g.fillStyle = C.text; g.fillText('— best aim', W - 150, 18); g.fillText('- - your aim', W - 80, 18);
}

export function drawSky(cv: HTMLCanvasElement, d: SiteData, k: number, s0: number, n: number, cursor: number) {
  const g = cv.getContext('2d')!, W = cv.width, H = cv.height;
  let top = 8; for (let a = 0; a < 360; a++) top = Math.max(top, hzAt(d, k, a) + 2);
  const bot = -7, X = (az: number) => (az / 360) * W, Y = (el: number) => H - ((el - bot) / (top - bot)) * H;
  g.clearRect(0, 0, W, H);
  g.strokeStyle = C.grid; g.fillStyle = C.muted; g.font = '11px system-ui'; g.lineWidth = 1;
  for (let el = Math.ceil(bot / 2) * 2; el <= top; el += 2) { g.beginPath(); g.moveTo(0, Y(el)); g.lineTo(W, Y(el)); g.stroke(); g.fillText(`${el}°`, 4, Y(el) - 2); }
  for (const [az, lab] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']] as [number, string][]) { g.fillText(lab, X(az) + 4, 14); g.beginPath(); g.moveTo(X(az), 0); g.lineTo(X(az), H); g.stroke(); }
  const path = (ai: number, ei: number, color: string) => { g.fillStyle = color; for (let j = 0; j < n; j += 6) { const b = 4 * (s0 + j); g.fillRect(X(d.EPH[b + ai]), Y(d.EPH[b + ei]), 1.5, 1.5); } };
  path(0, 1, 'rgba(255,201,74,.35)'); path(2, 3, 'rgba(90,169,255,.35)');
  g.beginPath(); g.moveTo(0, H); for (let a = 0; a <= 360; a++) g.lineTo(X(a), Y(hzAt(d, k, a % 360))); g.lineTo(W, H); g.closePath();
  g.fillStyle = '#2a3242'; g.fill(); g.strokeStyle = '#6b7a95'; g.lineWidth = 1.5; g.stroke();
  const e = eph(d, s0 + cursor);
  const body = (az: number, el: number, color: string, name: string) => { const vis = el > hzAt(d, k, az), x = X(az), y = Y(el);
    g.beginPath(); g.arc(x, y, 7, 0, 2 * Math.PI); g.lineWidth = 2; g.strokeStyle = color;
    if (vis) { g.fillStyle = color; g.fill(); } else { g.setLineDash([3, 2]); g.stroke(); g.setLineDash([]); }
    g.fillStyle = color; g.font = '12px system-ui'; g.fillText(`${name} ${vis ? 'visible' : 'blocked'}`, Math.min(x + 10, W - 110), y - 8); };
  body(e.sa, e.se, C.sun, 'Sun'); body(e.ea, e.ee, C.earth, 'Earth');
}

function bars(g: CanvasRenderingContext2D, arr: Uint8Array, X: (j: number) => number, x0: number, w: number, y: number, h: number, color: string) {
  g.fillStyle = C.grid; g.fillRect(x0, y, w, h); g.fillStyle = color;
  let s = -1; for (let j = 0; j <= arr.length; j++) { const v = j < arr.length && arr[j]; if (v && s < 0) s = j; if (!v && s >= 0) { g.fillRect(X(s), y, Math.max(X(j - 1) - X(s), 1), h); s = -1; } }
}
export function drawTimeline(cv: HTMLCanvasElement, d: SiteData, vs: Vis, cursor: number) {
  const g = cv.getContext('2d')!, W = cv.width, H = cv.height, n = vs.sun.length, L = 48;
  g.clearRect(0, 0, W, H); g.font = '11px system-ui';
  const X = (j: number) => L + (j / (n - 1)) * (W - L - 4);
  g.fillStyle = C.muted; g.fillText('Sun', 4, 18); g.fillText('Earth', 4, 40);
  bars(g, vs.sun, X, L, W - L - 4, 6, 16, C.sun); bars(g, vs.ear, X, L, W - L - 4, 28, 16, C.earth);
  g.fillStyle = C.muted; const days = ((n - 1) * d.STEP_MS) / 864e5;
  for (let dd = 0; dd <= days; dd += Math.max(1, Math.round(days / 10))) { const x = X((dd * 864e5) / d.STEP_MS); g.fillRect(x, 48, 1, 5); g.fillText(`d${dd}`, x - 6, 66); }
  g.fillStyle = C.text; g.fillRect(X(cursor) - 1, 2, 2, 50);
  g.fillStyle = C.muted; g.fillText(`sampling every ${d.M.ephem.step_min} min · UTC`, L, 84);
}
export const timelineLeft = (cv: HTMLCanvasElement) => 48 / cv.width;

export function drawCmpTimeline(cv: HTMLCanvasElement, rows: CmpRow[], best: CmpRow | null, stepMs: number) {
  const g = cv.getContext('2d')!, W = cv.width, L = 130, RH = 40;
  const n = rows.find((r) => r.ok)?.n ?? 2;
  const H = (cv.height = 44 + rows.length * RH); g.clearRect(0, 0, W, H); g.font = '12px system-ui';
  const X = (j: number) => L + (j / (n - 1)) * (W - L - 6);
  rows.forEach((w, i) => {
    const y = 6 + i * RH;
    g.fillStyle = w === best ? C.pass : C.muted; g.fillText(`${w.short}${w === best ? ' ★' : ''}`, 4, y + 18);
    if (!w.ok || !w.vis) return;
    bars(g, w.vis.sun, X, L, W - L - 6, y, 12, C.sun); bars(g, w.vis.ear, X, L, W - L - 6, y + 15, 12, C.earth);
  });
  g.fillStyle = C.muted; const days = ((n - 1) * stepMs) / 864e5;
  for (let dd = 0; dd <= days; dd += Math.max(1, Math.round(days / 10))) { const x = X((dd * 864e5) / stepMs); g.fillText(`day ${dd}`, Math.min(x - 14, W - 44), H - 6); }
  g.fillText('yellow = Sun visible, blue = Earth visible, at each aim point · UTC', L, H - 20);
}

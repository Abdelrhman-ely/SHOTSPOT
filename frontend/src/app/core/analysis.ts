// Higher-level analyses built on the engine: comparisons and visibility windows.
import {
  Profile, SiteData, Stats, Verdict, Vis, bestAim, diskOffsets, fmt, idxTime, iso, passFor, reasonText, runs,
  share, statsFor, verdict, visSeries,
} from './engine';

export interface CmpRow {
  key: string; name: string; label: string; short: string; title: string; value?: string;
  d: SiteData; aim: number; s0: number; n: number; ok: boolean; msg?: string;
  st?: Stats; pg?: Uint8Array; v?: Verdict; share?: number; best?: number; vis?: Vis;
}
export interface CmpResult { rows: CmpRow[]; best: CmpRow | null; flip: { r: number; from: CmpRow; to: CmpRow } | null; text: string; }

export const pct = (v: number | undefined) => (v !== undefined && Number.isFinite(v) ? `${fmt(100 * v, 0)}%` : 'n/a');

/** Same engine numbers for every row: one function, so dates and sites are compared the same way. */
export function compare(rows: CmpRow[], drift: number, p: Profile, noun: string): CmpResult {
  for (const w of rows) if (w.ok) {
    const d = w.d, offs = diskOffsets(d, drift);
    w.st = statsFor(d, w.s0, w.n); w.pg = passFor(d, w.st, p); w.v = verdict(d, w.aim, w.st, p);
    w.share = share(d, w.aim, offs, w.pg); w.best = bestAim(d, drift, w.pg, w.aim).share;
    w.vis = visSeries(d, w.aim, w.s0, w.n);
  }
  const valid = rows.filter((w) => w.ok);
  // rank: share of acceptable landing spots around the aim, then the aim verdict, then sunlight at the aim
  const score = (w: CmpRow) => [w.share!, w.v!.pass ? 1 : 0, w.st!.sun[w.aim]];
  const better = (x: CmpRow, y: CmpRow) => { const a = score(x), b = score(y); for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false; };
  let best: CmpRow | null = null; for (const w of valid) if (!best || better(w, best)) best = w;
  if (best && !(best.share! > 0)) best = null;

  // decision flip: drift at which the winner changes (reference = a 25 m precise landing)
  let flip: CmpResult['flip'] = null;
  if (valid.length > 1) {
    const winner = (r: number) => { let bw: CmpRow | null = null, bv = -1;
      for (const w of valid) { const v = share(w.d, w.aim, diskOffsets(w.d, r), w.pg!); if (v > bv + 1e-9) { bv = v; bw = w; } } return bv > 0 ? bw : null; };
    const ref = winner(25);
    for (let r = 50; r <= 500 && ref; r += 25) { const w = winner(r); if (w && w !== ref) { flip = { r, from: ref, to: w }; break; } }
  }

  const others = valid.filter((w) => w !== best);
  let text: string;
  if (!valid.length) text = `Pick at least one ${noun} inside the data range.`;
  else if (!best) text = `No ${noun} in this comparison works: within ${drift} m of the aim point, no landing spot meets the mission profile for any of them.`;
  else {
    text = `Best: ${best.label}. Within ${drift} m of the aim point, ${pct(best.share)} of the possible landing spots meet the profile`
      + (others.length ? `, against ${others.map((w) => `${pct(w.share)} for ${w.label}`).join(' and ')}. ` : '. ')
      + `At the aim point itself: sunlight ${fmt(best.st!.sun[best.aim])}%, longest dark period ${fmt(best.st!.sunGap[best.aim])} h. `;
    for (const w of others.filter((x) => !x.v!.pass))
      text += `${w.label} fails at its aim point because ${w.v!.reasons.filter((x) => !x.ok).map(reasonText).join('; ')}. `;
  }
  text += flip ? ` Decision flip: with drift of ${flip.r} m or more, ${flip.to.label} becomes better than ${flip.from.label}.`
    : valid.length > 1 && best ? ` The best ${noun} does not change between 25 m and 500 m of drift.` : '';
  return { rows, best, flip, text };
}

// ---------------------------------------------------------------- visibility windows (story 4)
export interface Win { start: Date; end: Date; hours: number; open: string; }
export interface WinSummary { list: Win[]; minutes: number; pct: number; }
export function windows(d: SiteData, arr: Uint8Array, s0: number): WinSummary {
  const n = arr.length, stepMin = d.M.ephem.step_min, w = runs(arr);
  const vis = w.reduce((t, [s, e]) => t + e - s, 0);
  return {
    minutes: vis * stepMin, pct: (100 * vis) / n,
    list: w.map(([s, e]) => ({
      start: idxTime(d, s0 + s), end: idxTime(d, s0 + e), hours: ((e - s) * stepMin) / 60,
      open: [s === 0 ? 'from window start' : '', e === n ? 'to window end' : ''].filter(Boolean).join(', '),
    })),
  };
}

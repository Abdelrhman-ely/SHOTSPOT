import { Component, ElementRef, NgZone, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { Reveal } from '../../shared/reveal/reveal';
import { Starfield } from '../../shared/starfield/starfield';
import { CountUp } from '../../shared/count-up/count-up';

interface Dot { x: number; y: number; ok: boolean; delay: number; }

@Component({
  selector: 'app-home',
  imports: [RouterLink, Starfield, Reveal, CountUp],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected readonly titleWords = ['Land', 'where', 'the'];

  protected readonly facts = computed(() => {
    if (!this.s.ready()) return null;
    const d = this.s.sites()[0], v = d.M.validation_vs_jpl_horizons ?? {};
    const maxDiff = Math.max(0, ...Object.values<any>(v).map((x) => Math.max(x.max_abs_daz_deg, x.max_abs_del_deg)));
    return [
      { value: String(this.s.sites().length), label: 'south pole sites from NASA PGDA 78' },
      { value: (d.M.ephem.n as number).toLocaleString('en-US'), label: `Sun & Earth positions per site, every ${d.M.ephem.step_min} min` },
      { value: `${d.M.horizon.max_distance_km} km`, label: 'of terrain scanned for every horizon' },
      { value: maxDiff < 1e-4 ? '< 0.0001°' : `${maxDiff.toFixed(4)}°`, label: 'max angle difference vs NASA JPL Horizons' },
    ];
  });

  protected readonly steps = [
    { n: '01', title: 'Choose a site', text: 'Pick a curated south pole site on the map, or enter your own coordinates inside the covered area.', frag: 'sites' },
    { n: '02', title: 'Set the mission window', text: 'Landing time in UTC and a duration. Watch the Sun and Earth move above the real terrain horizon.', frag: 'mission' },
    { n: '03', title: 'Plan for the miss', text: 'Enter how far the lander may drift. See how many likely landing spots still work, and where to aim.', frag: 'landing' },
    { n: '04', title: 'Compare and decide', text: 'Put sites or dates side by side, find the decision flip point and export the result.', frag: 'compare' },
  ];

  /** illustrative landing scatter for the problem section (not engine output; labeled as such) */
  protected readonly dots: Dot[] = (() => {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const out: Dot[] = [];
    while (out.length < 46) {
      const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 78, x = 100 + r * Math.cos(a), y = 100 + r * Math.sin(a);
      const inCrater = (x - 140) ** 2 / 34 ** 2 + (y - 128) ** 2 / 26 ** 2 < 1, inShadow = x < 52 && y < 92;
      out.push({ x, y, ok: !(inCrater || inShadow), delay: out.length * 0.11 });
    }
    return out;
  })();

  private readonly onScroll = () => { const el = this.host.nativeElement as HTMLElement; el.style.setProperty('--sy', String(Math.min(scrollY, 1600)));
    const max = document.documentElement.scrollHeight - innerHeight; el.style.setProperty('--progress', String(max > 0 ? scrollY / max : 0)); };
  private readonly onMove = (e: PointerEvent) => { const el = this.host.nativeElement as HTMLElement;
    el.style.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3)); el.style.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3)); };

  ngOnInit() {
    if (this.reduce) return;
    this.zone.runOutsideAngular(() => {
      addEventListener('scroll', this.onScroll, { passive: true });
      addEventListener('pointermove', this.onMove, { passive: true });
      this.onScroll();
    });
  }
  ngOnDestroy() { removeEventListener('scroll', this.onScroll); removeEventListener('pointermove', this.onMove); }

  planAt(id: string) { this.s.selectSite(id); this.router.navigate(['/planner'], { fragment: 'mission' }); }
}

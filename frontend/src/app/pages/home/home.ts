import { Component, ElementRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { Reveal } from '../../shared/reveal/reveal';
import { Starfield } from '../../shared/starfield/starfield';

interface Dot { x: number; y: number; ok: boolean; delay: number; }

@Component({
  selector: 'app-home',
  imports: [RouterLink, Starfield, Reveal],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected readonly titleWords = ['Your', 'lander', 'will', 'miss.'];

  protected readonly steps = [
    { n: '01', title: 'Choose a site', text: 'Select a south pole site in the planner controls.', frag: 'mission' },
    { n: '02', title: 'Set the mission window', text: 'Pick a date and watch the Sun and Earth over the real horizon.', frag: 'mission' },
    { n: '03', title: 'Plan for the miss', text: 'Set the drift. See how many spots still work, and where to aim.', frag: 'landing' },
    { n: '04', title: 'Compare and decide', text: 'Sites or dates side by side. Export the result.', frag: 'compare' },
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

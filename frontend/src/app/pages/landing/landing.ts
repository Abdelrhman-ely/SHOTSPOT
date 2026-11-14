import { Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { Store } from '../../core/store';
import { drawCurve, drawMap, mapPick } from '../../core/draw';
import { fmt, spot } from '../../core/engine';
import { goSection } from '../../core/nav';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.html',
})
export class Landing {
  protected readonly s = inject(Store);
  protected readonly fmt = fmt;
  private readonly map = viewChild.required<ElementRef<HTMLCanvasElement>>('map');
  private readonly curve = viewChild.required<ElementRef<HTMLCanvasElement>>('curve');

  protected readonly disp = computed(() => {
    const b = this.s.best(), d = this.s.site(), drift = this.s.drift(), f = this.s.flip();
    if (!(b.share > 0)) return { none: true, nom: '0%', best: '0%', where: 'no spot works', flip: 'n/a',
      text: 'No spot in the analysis area meets the mission profile in this window, so no aim point helps. Try another date or relax the profile.' };
    const bs = spot(d, b.k), dist = Math.hypot(bs.x, bs.y);
    const text = drift === 0 ? 'With a perfect landing, only the single aim spot matters.'
      : `If the lander lands anywhere within ${drift} m of your aim, ${fmt(100 * b.nominal, 0)}% of the possible landing spots meet the profile. `
        + `Aiming ${fmt(dist, 0)} m away raises that to ${fmt(100 * b.share, 0)}%. `
        + (f ? `The best aim point for a precise lander stops being the best choice once drift reaches ${f.r} m.` : 'The best aim point does not change between 25 m and 500 m of drift.');
    return { none: false, nom: Number.isFinite(b.nominal) ? `${fmt(100 * b.nominal, 0)}%` : 'n/a', best: `${fmt(100 * b.share, 0)}%`,
      where: `${fmt(dist, 0)} m from your aim`, flip: f ? `${f.r} m` : 'none in range', text };
  });
  protected readonly selLabel = computed(() => {
    const k = this.s.spotK(); if (k === this.s.aim()) return 'your aim point';
    const p = spot(this.s.site(), k); return `spot ${fmt(p.x, 0)} m, ${fmt(p.y, 0)} m from your aim`;
  });
  protected readonly isDefaultAim = computed(() => this.s.aim() === this.s.site().defaultAim);

  constructor() {
    effect(() => {
      const b = this.s.best();
      drawMap(this.map().nativeElement, this.s.site(), this.s.pass(), { aim: this.s.aim(), best: b.share > 0 ? b.k : -1, sel: this.s.spotK(), drift: this.s.drift() });
      drawCurve(this.curve().nativeElement, this.s.curve(), this.s.flip(), this.s.drift());
    });
  }
  go(id: string) { goSection(id); }
  pick(e: MouseEvent) { const k = mapPick(this.map().nativeElement, this.s.site(), e); if (k >= 0) this.s.selSpot.set(k); }
  useBest() { const b = this.s.best(); if (b.share > 0) this.s.setAim(b.k); }
  aimHere() { this.s.setAim(this.s.spotK()); }
}

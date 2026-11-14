import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../../core/store';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
  <div class="page page--narrow">
    <h1 class="page-title">Sources & limits</h1>
    <p class="page-lead">How SHOTSPOT supports landing site decisions, and where its results have limits.</p>
    @if (!s.ready()) {
      @if (s.error(); as err) { <div class="card load-error" role="alert"><h2 class="card-title" style="color: var(--c-fail)">Failed to load site data</h2><p class="explain">{{ err }}</p></div> }
      @if (!s.error()) { <div class="loading" role="status"><div class="spinner" aria-hidden="true"></div><p>Loading…</p></div> }
    } @else {
      @let M = s.site().M;
      <div class="card"><h2 class="card-title">How to read the results</h2>
        <ul class="list"><li>Sunlight means the Sun’s center clears the terrain horizon; it does not estimate power.</li>
          <li>Earth visibility means geometric line of sight; it does not estimate radio link quality.</li>
          <li>Drift is a user-set landing area around the aim point, not a landing-error prediction.</li>
          <li>The terrain layer does not detect hazards; objects smaller than about 10 m may not appear. Demo aim points are prototype choices, not official mission targets.</li>
        </ul></div>
      <div class="card card--gap"><h2 class="card-title">Data & validation</h2>
        <ul class="list">@for (a of M.sources; track a) { <li>{{ a }}</li> }
          <li>Terrain: {{ M.hillshade.res }} m/pixel near field and 120 m/pixel far field; landing samples every {{ M.spots.spacing_m }} m. Sun and Earth positions are sampled every {{ M.ephem.step_min }} minutes (UTC).</li>
          @for (b of bodies(); track b.name) { <li>{{ b.name }} checked against NASA JPL Horizons ({{ b.n }} sample times): max azimuth difference {{ b.daz }}°, elevation difference {{ b.del }}°.</li> }
          <li>Horizon calculations are checked on synthetic terrain cases.</li>
        </ul></div>
      <div class="card card--gap"><h2 class="card-title">Future work</h2>
        <p class="explain">We plan to explore computer vision for crater and surface-hazard mapping from high-resolution lunar imagery. This capability is not part of the current analysis.</p>
      </div>
      <p class="step-nav"><a class="btn btn--primary" routerLink="/planner">Start planning →</a></p>
    }
  </div>`,
  styles: [`.list { padding-inline-start: 1.2em; display: grid; gap: var(--sp-2); color: var(--c-text-2); margin-block-start: var(--sp-3); }
    `],
})
export class About {
  protected readonly s = inject(Store);
  protected readonly bodies = computed(() => Object.entries<any>(this.s.site()?.M.validation_vs_jpl_horizons ?? {})
    .map(([name, x]) => ({ name, n: x.n, daz: x.max_abs_daz_deg.toFixed(4), del: x.max_abs_del_deg.toFixed(4) })));
}

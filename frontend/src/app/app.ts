import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from './core/store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly s = inject(Store);
  constructor() {
    this.s.init();
    effect(() => document.body.classList.toggle('simple', this.s.simple()));
  }
  print() { window.print(); }
}

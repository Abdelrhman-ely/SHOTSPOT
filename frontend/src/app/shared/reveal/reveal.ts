import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

/** Adds the class "in" when the element scrolls into view (scroll-reveal animation). */
@Directive({ selector: '[appReveal]' })
export class Reveal implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private io?: IntersectionObserver;
  ngOnInit() {
    const node = this.el.nativeElement as HTMLElement;
    node.classList.add('reveal');
    if (!('IntersectionObserver' in window)) { node.classList.add('in'); return; }
    this.io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { node.classList.add('in'); this.io?.disconnect(); } }), { threshold: 0.15 });
    this.io.observe(node);
  }
  ngOnDestroy() { this.io?.disconnect(); }
}

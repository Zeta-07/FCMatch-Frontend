import { Directive, ElementRef, inject } from '@angular/core';

@Directive()
export abstract class AccessiblePage {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  ionViewDidEnter() {
    const heading = this.host.nativeElement.querySelector<HTMLElement>('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }
}

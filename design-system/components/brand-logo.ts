import { Component } from '@angular/core';

@Component({
  selector: 'fc-brand-logo',
  template: `
    <img
      class="brand-mark brand-mark-light"
      src="assets/branding/Logo.png"
      alt="FCMatch"
      width="2752"
      height="1536"
    />
    <img
      class="brand-mark brand-mark-dark"
      src="assets/branding/Logo-modo-oscuro.png"
      alt="FCMatch"
      width="2752"
      height="1536"
    />
  `,
})
export class BrandLogo {}

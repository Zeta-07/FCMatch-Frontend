import { Component, signal } from '@angular/core';
import { IonButton } from '@ionic/angular';

@Component({
  selector: 'fc-theme-toggle',
  imports: [IonButton],
  template:
    '<ion-button (click)="toggle()" [attr.aria-pressed]="isLight()" aria-label="Alternar tema">{{ isLight() ? "Usar tema oscuro" : "Usar tema claro" }}</ion-button>',
})
export class ThemeToggle {
  readonly isLight = signal(document.documentElement.dataset['theme'] === 'light');

  toggle() {
    const theme = this.isLight() ? 'dark' : 'light';
    document.documentElement.dataset['theme'] = theme;
    document
      .querySelector<HTMLLinkElement>('link[rel="icon"]')
      ?.setAttribute(
        'href',
        `assets/branding/${theme === 'light' ? 'Logo.png' : 'Logo-modo-oscuro.png'}`,
      );
    this.isLight.set(theme === 'light');
    try {
      localStorage.setItem('fcmatch-theme', theme);
    } catch {
      /* El tema sigue funcionando sin almacenamiento. */
    }
  }
}

import { Component, Injectable, inject, signal } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { moonOutline, sunnyOutline } from 'ionicons/icons';

@Component({
  selector: 'fc-theme-toggle',
  imports: [IonButton, IonIcon],
  template: `<ion-button
    class="theme-toggle"
    fill="clear"
    (click)="toggle()"
    [attr.aria-label]="isLight() ? 'Activar tema oscuro' : 'Activar tema claro'"
    [attr.aria-description]="isLight() ? 'Tema actual: claro' : 'Tema actual: oscuro'"
    [title]="isLight() ? 'Activar tema oscuro' : 'Activar tema claro'"
  >
    <ion-icon slot="icon-only" [icon]="isLight() ? moon : sun" aria-hidden="true" />
  </ion-button>`,
  styles: `
    ion-button {
      min-width: 2.75rem;
      min-height: 2.75rem;
      --padding-start: 0.625rem;
      --padding-end: 0.625rem;
      --background: var(--bg-transparent);
      --background-hover: var(--bg-subtle);
      --background-focused: var(--bg-subtle);
      --background-activated: var(--bg-subtle);
      --color: var(--text-primary);
    }
    ion-icon {
      font-size: 1.5rem;
    }
  `,
})
export class ThemeToggle {
  readonly moon = moonOutline;
  readonly sun = sunnyOutline;
  private readonly state = inject(ThemeState);
  readonly isLight = this.state.isLight;
  toggle() {
    this.state.toggle();
  }
}

@Injectable({ providedIn: 'root' })
export class ThemeState {
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

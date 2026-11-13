import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonContent } from '@ionic/angular';
import { BrandLogo } from '../design/brand-logo';
import { ThemeToggle } from '../design/theme-toggle';
import { Session } from '../../core/session/session';
import { CLIENT_PLATFORM } from './client-platform';

@Component({
  selector: 'fc-page-frame',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    BrandLogo,
    ThemeToggle,
    RouterLink,
    RouterLinkActive,
  ],
  template: ` <ion-header
      ><ion-toolbar>
        <ion-buttons slot="start">
          @if (back()) {
            <ion-button [routerLink]="back()" aria-label="Volver">← Volver</ion-button>
          }
          <a routerLink="/" aria-label="Inicio de FCMatch"><fc-brand-logo /></a>
        </ion-buttons>
        <ion-buttons slot="end">
          @if (publicView() && !session.authenticated()) {
            <ion-button routerLink="/iniciar-sesion" fill="clear">Iniciar sesión</ion-button>
            <ion-button routerLink="/registro" fill="clear">Crear cuenta</ion-button>
          }
          <fc-theme-toggle />
        </ion-buttons>
      </ion-toolbar>
      @if (platform === 'web' && session.authenticated()) {
        <ion-toolbar
          ><nav aria-label="Principal" class="top-nav">
            <a routerLink="/buscar" routerLinkActive="active">Buscar usuarios</a>
            <a routerLink="/perfil" routerLinkActive="active">Mi perfil</a>
            <a routerLink="/ajustes" routerLinkActive="active">Ajustes</a>
          </nav></ion-toolbar
        >
      }
    </ion-header>
    <ion-content role="region" aria-label="Contenido"
      ><main class="identity-shell" [class.narrow]="narrow()"><ng-content /></main
    ></ion-content>`,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    ion-content {
      flex: 1;
    }
    fc-brand-logo {
      display: block;
      width: 7rem;
    }
  `,
})
export class PageFrame {
  readonly session = inject(Session);
  readonly platform = inject(CLIENT_PLATFORM);
  readonly back = input('');
  readonly narrow = input(false);
  readonly publicView = input(false);
}

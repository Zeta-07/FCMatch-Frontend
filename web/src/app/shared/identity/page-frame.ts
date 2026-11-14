import { Component, inject, input, output, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonTitle,
  IonBackButton,
} from '@ionic/angular';
import {
  arrowBackOutline,
  personOutline,
  searchOutline,
  settingsOutline,
  logInOutline,
  personAddOutline,
} from 'ionicons/icons';
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
    IonIcon,
    IonTitle,
    IonBackButton,
    BrandLogo,
    ThemeToggle,
    RouterLink,
    RouterLinkActive,
  ],
  template: ` <ion-header class="identity-header"
      ><ion-toolbar>
        <ion-buttons slot="start">
          @if (back() && historyBack()) {
            <ion-back-button [defaultHref]="back()" text="" [icon]="backIcon" aria-label="Volver" />
          } @else if (back()) {
            <ion-button [routerLink]="back()" aria-label="Volver" fill="clear"
              ><ion-icon slot="icon-only" [icon]="backIcon" aria-hidden="true"
            /></ion-button>
          }
          @if (platform === 'web' || (publicView() && !session.authenticated())) {
            <a routerLink="/" aria-label="Inicio de FCMatch"><fc-brand-logo /></a>
          }
        </ion-buttons>
        @if (platform === 'mobile' && !(publicView() && !session.authenticated())) {
          <ion-title
            ><a routerLink="/" aria-label="Inicio de FCMatch"><fc-brand-logo /></a
          ></ion-title>
        }
        @if (platform === 'web' && session.authenticated()) {
          <nav aria-label="Principal" class="top-nav" slot="end">
            <a routerLink="/buscar" routerLinkActive="active" ariaCurrentWhenActive="page"
              ><ion-icon [icon]="searchIcon" aria-hidden="true" /><span class="nav-label"
                >Buscar usuarios</span
              ></a
            >
            <a routerLink="/perfil" routerLinkActive="active" ariaCurrentWhenActive="page"
              ><ion-icon [icon]="profileIcon" aria-hidden="true" /><span class="nav-label"
                >Mi perfil</span
              ></a
            >
            <a routerLink="/ajustes" routerLinkActive="active" ariaCurrentWhenActive="page"
              ><ion-icon [icon]="settingsIcon" aria-hidden="true" /><span class="nav-label"
                >Ajustes</span
              ></a
            >
          </nav>
        }
        <ion-buttons slot="end">
          @if (publicView() && !session.authenticated()) {
            <ion-button routerLink="/iniciar-sesion" fill="clear" aria-label="Iniciar sesión">
              @if (platform === 'mobile') {
                <ion-icon slot="icon-only" [icon]="loginIcon" aria-hidden="true" />
              } @else {
                Iniciar sesión
              }
            </ion-button>
            <ion-button routerLink="/registro" fill="clear" aria-label="Crear cuenta">
              @if (platform === 'mobile') {
                <ion-icon slot="icon-only" [icon]="registerIcon" aria-hidden="true" />
              } @else {
                Crear cuenta
              }
            </ion-button>
          }
          <fc-theme-toggle />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content
      role="region"
      aria-label="Contenido"
      [scrollEvents]="trackScroll()"
      (ionScroll)="scrollPosition.emit($event.detail.scrollTop)"
      ><main
        class="identity-shell"
        [class.narrow]="narrow()"
        [class.auth-layout]="authLayout()"
        [class.mobile-profile-editor]="platform === 'mobile' && profileEditor()"
      >
        <ng-content /></main
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
    ion-title {
      text-align: center;
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    ion-title a {
      display: inline-block;
      pointer-events: auto;
    }
    ion-title fc-brand-logo {
      margin-inline: auto;
    }
  `,
})
export class PageFrame {
  readonly loginIcon = logInOutline;
  readonly registerIcon = personAddOutline;
  readonly backIcon = arrowBackOutline;
  readonly searchIcon = searchOutline;
  readonly profileIcon = personOutline;
  readonly settingsIcon = settingsOutline;
  readonly session = inject(Session);
  readonly platform = inject(CLIENT_PLATFORM);
  readonly back = input('');
  readonly historyBack = input(false);
  readonly profileEditor = input(false);
  readonly trackScroll = input(false);
  readonly scrollPosition = output<number>();
  private readonly content = viewChild.required(IonContent);
  scrollTo(top: number) {
    return this.content().scrollToPoint(0, top, 0);
  }
  readonly narrow = input(false);
  readonly publicView = input(false);
  readonly authLayout = input(false);
}

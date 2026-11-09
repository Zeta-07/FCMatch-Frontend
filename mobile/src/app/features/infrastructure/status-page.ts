import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular';
import { BrandLogo } from '../../shared/design/brand-logo';
import { ThemeToggle } from '../../shared/design/theme-toggle';
import { ApiStatus } from '../../shared/design/api-status';

@Component({
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, BrandLogo, ThemeToggle, ApiStatus],
  template: `<ion-header
      ><ion-toolbar><ion-title>FCMatch · Móvil</ion-title></ion-toolbar></ion-header
    >
    <ion-content
      ><main class="page-shell">
        <fc-brand-logo />
        <h1>Base técnica móvil</h1>
        <p class="muted">Fase 0 · Angular, Ionic y Capacitor.</p>
        <fc-theme-toggle /><fc-api-status /></main
    ></ion-content>`,
})
export class StatusPage {}

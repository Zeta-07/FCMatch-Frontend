import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon } from '@ionic/angular';
import { personOutline, searchOutline, settingsOutline } from 'ionicons/icons';

@Component({
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon],
  template: `<ion-tabs
    ><ion-tab-bar slot="bottom">
      <ion-tab-button tab="perfil" href="/perfil"
        ><ion-icon [icon]="person" aria-hidden="true" /><ion-label
          >Mi perfil</ion-label
        ></ion-tab-button
      >
      <ion-tab-button tab="buscar" href="/buscar"
        ><ion-icon [icon]="search" aria-hidden="true" /><ion-label
          >Buscar</ion-label
        ></ion-tab-button
      >
      <ion-tab-button tab="ajustes" href="/ajustes"
        ><ion-icon [icon]="settings" aria-hidden="true" /><ion-label
          >Ajustes</ion-label
        ></ion-tab-button
      >
    </ion-tab-bar></ion-tabs
  >`,
})
export class IdentityTabs {
  readonly person = personOutline;
  readonly search = searchOutline;
  readonly settings = settingsOutline;
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonButton, IonList, IonItem, IonLabel, IonIcon } from '@ionic/angular';
import { mailOutline, lockClosedOutline, logOutOutline, warningOutline } from 'ionicons/icons';
import { PageFrame } from '../../shared/identity/page-frame';
import { AccessiblePage } from '../../shared/identity/accessible-page';
import { Feedback } from '../../shared/identity/feedback';
import { Session } from '../../core/session/session';
import { identityError } from '../../core/api/identity-api';

@Component({
  imports: [PageFrame, Feedback, IonButton, RouterLink, IonList, IonItem, IonLabel, IonIcon],
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fc-page-frame
    ><h1>Ajustes</h1>
    <section class="settings-section">
      <h2>Cuenta</h2>
      <ion-list class="settings-list" lines="inset">
        <ion-item routerLink="/cambiar-correo" [detail]="true"
          ><ion-icon slot="start" [icon]="mailIcon" aria-hidden="true" /><ion-label
            >Cambiar correo</ion-label
          ></ion-item
        >
        <ion-item routerLink="/cambiar-contrasena" [detail]="true"
          ><ion-icon slot="start" [icon]="lockIcon" aria-hidden="true" /><ion-label
            >Cambiar contraseña</ion-label
          ></ion-item
        >
      </ion-list>
    </section>
    <section class="settings-section">
      <h2>Sesiones</h2>
      <div class="settings-actions">
        <ion-button fill="outline" (click)="logout(false)" [disabled]="busy()"
          ><ion-icon slot="start" [icon]="logoutIcon" aria-hidden="true" />Cerrar sesión</ion-button
        ><ion-button class="danger-action" fill="outline" (click)="confirmAll()" [disabled]="busy()"
          ><ion-icon slot="start" [icon]="warningIcon" aria-hidden="true" />Cerrar todas las
          sesiones</ion-button
        >
      </div>
    </section>
    <fc-feedback [busy]="busy()" [error]="error()" />
  </fc-page-frame>`,
})
export class SettingsPage extends AccessiblePage {
  readonly mailIcon = mailOutline;
  readonly lockIcon = lockClosedOutline;
  readonly logoutIcon = logOutOutline;
  readonly warningIcon = warningOutline;
  private readonly session = inject(Session);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertController);
  readonly busy = signal(false);
  readonly error = signal('');
  async confirmAll() {
    if (this.busy()) return;
    const alert = await this.alerts.create({
      header: '¿Cerrar todas las sesiones?',
      message: 'Se cerrarán también en este dispositivo.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar todas',
          handler: () => {
            void this.logout(true);
          },
        },
      ],
    });
    await alert.present();
  }
  async logout(all: boolean) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.session.logout(all);
      await this.router.navigateByUrl('/iniciar-sesion', { replaceUrl: true });
    } catch (error) {
      this.error.set(identityError(error));
    } finally {
      this.busy.set(false);
    }
  }
  ionViewDidLeave() {
    this.error.set('');
  }
}

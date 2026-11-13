import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonButton } from '@ionic/angular';
import { PageFrame } from '../../shared/identity/page-frame';
import { AccessiblePage } from '../../shared/identity/accessible-page';
import { Feedback } from '../../shared/identity/feedback';
import { ThemeToggle } from '../../shared/design/theme-toggle';
import { Session } from '../../core/session/session';
import { identityError } from '../../core/api/identity-api';

@Component({
  imports: [PageFrame, Feedback, ThemeToggle, IonButton, RouterLink],
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fc-page-frame
    ><h1>Ajustes</h1>
    <section class="identity-card">
      <h2>Apariencia</h2>
      <fc-theme-toggle />
    </section>
    <section class="identity-card">
      <h2>Cuenta</h2>
      <div class="settings-actions">
        <ion-button fill="outline" routerLink="/cambiar-correo">Cambiar correo</ion-button
        ><ion-button fill="outline" routerLink="/cambiar-contrasena">Cambiar contraseña</ion-button>
      </div>
    </section>
    <section class="identity-card">
      <h2>Sesiones</h2>
      <div class="settings-actions">
        <ion-button fill="outline" (click)="logout(false)" [disabled]="busy()"
          >Cerrar sesión</ion-button
        ><ion-button fill="outline" (click)="confirmAll()" [disabled]="busy()"
          >Cerrar todas las sesiones</ion-button
        >
      </div>
    </section>
    <fc-feedback [busy]="busy()" [error]="error()" />
  </fc-page-frame>`,
})
export class SettingsPage extends AccessiblePage {
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

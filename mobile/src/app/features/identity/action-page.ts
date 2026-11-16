import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  disabled,
  email,
  form,
  FormField,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { IonButton } from '@ionic/angular';
import { PageFrame } from '../../shared/identity/page-frame';
import { AccessiblePage } from '../../shared/identity/accessible-page';
import { TextField } from '../../shared/identity/text-field';
import { Feedback } from '../../shared/identity/feedback';
import { passwordValid } from '../../shared/identity/validators';
import { ActionLink } from '../../core/session/action-link';
import { Session } from '../../core/session/session';
import { IdentityApi, identityError, MAIL_ACCEPTED } from '../../core/api/identity-api';

@Component({
  imports: [PageFrame, TextField, Feedback, FormField, IonButton, RouterLink],
  selector: 'app-action-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fc-page-frame [narrow]="true"
    ><section class="identity-card">
      <h1>{{ title }}</h1>
      <fc-feedback [busy]="busy()" [error]="error()" [message]="message()" />
      @if (!done()) {
        @if (token()) {
          @if (mode === 'verification') {
            <p class="muted">El enlace vence en 24 h.</p>
            <ion-button expand="block" (click)="confirm()" [disabled]="busy()"
              >Verificar correo</ion-button
            >
          } @else if (mode === 'email-change') {
            @if (session.authenticated()) {
              <p>Confirma el cambio solicitado.</p>
              <ion-button expand="block" (click)="confirm()" [disabled]="busy()"
                >Confirmar cambio</ion-button
              >
              <ion-button
                expand="block"
                fill="outline"
                routerLink="/ajustes"
                (click)="cancel()"
                [disabled]="busy()"
                >Cancelar</ion-button
              >
            } @else if (!busy()) {
              <p>Inicia sesión para confirmar.</p>
              <ion-button routerLink="/iniciar-sesion">Iniciar sesión</ion-button>
            }
          } @else {
            <form (submit)="reset($event)" novalidate>
              <fc-text-field
                label="Nueva contraseña"
                type="password"
                autocomplete="new-password"
                helper="12–128 caracteres."
                [formField]="passwordFields.password"
              />
              <fc-text-field
                label="Repetir contraseña"
                type="password"
                autocomplete="new-password"
                [formField]="passwordFields.repeat"
              />
              <p>Se cerrarán todas las sesiones, incluida esta.</p>
              <ion-button type="submit" expand="block" [disabled]="busy()"
                >Guardar contraseña</ion-button
              >
            </form>
          }
        } @else {
          <p>Abre un enlace válido desde tu correo.</p>
        }
        @if (mode === 'verification') {
          <ion-button fill="clear" (click)="resending.set(!resending())" [disabled]="busy()"
            >Reenviar enlace</ion-button
          >
          @if (resending()) {
            <form (submit)="resend($event)" novalidate>
              <fc-text-field
                label="Correo"
                type="email"
                autocomplete="email"
                [formField]="emailFields.email"
              />
              <ion-button type="submit" expand="block" [disabled]="busy()"
                >Enviar enlace</ion-button
              >
            </form>
          }
        }
        @if (mode === 'reset') {
          <a routerLink="/recuperar-contrasena">Solicitar otro enlace</a>
        }
      }
      <nav class="form-links" aria-label="Cuenta">
        <a
          [routerLink]="
            mode === 'email-change' && session.authenticated() ? '/ajustes' : '/iniciar-sesion'
          "
          >{{
            mode === 'email-change' && session.authenticated()
              ? 'Volver a Ajustes'
              : 'Iniciar sesión'
          }}</a
        >
      </nav>
    </section></fc-page-frame
  >`,
})
export class ActionPage extends AccessiblePage {
  private readonly api = inject(IdentityApi);
  private readonly link = inject(ActionLink);
  readonly session = inject(Session);
  readonly mode = inject(ActivatedRoute).snapshot.data['mode'] as
    'verification' | 'reset' | 'email-change';
  readonly title =
    this.mode === 'verification'
      ? 'Verificar correo'
      : this.mode === 'reset'
        ? 'Restablecer contraseña'
        : 'Confirmar correo';
  readonly token = signal(this.link.read(this.mode));
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly resending = signal(false);
  readonly emailModel = signal({ email: '' });
  readonly emailFields = form(this.emailModel, (p) => {
    disabled(p, () => this.busy());
    required(p.email, { message: 'Escribe tu correo.' });
    email(p.email, { message: 'Escribe un correo válido.' });
  });
  readonly passwordModel = signal({ password: '', repeat: '' });
  readonly passwordFields = form(this.passwordModel, (p) => {
    disabled(p, () => this.busy());
    validate(p.password, ({ value }) =>
      passwordValid(value())
        ? undefined
        : { kind: 'password', message: 'Usa entre 12 y 128 caracteres.' },
    );
    validate(p.repeat, ({ value, valueOf }) =>
      value() === valueOf(p.password)
        ? undefined
        : { kind: 'match', message: 'Las contraseñas no coinciden.' },
    );
  });
  async ionViewWillEnter() {
    if (this.mode === 'email-change' && !this.session.authenticated() && this.token()) {
      this.busy.set(true);
      try {
        await this.session.token();
      } catch {
        /* Login preserves the action token in memory only. */
      } finally {
        this.busy.set(false);
      }
    }
  }
  private async run(work: () => Promise<unknown>, message: string) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      await work();
      this.message.set(message);
    } catch (error) {
      this.error.set(identityError(error));
    } finally {
      this.busy.set(false);
    }
  }
  confirm() {
    if (!this.token()) return;
    void this.run(
      async () => {
        if (this.mode === 'verification') await this.api.verify({ token: this.token() });
        else this.session.profile.set(await this.api.confirmEmail({ token: this.token() }));
        this.done.set(true);
        this.link.clear();
        this.token.set('');
      },
      this.mode === 'verification' ? 'Correo verificado.' : 'Correo actualizado.',
    );
  }
  reset(event: Event) {
    event.preventDefault();
    if (this.busy() || !this.token()) return;
    this.passwordFields().markAsTouched();
    void submit(this.passwordFields, async () => {
      await this.run(async () => {
        await this.api.reset({ token: this.token(), newPassword: this.passwordModel().password });
        this.session.closed();
        this.link.clear();
        this.token.set('');
        this.done.set(true);
      }, 'Contraseña actualizada.');
      this.passwordModel.set({ password: '', repeat: '' });
    });
  }
  resend(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    this.emailFields().markAsTouched();
    void submit(this.emailFields, async () => {
      await this.run(
        () => this.api.resend({ email: this.emailModel().email.trim() }),
        MAIL_ACCEPTED,
      );
    });
  }
  cancel() {
    this.link.clear();
    this.token.set('');
  }
  ionViewDidLeave() {
    this.passwordModel.set({ password: '', repeat: '' });
    this.emailModel.set({ email: '' });
  }
}

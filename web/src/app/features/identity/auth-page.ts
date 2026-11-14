import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { IdentityApi, identityError, MAIL_ACCEPTED } from '../../core/api/identity-api';
import { Session } from '../../core/session/session';
import { ActionLink } from '../../core/session/action-link';

@Component({
  imports: [PageFrame, TextField, Feedback, FormField, IonButton, RouterLink],
  selector: 'app-auth-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fc-page-frame [narrow]="true" [authLayout]="true">
    <section class="identity-card auth-card">
      <h1>{{ title }}</h1>
      <form (submit)="send($event)" novalidate [attr.aria-busy]="busy()">
        @if (mode === 'register') {
          <fc-text-field
            label="Usuario"
            autocomplete="username"
            helper="3–30 caracteres: letras, números y _."
            [formField]="fields.username"
          />
        }
        <fc-text-field
          label="Correo"
          type="email"
          autocomplete="email"
          [formField]="fields.email"
        />
        @if (mode === 'login') {
          <a class="recovery-link" routerLink="/recuperar-contrasena">¿Olvidaste tu contraseña?</a>
        }
        @if (mode !== 'forgot') {
          <fc-text-field
            label="Contraseña"
            type="password"
            [autocomplete]="mode === 'register' ? 'new-password' : 'current-password'"
            [helper]="mode === 'register' ? '12–128 caracteres.' : ''"
            [formField]="fields.password"
          />
        }
        <fc-feedback [busy]="busy()" [error]="error()" [message]="message()" />
        <ion-button type="submit" expand="block" [disabled]="busy()">{{ action }}</ion-button>
      </form>
      <nav class="form-links" aria-label="Acceso a la cuenta">
        @if (mode === 'login') {
          <a routerLink="/registro">Crear cuenta</a>
          <a routerLink="/verificar-correo">Verificar correo</a>
        } @else {
          <a routerLink="/iniciar-sesion">Iniciar sesión</a>
        }
        @if (mode === 'register' && message()) {
          <a routerLink="/verificar-correo">Verificar correo</a>
        }
      </nav>
    </section>
  </fc-page-frame>`,
})
export class AuthPage extends AccessiblePage {
  private readonly api = inject(IdentityApi);
  private readonly session = inject(Session);
  private readonly router = inject(Router);
  private readonly link = inject(ActionLink);
  readonly mode = inject(ActivatedRoute).snapshot.data['mode'] as 'login' | 'register' | 'forgot';
  readonly title =
    this.mode === 'login'
      ? 'Iniciar sesión'
      : this.mode === 'register'
        ? 'Crear cuenta'
        : 'Recuperar contraseña';
  readonly action =
    this.mode === 'login' ? 'Entrar' : this.mode === 'register' ? 'Crear cuenta' : 'Enviar enlace';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly model = signal({ email: '', username: '', password: '' });
  readonly fields = form(this.model, (p) => {
    disabled(p, () => this.busy());
    required(p.email, { message: 'Escribe tu correo.' });
    email(p.email, { message: 'Escribe un correo válido.' });
    if (this.mode === 'register') {
      validate(p.username, ({ value }) =>
        /^[A-Za-z0-9_]{3,30}$/.test(value())
          ? undefined
          : { kind: 'username', message: 'Usa 3–30 letras, números o _.' },
      );
      validate(p.password, ({ value }) =>
        passwordValid(value())
          ? undefined
          : { kind: 'password', message: 'Usa entre 12 y 128 caracteres.' },
      );
    } else if (this.mode === 'login') required(p.password, { message: 'Escribe tu contraseña.' });
  });

  send(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    this.fields().markAsTouched();
    void submit(this.fields, async () => {
      this.busy.set(true);
      this.error.set('');
      this.message.set('');
      const value = this.model();
      try {
        if (this.mode === 'login') {
          await this.session.login({ email: value.email.trim(), password: value.password });
          await this.router.navigateByUrl(
            this.link.read('email-change') ? '/confirmar-cambio-correo' : '/perfil',
            { replaceUrl: true },
          );
        } else {
          if (this.mode === 'register')
            await this.api.register({
              email: value.email.trim(),
              username: value.username,
              password: value.password,
            });
          else await this.api.forgot({ email: value.email.trim() });
          this.message.set(MAIL_ACCEPTED);
        }
      } catch (error) {
        this.error.set(
          this.mode === 'login' &&
            error instanceof Error &&
            'status' in error &&
            error.status === 401
            ? 'Correo o contraseña incorrectos.'
            : identityError(error),
        );
      } finally {
        this.fields.password().reset('');
        this.busy.set(false);
      }
    });
  }
  ionViewWillEnter() {
    this.message.set(this.session.notice());
    this.session.notice.set('');
  }
  ionViewDidLeave() {
    this.model.set({ email: '', username: '', password: '' });
    this.error.set('');
    this.message.set('');
  }
}

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
import { ProfileDetails } from '../../shared/identity/profile-details';
import { Feedback } from '../../shared/identity/feedback';
import { passwordValid } from '../../shared/identity/validators';
import { IdentityApi, identityError, MAIL_ACCEPTED } from '../../core/api/identity-api';
import { Session } from '../../core/session/session';

@Component({
  imports: [PageFrame, TextField, ProfileDetails, Feedback, FormField, IonButton, RouterLink],
  selector: 'app-account-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fc-page-frame
    [narrow]="true"
    [profileEditor]="mode === 'profile'"
    [back]="mode === 'profile' ? '/perfil' : '/ajustes'"
  >
    <section class="identity-card">
      <h1>{{ title }}</h1>
      <fc-feedback [busy]="loading()" [error]="loadError()" />
      @if (loadError()) {
        <ion-button fill="outline" (click)="load()" [disabled]="loading()">Reintentar</ion-button>
      }
      @if (session.profile(); as own) {
        @if (mode === 'profile') {
          <fc-profile-details [profile]="own.profile" [editing]="true" />
          <div class="avatar-actions">
            <input
              #file
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              (change)="upload($event)"
            />
            <ion-button fill="outline" (click)="file.click()" [disabled]="busy()"
              >Cambiar foto</ion-button
            >
            @if (own.profile.avatar) {
              <ion-button fill="outline" (click)="removePhoto()" [disabled]="busy()"
                >Quitar foto</ion-button
              >
            }
            <p class="muted">JPG, PNG o WebP · Máx. 5 MiB</p>
          </div>
        }
        <form (submit)="save($event)" novalidate [attr.aria-busy]="busy()">
          @if (mode === 'profile') {
            <fc-text-field
              label="Usuario"
              autocomplete="username"
              helper="3–30 caracteres: letras, números y _."
              [formField]="fields.username"
            />
            <fc-text-field label="Liga (opcional)" [formField]="fields.league" />
          } @else {
            @if (mode === 'email') {
              <dl>
                <dt>Correo actual <span class="muted">· Privado</span></dt>
                <dd>{{ own.email }}</dd>
              </dl>
              <fc-text-field
                label="Nuevo correo"
                type="email"
                autocomplete="email"
                [formField]="fields.email"
              />
            }
            <fc-text-field
              label="Contraseña actual"
              type="password"
              autocomplete="current-password"
              [formField]="fields.current"
            />
            @if (mode === 'password') {
              <fc-text-field
                label="Nueva contraseña"
                type="password"
                autocomplete="new-password"
                helper="12–128 caracteres."
                [formField]="fields.password"
              />
              <fc-text-field
                label="Repetir contraseña"
                type="password"
                autocomplete="new-password"
                [formField]="fields.repeat"
              />
              <p>Se cerrarán todas las sesiones, incluida esta.</p>
            } @else {
              <p>Tu correo actual se mantiene hasta verificar el nuevo.</p>
            }
          }
          <fc-feedback [busy]="busy()" [error]="error()" [message]="message()" />
          <ion-button type="submit" expand="block" [disabled]="busy()">{{
            mode === 'profile'
              ? 'Guardar cambios'
              : mode === 'password'
                ? 'Guardar contraseña'
                : 'Enviar enlace'
          }}</ion-button>
          <ion-button
            expand="block"
            fill="outline"
            [routerLink]="mode === 'profile' ? '/perfil' : '/ajustes'"
            [disabled]="busy()"
            >Cancelar</ion-button
          >
        </form>
      }
    </section>
  </fc-page-frame>`,
})
export class AccountFormPage extends AccessiblePage {
  private readonly api = inject(IdentityApi);
  private readonly router = inject(Router);
  readonly session = inject(Session);
  readonly mode = inject(ActivatedRoute).snapshot.data['mode'] as 'profile' | 'password' | 'email';
  readonly title =
    this.mode === 'profile'
      ? 'Editar perfil'
      : this.mode === 'password'
        ? 'Cambiar contraseña'
        : 'Cambiar correo';
  readonly busy = signal(false);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly error = signal('');
  readonly message = signal('');
  readonly model = signal({
    username: '',
    league: '',
    email: '',
    current: '',
    password: '',
    repeat: '',
  });
  readonly fields = form(this.model, (p) => {
    disabled(p, () => this.busy());
    if (this.mode === 'profile') {
      validate(p.username, ({ value }) =>
        /^[A-Za-z0-9_]{3,30}$/.test(value())
          ? undefined
          : { kind: 'username', message: 'Usa 3–30 letras, números o _.' },
      );
      validate(p.league, ({ value }) =>
        [...value().trim()].length <= 100 && !/[\p{Cc}\p{Cs}<>]/u.test(value())
          ? undefined
          : { kind: 'league', message: 'Usa hasta 100 caracteres de texto.' },
      );
    } else {
      required(p.current, { message: 'Escribe tu contraseña actual.' });
      if (this.mode === 'email') {
        required(p.email, { message: 'Escribe el nuevo correo.' });
        email(p.email, { message: 'Escribe un correo válido.' });
      } else {
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
      }
    }
  });
  async load() {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');
    try {
      const own = await this.api.own();
      this.session.profile.set(own);
      this.model.set({
        username: own.profile.username,
        league: own.profile.leagueName ?? '',
        email: '',
        current: '',
        password: '',
        repeat: '',
      });
    } catch (error) {
      this.loadError.set(identityError(error));
    } finally {
      this.loading.set(false);
    }
  }
  ionViewWillEnter() {
    void this.load();
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
  save(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    this.fields().markAsTouched();
    void submit(this.fields, async () => {
      const v = this.model();
      await this.run(
        async () => {
          if (this.mode === 'profile')
            this.session.profile.set(
              await this.api.patch({ username: v.username, leagueName: v.league.trim() || null }),
            );
          else if (this.mode === 'email')
            await this.api.requestEmail({ newEmail: v.email.trim(), currentPassword: v.current });
          else {
            await this.api.changePassword({ currentPassword: v.current, newPassword: v.password });
            this.session.closed();
            this.session.notice.set('Contraseña actualizada.');
            await this.router.navigateByUrl('/iniciar-sesion', { replaceUrl: true });
          }
        },
        this.mode === 'email'
          ? MAIL_ACCEPTED
          : this.mode === 'password'
            ? 'Contraseña actualizada.'
            : 'Cambios guardados.',
      );
      this.fields.current().reset('');
      this.fields.password().reset('');
      this.fields.repeat().reset('');
    });
  }
  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy()) return;
    if (file.size > 5242880) {
      this.error.set('La foto supera los 5 MiB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.error.set('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }
    await this.run(async () => {
      await this.api.avatar(file);
      this.session.profile.set(await this.api.own());
    }, 'Foto actualizada.');
  }
  removePhoto() {
    void this.run(async () => {
      await this.api.removeAvatar();
      this.session.profile.set(await this.api.own());
    }, 'Foto eliminada.');
  }
  ionViewDidLeave() {
    this.model.set({ username: '', league: '', email: '', current: '', password: '', repeat: '' });
    this.error.set('');
    this.message.set('');
  }
}

import { Component, effect, input, signal } from '@angular/core';
import { IonAvatar, IonButton } from '@ionic/angular';
import type { PublicProfile } from '../../core/api/types.gen';
import { safeAvatar } from './validators';

@Component({
  selector: 'fc-profile-details',
  imports: [IonAvatar, IonButton],
  template: `@if (profile(); as p) {
    <section class="profile-summary">
      <ion-avatar>
        @if (avatar(p) && !failed()) {
          <img [src]="avatar(p)" alt="" referrerpolicy="no-referrer" (error)="failed.set(true)" />
        } @else {
          <span aria-hidden="true">{{ initials(p) }}</span>
        }
      </ion-avatar>
      @if (!editing()) {
        <h2>{{ p.username }}</h2>
        @if (p.leagueName) {
          <p>{{ p.leagueName }}</p>
        }
      }
      <dl>
        <dt>ID público</dt>
        <dd class="public-id">{{ p.publicId }}</dd>
      </dl>
      <ion-button fill="outline" (click)="copy(p.publicId)">Copiar ID</ion-button>
      @if (copied()) {
        <p role="status">{{ copied() }}</p>
      }
      @if (email()) {
        <dl>
          <dt>Correo <span class="muted">· Privado</span></dt>
          <dd>{{ email() }}</dd>
        </dl>
      }
    </section>
  }`,
})
export class ProfileDetails {
  readonly profile = input<PublicProfile>();
  readonly email = input('');
  readonly editing = input(false);
  readonly failed = signal(false);
  readonly copied = signal('');
  constructor() {
    effect(() => {
      this.profile();
      this.failed.set(false);
    });
  }
  avatar(p: PublicProfile) {
    return safeAvatar(p.avatar?.url);
  }
  initials(p: PublicProfile) {
    return [...p.username].slice(0, 2).join('').toUpperCase();
  }
  async copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      this.copied.set('ID copiado.');
    } catch {
      this.copied.set('No se pudo copiar. Selecciona el ID.');
    }
  }
}

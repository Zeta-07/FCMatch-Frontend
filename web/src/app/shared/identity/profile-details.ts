import { Component, effect, input, signal } from '@angular/core';
import { IonAvatar, IonButton, IonIcon } from '@ionic/angular';
import { copyOutline } from 'ionicons/icons';
import type { NumericPublicProfile } from '../../core/api/types.gen';
import { safeAvatar } from './validators';

@Component({
  selector: 'fc-profile-details',
  imports: [IonAvatar, IonButton, IonIcon],
  template: `@if (profile(); as p) {
    <section class="profile-summary">
      <ion-avatar>
        @if (avatar(p) && !failed()) {
          <img [src]="avatar(p)" alt="" referrerpolicy="no-referrer" (error)="failed.set(true)" />
        } @else {
          <span aria-hidden="true">{{ initials(p) }}</span>
        }
      </ion-avatar>
      <div class="profile-identity">
        @if (!editing()) {
          <h2>{{ p.username }}</h2>
          @if (p.leagueName) {
            <p>{{ p.leagueName }}</p>
          }
        }
        @if (email()) {
          <p class="profile-email">{{ email() }} <span class="private-label">Privado</span></p>
        }
      </div>
      <div class="profile-id-row">
        <dl>
          <dt>ID público</dt>
          <dd class="public-id">{{ p.publicNumber }}</dd>
        </dl>
        <ion-button fill="clear" (click)="copy(p.publicNumber)"
          ><ion-icon slot="start" [icon]="copyIcon" aria-hidden="true" />Copiar ID</ion-button
        >
      </div>
      @if (copied()) {
        <p role="status">{{ copied() }}</p>
      }
    </section>
  }`,
})
export class ProfileDetails {
  readonly copyIcon = copyOutline;
  readonly profile = input<NumericPublicProfile>();
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
  avatar(p: NumericPublicProfile) {
    return safeAvatar(p.avatar?.url);
  }
  initials(p: NumericPublicProfile) {
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

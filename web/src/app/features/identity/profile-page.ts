import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular';
import { PageFrame } from '../../shared/identity/page-frame';
import { AccessiblePage } from '../../shared/identity/accessible-page';
import { ProfileDetails } from '../../shared/identity/profile-details';
import { Feedback } from '../../shared/identity/feedback';
import { IdentityApi, identityError } from '../../core/api/identity-api';
import { Session } from '../../core/session/session';
import type { NumericPublicProfile } from '../../core/api/types.gen';

@Component({
  imports: [PageFrame, ProfileDetails, Feedback, IonButton, RouterLink],
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fc-page-frame [publicView]="publicView"
    ><h1>{{ publicView ? 'Perfil' : 'Mi perfil' }}</h1>
    <fc-feedback [busy]="busy()" [error]="error()" />
    @if (error()) {
      <ion-button fill="outline" (click)="load()" [disabled]="busy()">Reintentar</ion-button>
    }
    @if (publicView ? publicProfile() : session.profile()?.profile; as p) {
      <section class="identity-card">
        <fc-profile-details
          [profile]="p"
          [email]="publicView ? '' : (session.profile()?.email ?? '')"
        />
        @if (!publicView) {
          <div class="actions">
            <ion-button routerLink="/editar-perfil">Editar perfil</ion-button
            ><ion-button routerLink="/ajustes" fill="outline">Ajustes</ion-button>
          </div>
        }
      </section>
      <div class="profile-empty">
        <section class="identity-card">
          <h2>Estadísticas</h2>
          <p class="muted">Aún no disponibles.</p>
        </section>
        <section class="identity-card">
          <h2>Historial</h2>
          <p class="muted">Sin torneos finalizados.</p>
        </section>
      </div>
    }
  </fc-page-frame>`,
})
export class ProfilePage extends AccessiblePage {
  private readonly api = inject(IdentityApi);
  private readonly route = inject(ActivatedRoute);
  readonly session = inject(Session);
  readonly publicView = this.route.snapshot.data['publicView'] === true;
  readonly publicProfile = signal<NumericPublicProfile | undefined>(undefined);
  readonly busy = signal(false);
  readonly error = signal('');
  async load() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      if (this.publicView)
        this.publicProfile.set(
          await this.api.publicProfile(this.route.snapshot.paramMap.get('publicId') ?? ''),
        );
      else this.session.profile.set(await this.api.own());
    } catch (error) {
      this.error.set(identityError(error));
    } finally {
      this.busy.set(false);
    }
  }
  ionViewWillEnter() {
    void this.load();
  }
}

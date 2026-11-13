import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { disabled, form, FormField, submit, validate } from '@angular/forms/signals';
import {
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular';
import { PageFrame } from '../../shared/identity/page-frame';
import { AccessiblePage } from '../../shared/identity/accessible-page';
import { TextField } from '../../shared/identity/text-field';
import { Feedback } from '../../shared/identity/feedback';
import { IdentityApi, identityError } from '../../core/api/identity-api';
import type { NumericPublicProfile } from '../../core/api/types.gen';

@Component({
  imports: [
    PageFrame,
    TextField,
    Feedback,
    FormField,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    RouterLink,
  ],
  selector: 'app-search-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fc-page-frame
    ><h1>Buscar usuarios</h1>
    <ion-segment
      aria-label="Buscar por"
      [disabled]="busy()"
      [value]="byNumber() ? 'id' : 'username'"
      (ionChange)="setMode($event.detail.value === 'id')"
    >
      <ion-segment-button value="username"><ion-label>Usuario</ion-label></ion-segment-button>
      <ion-segment-button value="id"><ion-label>ID público</ion-label></ion-segment-button>
    </ion-segment>
    <form class="search-form" (submit)="search($event)" novalidate>
      <fc-text-field
        [label]="byNumber() ? 'ID público' : 'Usuario'"
        type="search"
        [helper]="byNumber() ? '8 dígitos.' : 'Desde 2 caracteres.'"
        [formField]="fields.search"
      />
      <ion-button type="submit" [disabled]="busy()">Buscar</ion-button>
    </form>
    <fc-feedback [busy]="busy()" [error]="error()" />
    @if (searched() && !busy() && !error() && !items().length) {
      <p role="status">Sin resultados.</p>
    }
    @if (items().length) {
      <ion-list aria-label="Usuarios">
        @for (user of items(); track user.publicNumber) {
          <ion-item lines="full"
            ><ion-label
              ><h2>{{ user.username }}</h2>
              <p>ID {{ user.publicNumber }}</p>
              @if (user.leagueName) {
                <p>{{ user.leagueName }}</p>
              }
            </ion-label>
            <ion-button
              slot="end"
              fill="outline"
              [routerLink]="['/usuarios', user.publicNumber]"
              [attr.aria-label]="'Ver perfil de ' + user.username"
              >Ver perfil</ion-button
            >
          </ion-item>
        }
      </ion-list>
    }
    @if (cursor()) {
      <ion-button fill="outline" (click)="more()" [disabled]="busy()">Cargar más</ion-button>
    }
  </fc-page-frame>`,
})
export class SearchPage extends AccessiblePage {
  private readonly api = inject(IdentityApi);
  private query = '';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly searched = signal(false);
  readonly items = signal<NumericPublicProfile[]>([]);
  readonly byNumber = signal(false);
  setMode(byNumber: boolean) {
    if (this.busy()) return;
    this.byNumber.set(byNumber);
    this.model.set({ search: '' });
    this.items.set([]);
    this.cursor.set(null);
    this.searched.set(false);
    this.error.set('');
  }
  readonly cursor = signal<string | null>(null);
  readonly model = signal({ search: '' });
  readonly fields = form(this.model, (p) => {
    disabled(p, () => this.busy());
    validate(p.search, ({ value }) =>
      (this.byNumber() ? /^[1-9][0-9]{7}$/ : /^[A-Za-z0-9_]{2,30}$/).test(value())
        ? undefined
        : {
            kind: 'search',
            message: this.byNumber()
              ? 'Escribe un ID de 8 dígitos.'
              : 'Usa 2–30 letras, números o _.',
          },
    );
  });
  search(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    this.fields().markAsTouched();
    void submit(this.fields, async () => {
      this.query = this.model().search;
      this.items.set([]);
      this.cursor.set(null);
      await this.load(false);
    });
  }
  private async load(more: boolean) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const page = await this.api.search(
        this.query,
        more ? (this.cursor() ?? undefined) : undefined,
        this.byNumber(),
      );
      this.items.update((items) =>
        more
          ? [
              ...items,
              ...page.items.filter(
                (item) => !items.some((p) => p.publicNumber === item.publicNumber),
              ),
            ]
          : page.items,
      );
      this.cursor.set(page.nextCursor);
      this.searched.set(true);
    } catch (error) {
      this.error.set(identityError(error));
    } finally {
      this.busy.set(false);
    }
  }
  more() {
    if (this.cursor()) void this.load(true);
  }
  ionViewDidLeave() {
    this.items.set([]);
    this.cursor.set(null);
    this.model.set({ search: '' });
    this.searched.set(false);
    this.error.set('');
  }
}

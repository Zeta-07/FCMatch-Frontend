import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { disabled, form, FormField, submit, validate } from '@angular/forms/signals';
import { IonButton, IonList, IonItem, IonLabel } from '@ionic/angular';
import { PageFrame } from '../../shared/identity/page-frame';
import { AccessiblePage } from '../../shared/identity/accessible-page';
import { TextField } from '../../shared/identity/text-field';
import { Feedback } from '../../shared/identity/feedback';
import { IdentityApi, identityError } from '../../core/api/identity-api';
import { Session } from '../../core/session/session';
import type { NumericPublicProfile } from '../../core/api/types.gen';
import { SearchReturn } from '../../shared/identity/search-return';

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
    RouterLink,
  ],
  selector: 'app-search-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fc-page-frame [trackScroll]="true" (scrollPosition)="scrollTop = $event"
    ><h1>Buscar usuarios</h1>
    <form class="search-form" (submit)="search($event)" novalidate>
      <fc-text-field
        label="Usuario o ID público"
        type="search"
        helper="Desde 2 caracteres."
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
              ><h2>
                {{ user.username }}
                @if (user.publicNumber === session.profile()?.profile?.publicNumber) {
                  <span class="muted">· Tú</span>
                }
              </h2>
              <p>ID {{ user.publicNumber }}</p>
              @if (user.leagueName) {
                <p>{{ user.leagueName }}</p>
              }
            </ion-label>
            <ion-button
              slot="end"
              fill="outline"
              [routerLink]="['/usuarios', user.publicNumber]"
              routerDirection="forward"
              (click)="remember($event, user.publicNumber)"
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
  private readonly searchReturn = inject(SearchReturn);
  private readonly frame = viewChild.required(PageFrame);
  private openingProfile = false;
  private restoreScroll: number | undefined;
  private requestVersion = 0;
  scrollTop = 0;
  readonly session = inject(Session);
  private readonly api = inject(IdentityApi);
  private query = '';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly searched = signal(false);
  readonly items = signal<NumericPublicProfile[]>([]);
  readonly cursor = signal<string | null>(null);
  readonly model = signal({ search: '' });
  readonly fields = form(this.model, (p) => {
    disabled(p, () => this.busy());
    validate(p.search, ({ value }) =>
      /^[A-Za-z0-9_]{2,30}$/.test(value().trim())
        ? undefined
        : {
            kind: 'search',
            message: 'Usa 2–30 letras, números o _.',
          },
    );
  });
  search(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    this.fields().markAsTouched();
    void submit(this.fields, async () => {
      this.query = this.model().search.trim();
      this.items.set([]);
      this.cursor.set(null);
      await this.load(false);
    });
  }
  private async load(more: boolean) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const requestVersion = ++this.requestVersion;
    try {
      if (!this.session.profile()) {
        const revision = this.session.revision();
        const own = await this.api.own();
        if (revision !== this.session.revision() || requestVersion !== this.requestVersion) return;
        this.session.profile.set(own);
      }
      const page = await this.api.search(
        this.query,
        more ? (this.cursor() ?? undefined) : undefined,
      );
      if (requestVersion !== this.requestVersion) return;
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
      if (requestVersion === this.requestVersion) this.error.set(identityError(error));
    } finally {
      if (requestVersion === this.requestVersion) this.busy.set(false);
    }
  }
  more() {
    if (this.cursor()) void this.load(true);
  }
  remember(event: MouseEvent, target: string) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    this.openingProfile = true;
    this.searchReturn.save({
      target,
      query: this.query,
      input: this.model().search,
      items: this.items(),
      cursor: this.cursor(),
      searched: this.searched(),
      scrollTop: this.scrollTop,
    });
  }
  ionViewWillEnter() {
    const snapshot = this.searchReturn.read();
    if (!snapshot) return;
    this.query = snapshot.query;
    this.model.set({ search: snapshot.input });
    this.items.set(snapshot.items);
    this.cursor.set(snapshot.cursor);
    this.searched.set(snapshot.searched);
    this.restoreScroll = snapshot.scrollTop;
    this.searchReturn.clear();
  }
  override ionViewDidEnter() {
    super.ionViewDidEnter();
    if (this.restoreScroll !== undefined) {
      void this.frame().scrollTo(this.restoreScroll);
      this.restoreScroll = undefined;
    }
  }
  ionViewDidLeave() {
    ++this.requestVersion;
    this.busy.set(false);
    if (!this.openingProfile) this.searchReturn.clear();
    this.openingProfile = false;
    this.items.set([]);
    this.cursor.set(null);
    this.model.set({ search: '' });
    this.searched.set(false);
    this.error.set('');
  }
}

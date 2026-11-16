import { Component, input } from '@angular/core';
import { IonSpinner } from '@ionic/angular';
@Component({
  selector: 'fc-feedback',
  imports: [IonSpinner],
  template: `@if (busy()) {
      <p role="status"><ion-spinner aria-hidden="true" /> Cargando…</p>
    }
    @if (error()) {
      <p class="feedback error" role="alert">{{ error() }}</p>
    }
    @if (message()) {
      <p class="feedback" role="status">{{ message() }}</p>
    }`,
})
export class Feedback {
  readonly busy = input(false);
  readonly error = input('');
  readonly message = input('');
}

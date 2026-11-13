import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { IonInput, IonButton } from '@ionic/angular';

let nextField = 0;

@Component({
  selector: 'fc-text-field',
  imports: [IonInput, IonButton],
  host: { '[class.invalid]': 'touched() && invalid()' },
  styles: `
    :host(.invalid) ion-input {
      --border-color: var(--status-danger);
    }
    .field-hint {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .field-error {
      color: var(--text-primary);
      border-inline-start: 3px solid var(--status-danger);
      padding-inline-start: 0.5rem;
    }
  `,
  template: `<ion-input
      #control
      fill="outline"
      labelPlacement="stacked"
      [label]="label()"
      [type]="type() === 'password' && visible() ? 'text' : type()"
      [autocomplete]="autocomplete()"
      [value]="value()"
      (ionInput)="value.set($event.detail.value ?? '')"
      (ionBlur)="touch.emit()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      [name]="name()"
      autocapitalize="off"
      [spellcheck]="false"
    >
      @if (type() === 'password') {
        <ion-button
          slot="end"
          fill="clear"
          type="button"
          (click)="visible.set(!visible())"
          [disabled]="disabled()"
          [attr.aria-pressed]="visible()"
          [attr.aria-label]="(visible() ? 'Ocultar ' : 'Mostrar ') + label().toLowerCase()"
          >{{ visible() ? 'Ocultar' : 'Mostrar' }}</ion-button
        >
      }
    </ion-input>
    @if (touched() && invalid()) {
      <p class="field-hint field-error" [id]="descriptionId" role="alert">{{ message() }}</p>
    } @else if (helper()) {
      <p class="field-hint" [id]="descriptionId">{{ helper() }}</p>
    }`,
})
export class TextField implements FormValueControl<string> {
  readonly value = model('');
  readonly visible = signal(false);
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password' | 'search'>('text');
  readonly autocomplete = input<'off' | 'username' | 'email' | 'current-password' | 'new-password'>(
    'off',
  );
  readonly helper = input('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly required = input(false);
  readonly name = input('');
  readonly touched = input(false);
  readonly invalid = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touch = output<void>();
  readonly message = computed(() => this.errors()[0]?.message ?? 'Revisa este campo.');
  readonly descriptionId = `fc-field-description-${++nextField}`;
  private readonly control = viewChild.required<IonInput>('control');
  constructor() {
    effect(() => {
      if (!this.value()) this.visible.set(false);
    });
    // Ionic's Angular CVA manages ion-invalid classes for NgControl, not Signal Forms.
    // Render explicit feedback and associate it with the actual native input instead.
    afterRenderEffect(() => {
      const invalid = this.touched() && this.invalid();
      const described = invalid || this.helper();
      void this.control()
        .getInputElement()
        .then((input) => {
          input.setAttribute('aria-invalid', String(invalid));
          if (described) input.setAttribute('aria-describedby', this.descriptionId);
          else input.removeAttribute('aria-describedby');
        });
    });
  }
  focus() {
    void this.control().setFocus();
  }
}

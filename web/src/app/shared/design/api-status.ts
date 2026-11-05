import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { IonButton } from '@ionic/angular';
import { API_BASE_URL } from '../../core/api/api-base-url';
import type { Health } from '../../core/api/types.gen';

@Component({
  selector: 'fc-api-status',
  imports: [IonButton],
  template:
    '<section class="connection-state" aria-label="Conectividad de infraestructura"><p role="status">{{ message() }}</p><ion-button (click)="check()" [disabled]="loading()">Comprobar conexión</ion-button></section>',
})
export class ApiStatus {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  readonly message = signal('Comprobando API y PostgreSQL…');
  readonly loading = signal(false);

  constructor() {
    this.check();
  }

  check() {
    this.loading.set(true);
    this.http.get<Health>(`${this.baseUrl}/health`).subscribe({
      next: (health) => {
        this.message.set(
          health.status === 'ok' && health.database === 'connected'
            ? 'API y PostgreSQL conectados.'
            : 'La respuesta de la API no es válida.',
        );
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.message.set(
          error instanceof HttpErrorResponse && error.status === 503
            ? 'La API responde, pero PostgreSQL no está disponible.'
            : 'No se pudo conectar con la API.',
        );
        this.loading.set(false);
      },
    });
  }
}

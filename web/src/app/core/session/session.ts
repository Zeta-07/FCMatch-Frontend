import { Injectable, inject, signal } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url';
import type {
  BrowserSession,
  CsrfContext,
  LoginRequestWritable,
  NumericOwnProfile,
} from '../api/types.gen';

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly base = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private access = '';
  private expires = 0;
  private csrf: CsrfContext | undefined;
  private csrfFlight: Promise<string> | undefined;
  private refreshFlight: Promise<string> | undefined;
  private blocked = false;
  private version = 0;
  private readonly channel =
    typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel('fcmatch-session');
  readonly authenticated = signal(false);
  readonly profile = signal<NumericOwnProfile | undefined>(undefined);
  readonly notice = signal('');
  revision() {
    return this.version;
  }
  forgetProof() {
    this.csrf = undefined;
  }

  constructor() {
    if (this.channel)
      this.channel.onmessage = (event: MessageEvent<unknown>) => {
        if (event.data === 'changed' || event.data === 'closed') this.invalidate(true);
      };
  }

  private lock<T>(work: () => Promise<T>) {
    return navigator.locks ? navigator.locks.request('fcmatch-session', work) : work();
  }

  private grant(value: BrowserSession) {
    this.access = value.accessToken;
    this.expires = Math.min(
      Date.now() + value.expiresIn * 1000,
      Date.parse(value.sessionExpiresAt),
    );
    this.csrf = value;
    this.authenticated.set(true);
    this.blocked = false;
    return this.access;
  }

  async proof(force = false): Promise<string> {
    if (!force && this.csrf && Date.parse(this.csrf.csrfExpiresAt) > Date.now() + 5000)
      return this.csrf.csrfToken;
    if (this.csrfFlight) return this.csrfFlight;
    const version = this.version;
    this.csrfFlight = firstValueFrom(
      this.http.get<CsrfContext>(`${this.base}/auth/csrf`, {
        withCredentials: true,
        timeout: 15000,
        cache: 'no-store',
      }),
    )
      .then((value) => {
        if (version !== this.version) throw new Error('SESSION_CHANGED');
        this.csrf = value;
        return value.csrfToken;
      })
      .finally(() => {
        this.csrfFlight = undefined;
      });
    return this.csrfFlight;
  }

  async token(): Promise<string> {
    if (this.access && this.expires > Date.now() + 15000) return this.access;
    if (this.blocked || !navigator.locks) throw new Error('LOGIN_REQUIRED');
    if (this.refreshFlight) return this.refreshFlight;
    const version = this.version;
    this.refreshFlight = this.lock(async () => {
      if (version !== this.version) throw new Error('SESSION_CHANGED');
      const proof = await this.proof(true);
      const value = await firstValueFrom(
        this.http.post<BrowserSession>(
          `${this.base}/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'X-CSRF-Token': proof }, timeout: 15000 },
        ),
      );
      if (version !== this.version) throw new Error('SESSION_CHANGED');
      return this.grant(value);
    })
      .catch((error: unknown) => {
        // A timeout may follow a committed rotation: never retry the refresh.
        if (version === this.version) this.invalidate(false);
        throw error;
      })
      .finally(() => {
        this.refreshFlight = undefined;
      });
    return this.refreshFlight;
  }

  async login(input: LoginRequestWritable) {
    return this.lock(async () => {
      const proof = await this.proof(true);
      const value = await firstValueFrom(
        this.http.post<BrowserSession>(`${this.base}/auth/login`, input, {
          withCredentials: true,
          headers: { 'X-CSRF-Token': proof },
          timeout: 15000,
        }),
      );
      this.version++;
      this.profile.set(undefined);
      this.grant(value);
      this.channel?.postMessage('changed');
    });
  }

  async logout(all = false) {
    const token = all ? await this.token() : '';
    return this.lock(async () => {
      const proof = await this.proof(true);
      await firstValueFrom(
        this.http.post<void>(
          `${this.base}/auth/${all ? 'logout-all' : 'logout'}`,
          {},
          {
            withCredentials: true,
            headers: {
              'X-CSRF-Token': proof,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            timeout: 15000,
          },
        ),
      );
      this.closed();
    });
  }

  closed() {
    this.invalidate(false);
    this.channel?.postMessage('closed');
  }

  invalidate(navigate: boolean) {
    this.version++;
    this.access = '';
    this.expires = 0;
    this.csrf = undefined;
    this.blocked = true;
    this.authenticated.set(false);
    this.profile.set(undefined);
    if (navigate && !this.router.url.startsWith('/confirmar-cambio-correo'))
      void this.router.navigateByUrl('/iniciar-sesion', { replaceUrl: true });
  }

  failed(error: unknown) {
    if (error instanceof HttpErrorResponse && error.status === 401) this.invalidate(true);
    if (error instanceof HttpErrorResponse && error.status === 403) this.csrf = undefined;
  }
}

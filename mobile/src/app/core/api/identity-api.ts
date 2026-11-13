import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { catchError, firstValueFrom, from, map, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { Session } from '../session/session';
import type {
  AcceptedRequest,
  Avatar,
  ActionTokenRequestWritable,
  ChangePasswordRequestWritable,
  EmailChangeRequestWritable,
  EmailRequest,
  NumericOwnProfile,
  NumericPublicProfile,
  RegisterRequestWritable,
  ResetPasswordRequestWritable,
  UpdateProfileRequest,
  NumericUsersPage,
} from './types.gen';

const PROTECTED = new HttpContextToken(() => false);
export const identityInterceptor: HttpInterceptorFn = (req, next) => {
  const base = inject(API_BASE_URL);
  if (!(req.url === base || req.url.startsWith(`${base}/`))) return next(req);
  const session = inject(Session);
  return from(
    (async () => {
      const token = req.context.get(PROTECTED) ? await session.token() : '';
      const revision = session.revision();
      const csrf = ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? '' : await session.proof();
      if (req.context.get(PROTECTED) && revision !== session.revision())
        throw new Error('SESSION_CHANGED');
      return {
        request: req.clone({
          withCredentials: true,
          setHeaders: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
          },
        }),
        revision,
      };
    })(),
  ).pipe(
    switchMap(({ request, revision }) =>
      next(request).pipe(
        map((event) => {
          if (req.context.get(PROTECTED) && revision !== session.revision())
            throw new Error('SESSION_CHANGED');
          return event;
        }),
      ),
    ),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 403) session.forgetProof();
      if (req.context.get(PROTECTED)) session.failed(error);
      return throwError(() => error);
    }),
  );
};

export function identityError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Inicia sesión para continuar.';
  if (error.status === 0) return 'No se pudo conectar. Comprueba tu conexión.';
  if (error.status === 429) return 'Demasiados intentos. Inténtalo más tarde.';
  if (error.status === 401) return 'No se pudo autenticar la solicitud.';
  if (error.status === 403) return 'La solicitud no es válida. Vuelve a intentarlo.';
  if (error.status === 413) return 'La foto supera los 5 MiB.';
  if (error.status === 415) return 'Selecciona una imagen JPG, PNG o WebP.';
  if (error.status === 404) return 'No se encontró el perfil.';
  if (error.status === 409) return 'El usuario no está disponible.';
  if (error.status === 400) return 'Enlace vencido o no válido.';
  if (error.status === 422) return 'Revisa los datos del formulario.';
  return 'El servicio no está disponible. Inténtalo más tarde.';
}

export const MAIL_ACCEPTED =
  'Si corresponde, recibirás un correo. La recepción no está garantizada.';

@Injectable({ providedIn: 'root' })
export class IdentityApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private options(protectedRequest = false) {
    return {
      context: new HttpContext().set(PROTECTED, protectedRequest),
      timeout: 15000,
      cache: 'no-store' as const,
      headers: { Accept: 'application/vnd.fcmatch.identity.v2+json' },
    };
  }
  register(body: RegisterRequestWritable) {
    return firstValueFrom(
      this.http.post<AcceptedRequest>(`${this.base}/auth/register`, body, this.options()),
    );
  }
  resend(body: EmailRequest) {
    return firstValueFrom(
      this.http.post<AcceptedRequest>(
        `${this.base}/auth/resend-verification`,
        body,
        this.options(),
      ),
    );
  }
  forgot(body: EmailRequest) {
    return firstValueFrom(
      this.http.post<AcceptedRequest>(`${this.base}/auth/forgot-password`, body, this.options()),
    );
  }
  verify(body: ActionTokenRequestWritable) {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/auth/verify-email`, body, this.options()),
    );
  }
  reset(body: ResetPasswordRequestWritable) {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/auth/reset-password`, body, this.options()),
    );
  }
  changePassword(body: ChangePasswordRequestWritable) {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/auth/change-password`, body, this.options(true)),
    );
  }
  own() {
    return firstValueFrom(
      this.http.get<NumericOwnProfile>(`${this.base}/users/me`, this.options(true)),
    );
  }
  patch(body: UpdateProfileRequest) {
    return firstValueFrom(
      this.http.patch<NumericOwnProfile>(`${this.base}/users/me`, body, this.options(true)),
    );
  }
  publicProfile(id: string) {
    return firstValueFrom(
      this.http.get<NumericPublicProfile>(
        `${this.base}/users/${encodeURIComponent(id)}`,
        this.options(),
      ),
    );
  }
  search(search: string, cursor?: string, byNumber = false) {
    return firstValueFrom(
      this.http.get<NumericUsersPage>(`${this.base}/users`, {
        ...this.options(true),
        params: {
          ...(byNumber ? { publicNumber: search } : { search }),
          ...(cursor ? { cursor } : {}),
        },
      }),
    );
  }
  avatar(file: File) {
    const body = new FormData();
    body.append('file', file);
    return firstValueFrom(
      this.http.put<Avatar>(`${this.base}/users/me/avatar`, body, this.options(true)),
    );
  }
  removeAvatar() {
    return firstValueFrom(
      this.http.delete<void>(`${this.base}/users/me/avatar`, this.options(true)),
    );
  }
  requestEmail(body: EmailChangeRequestWritable) {
    return firstValueFrom(
      this.http.post<AcceptedRequest>(
        `${this.base}/users/me/email-change`,
        body,
        this.options(true),
      ),
    );
  }
  confirmEmail(body: ActionTokenRequestWritable) {
    return firstValueFrom(
      this.http.post<NumericOwnProfile>(
        `${this.base}/users/me/email-change/confirm`,
        body,
        this.options(true),
      ),
    );
  }
}

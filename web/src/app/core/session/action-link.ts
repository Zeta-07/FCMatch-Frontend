import { Injectable } from '@angular/core';

type Purpose = 'verification' | 'reset' | 'email-change';
let pending: { purpose: Purpose; token: string } | undefined;

// Called before bootstrap, configuration requests or routing. Never consume a token on GET.
export function captureActionLink() {
  const purposes: Record<string, Purpose> = {
    '/verificar-correo': 'verification',
    '/restablecer-contrasena': 'reset',
    '/confirmar-cambio-correo': 'email-change',
  };
  const purpose = purposes[location.pathname];
  if (!purpose) return;
  const token = new URLSearchParams(location.hash.slice(1)).get('token');
  history.replaceState(null, '', location.pathname);
  if (token && /^[A-Za-z0-9_-]{43,256}$/.test(token)) pending = { purpose, token };
}

@Injectable({ providedIn: 'root' })
export class ActionLink {
  read(purpose: Purpose) {
    return pending?.purpose === purpose ? pending.token : '';
  }
  clear() {
    pending = undefined;
  }
}

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

export const sessionGuard: CanActivateFn = async () => {
  const session = inject(Session);
  const router = inject(Router);
  try {
    await session.token();
    return true;
  } catch {
    return router.parseUrl('/iniciar-sesion');
  }
};

import { Routes } from '@angular/router';
import { sessionGuard } from './core/session/session-guard';

export const routes: Routes = [
  {
    path: 'iniciar-sesion',
    title: 'Iniciar sesión · FCMatch',
    data: { mode: 'login' },
    loadComponent: () => import('./features/identity/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · FCMatch',
    data: { mode: 'register' },
    loadComponent: () => import('./features/identity/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar contraseña · FCMatch',
    data: { mode: 'forgot' },
    loadComponent: () => import('./features/identity/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'verificar-correo',
    title: 'Verificar correo · FCMatch',
    data: { mode: 'verification' },
    loadComponent: () => import('./features/identity/action-page').then((m) => m.ActionPage),
  },
  {
    path: 'restablecer-contrasena',
    title: 'Restablecer contraseña · FCMatch',
    data: { mode: 'reset' },
    loadComponent: () => import('./features/identity/action-page').then((m) => m.ActionPage),
  },
  {
    path: 'confirmar-cambio-correo',
    title: 'Confirmar correo · FCMatch',
    data: { mode: 'email-change' },
    loadComponent: () => import('./features/identity/action-page').then((m) => m.ActionPage),
  },
  {
    path: 'perfil',
    title: 'Mi perfil · FCMatch',
    canActivate: [sessionGuard],
    loadComponent: () => import('./features/identity/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'editar-perfil',
    title: 'Editar perfil · FCMatch',
    data: { mode: 'profile' },
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/identity/account-form-page').then((m) => m.AccountFormPage),
  },
  {
    path: 'cambiar-contrasena',
    title: 'Cambiar contraseña · FCMatch',
    data: { mode: 'password' },
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/identity/account-form-page').then((m) => m.AccountFormPage),
  },
  {
    path: 'cambiar-correo',
    title: 'Cambiar correo · FCMatch',
    data: { mode: 'email' },
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/identity/account-form-page').then((m) => m.AccountFormPage),
  },
  {
    path: 'buscar',
    title: 'Buscar usuarios · FCMatch',
    canActivate: [sessionGuard],
    loadComponent: () => import('./features/identity/search-page').then((m) => m.SearchPage),
  },
  {
    path: 'usuarios/:publicId',
    title: 'Perfil · FCMatch',
    data: { publicView: true },
    loadComponent: () => import('./features/identity/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'ajustes',
    title: 'Ajustes · FCMatch',
    canActivate: [sessionGuard],
    loadComponent: () => import('./features/identity/settings-page').then((m) => m.SettingsPage),
  },
  {
    path: 'estado',
    title: 'Conexión · FCMatch',
    loadComponent: () => import('./features/infrastructure/status-page').then((m) => m.StatusPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'perfil' },
  { path: '**', redirectTo: 'perfil' },
];

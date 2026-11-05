import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'estado',
    loadComponent: () =>
      import('./features/infrastructure/status-page').then((module) => module.StatusPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'estado' },
  { path: '**', redirectTo: 'estado' },
];

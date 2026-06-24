import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'Faye Adams | UK Mortgage & Protection Adviser | Future Mortgage Solutions',
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
    title: 'Privacy notice | Future Mortgage Solutions',
  },
  { path: '**', redirectTo: '' },
];

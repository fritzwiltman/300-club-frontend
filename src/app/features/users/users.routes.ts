import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./users').then((m) => m.UsersComponent),
    title: 'Browse Users - The 300 Club',
  },
];

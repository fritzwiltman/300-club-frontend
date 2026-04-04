import { Routes } from '@angular/router';

export const USER_PROFILE_ROUTES: Routes = [
  {
    path: ':userId',
    loadComponent: () => import('./user-profile').then((m) => m.UserProfileComponent),
    title: '300 Club - User Profile',
  },
];

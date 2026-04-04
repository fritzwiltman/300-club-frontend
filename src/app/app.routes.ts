import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((m) => m.LayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
      {
        path: 'leaderboard',
        loadChildren: () =>
          import('./features/leaderboard/leaderboard.routes').then((m) => m.LEADERBOARD_ROUTES),
      },
      {
        path: 'user',
        loadChildren: () =>
          import('./features/user-profile/user-profile.routes').then((m) => m.USER_PROFILE_ROUTES),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
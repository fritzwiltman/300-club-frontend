import { Routes } from '@angular/router';

export const LEADERBOARD_ROUTES: Routes = [
  {
    path: ':category',
    loadComponent: () => import('./leaderboard').then((m) => m.LeaderboardComponent),
    title: '300 Club - Leaderboard',
  },
];

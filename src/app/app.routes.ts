import { Routes } from '@angular/router';
import { BattersLeaderboardComponent } from './features/batters/batters-leaderboard/batters-leaderboard';

export const routes: Routes = [
  {
    path: 'leaderboard/batters',
    component: BattersLeaderboardComponent,
  },
  // you can keep/add a default route too:
  // { path: '', redirectTo: 'leaderboard/batters', pathMatch: 'full' },
];
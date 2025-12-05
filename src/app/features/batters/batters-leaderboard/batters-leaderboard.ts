import { ChangeDetectionStrategy, Component } from '@angular/core';
import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LeaderboardService } from '../../../services/leaderboard';
import { UserBatterSelection } from '../../../models/user-batter-selection.model';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-batters-leaderboard',
  templateUrl: './batters-leaderboard.html',
  styleUrl: './batters-leaderboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
})
export class BattersLeaderboardComponent {
  private leaderboardService = inject(LeaderboardService);

  readonly batters = toSignal(
    this.leaderboardService.getBattersLeaderboard(),
    { initialValue: [] as UserBatterSelection[] }
);
}

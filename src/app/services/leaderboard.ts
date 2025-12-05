import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UserBatterSelection } from '../models/user-batter-selection.model';
import { Batter } from '../models/batter.model';
import { DisqualifiedBatterSelection } from '../models/disqualified-batter-selection.model';

// Raw API response shapes from Django
interface RawQualifiedPick {
  player_name: string;
  average: string | number;
  ops: string | number;
}

interface RawDisqualifiedPick {
  player_name: string;
  plate_appearances: string | number;
}

interface RawUserBatterRow {
  user_name: string;
  aggregate_average: string | number;
  alternate_average: string | number;
  aggregate_ops: string | number;
  rank: number | string;
  qualified_picks?: RawQualifiedPick[];
  disqualified_picks?: RawDisqualifiedPick[];
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/leaderboard';

  getBattersLeaderboard(): Observable<UserBatterSelection[]> {
    return this.http.get<RawUserBatterRow[]>(`${this.baseUrl}/batters/`).pipe(
      map((rows) =>
        rows.map((row): UserBatterSelection => {
          const qualifiedPicks: Batter[] = (row.qualified_picks ?? []).map(
            (p): Batter => ({
              name: p.player_name,
              average: Number(p.average),
              ops: Number(p.ops),
            }),
          );

          const disqualifiedPicks: DisqualifiedBatterSelection[] =
            (row.disqualified_picks ?? []).map(
              (p): DisqualifiedBatterSelection => ({
                playerName: p.player_name,
                plateAppearances: Number(p.plate_appearances),
              }),
            );

          return {
            rank: Number(row.rank),
            name: row.user_name,
            eligibleBattersAvg: Number(row.aggregate_average),
            alternatesAvg: Number(row.alternate_average),
            eligibleOPS: Number(row.aggregate_ops),
            qualifiedPicks,
            disqualifiedPicks,
          };
        }),
      ),
    );
  }
}
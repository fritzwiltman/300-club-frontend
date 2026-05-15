import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import {
  CategorySlug,
  CATEGORIES,
  UserStanding,
  CategorySummary,
  RawBatterEntry,
  RawOpsEntry,
  RawHomerunsEntry,
  RawPitchersEntry,
  RawRbiChampionResponse,
  RawStolenBasesResponse,
  RawDimaggioResponse,
  formatDisplayName,
  MlbLeader,
  RawMlbLeadersResponse,
} from '../models';

const SEASON_STORAGE_KEY = '300club_season';
const AVAILABLE_SEASONS = [2026, 2025, 2024] as const;
const DEFAULT_SEASON = 2026;

// MLB season dates for prorated PA calculation
const SEASON_START_DATES: Record<number, Date> = {
  2024: new Date('2024-03-28'),
  2025: new Date('2025-03-27'),
  2026: new Date('2026-03-26'),
};
const SEASON_END_DATES: Record<number, Date> = {
  2024: new Date('2024-09-29'),
  2025: new Date('2025-09-28'),
  2026: new Date('2026-09-27'),
};
const FULL_SEASON_MIN_PA = 502;

export type Season = (typeof AVAILABLE_SEASONS)[number];

/**
 * Remove duplicate entries by userName, keeping the entry with the higher rank
 * (or first occurrence if both have same rank). This handles backend data issues
 * where the same user may appear multiple times.
 */
function deduplicateStandings(standings: UserStanding[]): UserStanding[] {
  const seen = new Map<string, UserStanding>();
  for (const standing of standings) {
    const key = standing.userName.toLowerCase();
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, standing);
    } else {
      // Keep the entry with the higher rank (lower number, but 0 means DQ)
      // If both are DQ (rank 0), keep the first one
      if (existing.rank === 0 && standing.rank > 0) {
        seen.set(key, standing);
      } else if (existing.rank > 0 && standing.rank > 0 && standing.rank < existing.rank) {
        seen.set(key, standing);
      }
    }
  }
  return Array.from(seen.values());
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  // Season state
  private readonly _selectedSeason = signal<Season>(DEFAULT_SEASON);
  readonly selectedSeason = this._selectedSeason.asReadonly();
  readonly availableSeasons = AVAILABLE_SEASONS;

  // Cache for leaderboard data - keyed by "category-season"
  private readonly cache = new Map<string, UserStanding[]>();

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    this.loadSeasonFromStorage();
  }

  private loadSeasonFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const stored = localStorage.getItem(SEASON_STORAGE_KEY);
      if (stored) {
        const season = Number(stored) as Season;
        if (AVAILABLE_SEASONS.includes(season)) {
          this._selectedSeason.set(season);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Set the current season and clear cache
   */
  setSeason(season: Season): void {
    if (this._selectedSeason() === season) return;

    this._selectedSeason.set(season);
    this.clearCache();

    if (this.isBrowser) {
      try {
        localStorage.setItem(SEASON_STORAGE_KEY, String(season));
      } catch {
        // Ignore storage errors
      }
    }
  }

  private getCacheKey(category: CategorySlug, season?: number): string {
    return `${category}-${season ?? 'current'}`;
  }

  /**
   * Clear all cached data. Call this if you need to force a refresh.
   */
  clearCache(): void {
    this.cache.clear();
  }

  getBattersLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/batters/', season);
    return this.http.get<RawBatterEntry[]>(url).pipe(
      map((entries) =>
        entries.map((e) => ({
          userName: formatDisplayName(e.user_name),
          rank: e.rank,
          points: e.aggregate_average !== null ? Number(e.aggregate_average) : null,
          isDisqualified: e.rank === 0,
          alternatesAverage: e.alternate_average !== null ? Number(e.alternate_average) : null,
          batterPicks: [
            ...(e.qualified_picks?.map((p) => ({
              playerName: p.player_name,
              average: Number(p.average),
              ops: Number(p.ops),
              isDisqualified: false,
              plateAppearances: p.plate_appearances ? Number(p.plate_appearances) : undefined,
            })) ?? []),
            ...(e.disqualified_picks?.map((p) => ({
              playerName: p.player_name,
              average: 0,
              ops: 0,
              isDisqualified: true,
              plateAppearances: Number(p.plate_appearances),
            })) ?? []),
          ],
          alternatePicks: e.alternate_batters_picks?.map((p) => ({
            playerName: p.player_name,
            average: Number(p.average),
            isDisqualified: p.is_disqualified,
          })),
        }))
      )
    );
  }

  getOpsLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/ops/', season);
    return this.http.get<RawOpsEntry[]>(url).pipe(
      map((entries) =>
        entries.map((e) => ({
          userName: formatDisplayName(e.user_name),
          rank: e.rank,
          points: e.aggregate_ops !== null ? Number(e.aggregate_ops) : null,
          isDisqualified: e.rank === 0,
          alternatesAverage: e.alternate_average !== null ? Number(e.alternate_average) : null,
          batterPicks: [
            ...(e.qualified_picks?.map((p) => ({
              playerName: p.player_name,
              average: Number(p.average),
              ops: Number(p.ops),
              isDisqualified: false,
              plateAppearances: p.plate_appearances ? Number(p.plate_appearances) : undefined,
            })) ?? []),
            ...(e.disqualified_picks?.map((p) => ({
              playerName: p.player_name,
              average: 0,
              ops: 0,
              isDisqualified: true,
              plateAppearances: Number(p.plate_appearances),
            })) ?? []),
          ],
          alternatePicks: e.alternate_batters_picks?.map((p) => ({
            playerName: p.player_name,
            average: Number(p.average),
            isDisqualified: p.is_disqualified,
          })),
        }))
      )
    );
  }

  getHomerunsLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/homeruns/', season);
    return this.http.get<RawHomerunsEntry[]>(url).pipe(
      map((entries) =>
        entries.map((e) => ({
          userName: formatDisplayName(e.user_name),
          rank: e.rank,
          points: e.top_three_total_homeruns,
          isDisqualified: e.rank === 0,
          fourthPickValue: e.first_tiebreaker_homeruns,
          alternatesAverage: e.second_tiebreaker_average,
          homerunPicks: e.all_homerun_picks?.map((p) => ({
            playerName: p.player_name,
            homeRuns: p.home_runs,
          })),
          alternatePicks: e.alternate_batters_picks?.map((p) => ({
            playerName: p.player_name,
            average: Number(p.average),
            isDisqualified: p.is_disqualified,
          })),
        }))
      )
    );
  }

  getPitchersLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/pitchers/', season);
    return this.http.get<RawPitchersEntry[]>(url).pipe(
      map((entries) =>
        entries.map((e) => ({
          userName: formatDisplayName(e.user_name),
          rank: e.rank,
          points: e.top_three_total_wins,
          isDisqualified: e.rank === 0,
          fourthPickValue: e.first_tiebreaker_wins,
          winLossPct: e.second_tiebreaker_win_pct,
          era: e.third_tiebreaker_era,
          alternatesAverage: e.fourth_tiebreaker_alt_avg,
          pitcherPicks: e.pitcher_picks?.map((p) => ({
            playerName: p.player_name,
            wins: p.wins,
            losses: p.losses,
            era: Number(p.era),
            strikeouts: p.strikeouts,
          })),
        }))
      )
    );
  }

  getRbiChampionLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/rbi-champion/', season);
    return this.http.get<RawRbiChampionResponse>(url).pipe(
      map((response) =>
        response.leaderboard.map((e, index) => ({
          userName: formatDisplayName(e.user_name),
          // For prediction categories, assign sequential rank if backend returns null/0
          rank: e.rank ?? index + 1,
          points: e.predicted_rbis,
          // Prediction categories: users are never disqualified, just ranked by prediction accuracy
          isDisqualified: false,
          predictedPlayer: e.predicted_player,
          predictedValue: e.predicted_rbis,
          pickedPlayerYtdValue: e.picked_player_ytd_rbi,
          actualDifference: e.deviation,
          alternatesAverage: e.alternates_average,
        }))
      )
    );
  }

  getStolenBasesLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/stolen-bases/', season);
    return this.http.get<RawStolenBasesResponse>(url).pipe(
      map((response) =>
        response.leaderboard.map((e, index) => ({
          userName: formatDisplayName(e.user_name),
          // For prediction categories, assign sequential rank if backend returns null/0
          rank: e.rank ?? index + 1,
          points: e.predicted_stolen_bases,
          // Prediction categories: users are never disqualified, just ranked by prediction accuracy
          isDisqualified: false,
          predictedPlayer: e.predicted_player,
          predictedValue: e.predicted_stolen_bases,
          pickedPlayerYtdValue: e.picked_player_ytd_sb,
          actualDifference: e.deviation,
          alternatesAverage: e.alternates_average,
        }))
      )
    );
  }

  getDimaggioLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/dimaggio/', season);
    return this.http.get<RawDimaggioResponse>(url).pipe(
      map((response) =>
        response.leaderboard.map((e, index) => ({
          userName: formatDisplayName(e.user_name),
          // For prediction categories, assign sequential rank if backend returns null/0
          rank: e.rank ?? index + 1,
          points: e.predicted_streak,
          // Prediction categories: users are never disqualified, just ranked by prediction accuracy
          isDisqualified: false,
          predictedValue: e.predicted_streak,
          alternatesAverage: e.alternates_average,
        }))
      )
    );
  }

  getLeaderboard(category: CategorySlug, season?: number): Observable<UserStanding[]> {
    const cacheKey = this.getCacheKey(category, season);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return of(cached);
    }

    let request$: Observable<UserStanding[]>;

    switch (category) {
      case 'batters':
        request$ = this.getBattersLeaderboard(season);
        break;
      case 'ops':
        request$ = this.getOpsLeaderboard(season);
        break;
      case 'homeruns':
        request$ = this.getHomerunsLeaderboard(season);
        break;
      case 'pitchers':
        request$ = this.getPitchersLeaderboard(season);
        break;
      case 'rbi-champion':
        request$ = this.getRbiChampionLeaderboard(season);
        break;
      case 'stolen-bases':
        request$ = this.getStolenBasesLeaderboard(season);
        break;
      case 'dimaggio':
        request$ = this.getDimaggioLeaderboard(season);
        break;
    }

    return request$.pipe(
      tap((data) => this.cache.set(cacheKey, data))
    );
  }

  getCategorySummaries(userName: string, season?: number): Observable<CategorySummary[]> {
    // Use getLeaderboard to leverage caching, and also fetch MLB leaders
    return forkJoin({
      batters: this.getLeaderboard('batters', season),
      ops: this.getLeaderboard('ops', season),
      homeruns: this.getLeaderboard('homeruns', season),
      pitchers: this.getLeaderboard('pitchers', season),
      'rbi-champion': this.getLeaderboard('rbi-champion', season),
      'stolen-bases': this.getLeaderboard('stolen-bases', season),
      dimaggio: this.getLeaderboard('dimaggio', season),
      // MLB leaders for each category (silently fail if endpoint errors)
      mlbBatters: this.getMlbLeaders('batters', season).pipe(catchError(() => of([]))),
      mlbOps: this.getMlbLeaders('ops', season).pipe(catchError(() => of([]))),
      mlbHomeruns: this.getMlbLeaders('homeruns', season).pipe(catchError(() => of([]))),
      mlbPitchers: this.getMlbLeaders('pitchers', season).pipe(catchError(() => of([]))),
      mlbRbi: this.getMlbLeaders('rbi-champion', season).pipe(catchError(() => of([]))),
      mlbStolenBases: this.getMlbLeaders('stolen-bases', season).pipe(catchError(() => of([]))),
      mlbDimaggio: this.getMlbLeaders('dimaggio', season).pipe(catchError(() => of([]))),
    }).pipe(
      map((results) => {
        // Map category slug to MLB leaders key
        const mlbLeadersMap: Record<CategorySlug, MlbLeader[]> = {
          batters: results.mlbBatters,
          ops: results.mlbOps,
          homeruns: results.mlbHomeruns,
          pitchers: results.mlbPitchers,
          'rbi-champion': results.mlbRbi,
          'stolen-bases': results.mlbStolenBases,
          dimaggio: results.mlbDimaggio,
        };

        return CATEGORIES.map((category) => {
          const standings = results[category.slug];
          const userStanding = standings.find(
            (s) => s.userName.toLowerCase() === userName.toLowerCase()
          );
          const qualifiedCount = standings.filter((s) => !s.isDisqualified).length;

          // Find the leader (rank 1, not disqualified)
          const leader = standings.find((s) => s.rank === 1 && !s.isDisqualified);

          // Get top MLB leader for this category
          const mlbLeaders = mlbLeadersMap[category.slug];
          const topMlbLeader = mlbLeaders.find((l) => l.rank === 1) ?? mlbLeaders[0] ?? null;

          return {
            category: category.slug,
            displayName: category.displayName,
            unit: category.unit,
            userRank: userStanding?.isDisqualified ? null : (userStanding?.rank ?? null),
            userPoints: userStanding?.points ?? null,
            totalParticipants: qualifiedCount,
            leaderName: leader?.userName ?? null,
            leaderPoints: leader?.points ?? null,
            mlbLeaderName: topMlbLeader?.playerName ?? null,
            mlbLeaderValue: topMlbLeader?.value ?? null,
            mlbLeaderHeadshotUrl: topMlbLeader?.headshotUrl ?? null,
            mlbLeaderTeam: topMlbLeader?.team ?? null,
          };
        });
      })
    );
  }

  /**
   * Get top 20 MLB players for a category
   * Note: DiMaggio category does not have MLB leaders
   */
  getMlbLeaders(category: CategorySlug, season?: number): Observable<MlbLeader[]> {
    // DiMaggio doesn't have a standard MLB leaderboard
    if (category === 'dimaggio') {
      return of([]);
    }

    const url = this.buildUrl(`/leaderboard/${category}/mlb-leaders/`, season);
    return this.http.get<RawMlbLeadersResponse>(url).pipe(
      map((response) =>
        response.leaders.map((leader) => ({
          rank: leader.rank,
          playerName: leader.player_name,
          team: leader.team,
          value: leader.value,
          headshotUrl: leader.headshot_url,
        }))
      )
    );
  }

  private buildUrl(path: string, season?: number): string {
    const apiPath = path.startsWith('/') ? `/api${path}` : `/api/${path}`;
    if (season) {
      return `${apiPath}?season=${season}`;
    }
    return apiPath;
  }

  /**
   * Calculate the prorated minimum plate appearances for a given season.
   * Returns the full season requirement (502) if the season has ended,
   * or a prorated value based on how much of the season has elapsed.
   */
  getProratedMinPlateAppearances(season?: number): number {
    const targetSeason = season ?? this._selectedSeason();
    const startDate = SEASON_START_DATES[targetSeason];
    const endDate = SEASON_END_DATES[targetSeason];

    // If we don't have dates for this season, return full requirement
    if (!startDate || !endDate) {
      return FULL_SEASON_MIN_PA;
    }

    const now = new Date();

    // If season hasn't started yet, return 0
    if (now < startDate) {
      return 0;
    }

    // If season has ended, return full requirement
    if (now >= endDate) {
      return FULL_SEASON_MIN_PA;
    }

    // Calculate prorated PA based on elapsed time
    const totalSeasonDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const proratedPA = Math.round(FULL_SEASON_MIN_PA * (elapsedDays / totalSeasonDays));

    return proratedPA;
  }

  /**
   * Get the full season minimum plate appearances (502)
   */
  getFullSeasonMinPlateAppearances(): number {
    return FULL_SEASON_MIN_PA;
  }
}

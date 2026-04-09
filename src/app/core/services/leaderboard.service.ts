import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, tap } from 'rxjs';
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
const AVAILABLE_SEASONS = [2025, 2024] as const;
const DEFAULT_SEASON = 2025;

export type Season = (typeof AVAILABLE_SEASONS)[number];

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
        response.leaderboard.map((e) => ({
          userName: formatDisplayName(e.user_name),
          rank: e.rank ?? 0,
          points: e.predicted_rbis,
          isDisqualified: (e.rank ?? 0) === 0,
          predictedPlayer: e.predicted_player,
          isCorrectPlayer: e.predicted_correct_player,
          actualDifference: e.rbi_difference,
          alternatesAverage: e.alternates_average,
        }))
      )
    );
  }

  getStolenBasesLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/stolen-bases/', season);
    return this.http.get<RawStolenBasesResponse>(url).pipe(
      map((response) =>
        response.leaderboard.map((e) => ({
          userName: formatDisplayName(e.user_name),
          rank: e.rank ?? 0,
          points: e.predicted_stolen_bases,
          isDisqualified: (e.rank ?? 0) === 0,
          predictedPlayer: e.predicted_player,
          isCorrectPlayer: e.predicted_correct_player,
          actualDifference: e.sb_difference,
          alternatesAverage: e.alternates_average,
        }))
      )
    );
  }

  getDimaggioLeaderboard(season?: number): Observable<UserStanding[]> {
    const url = this.buildUrl('/leaderboard/dimaggio/', season);
    return this.http.get<RawDimaggioResponse>(url).pipe(
      map((response) =>
        response.leaderboard.map((e) => ({
          userName: formatDisplayName(e.user_name),
          rank: e.rank ?? 0,
          points: e.predicted_streak,
          isDisqualified: (e.rank ?? 0) === 0,
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
    // Use getLeaderboard to leverage caching
    return forkJoin({
      batters: this.getLeaderboard('batters', season),
      ops: this.getLeaderboard('ops', season),
      homeruns: this.getLeaderboard('homeruns', season),
      pitchers: this.getLeaderboard('pitchers', season),
      'rbi-champion': this.getLeaderboard('rbi-champion', season),
      'stolen-bases': this.getLeaderboard('stolen-bases', season),
      dimaggio: this.getLeaderboard('dimaggio', season),
    }).pipe(
      map((results) => {
        return CATEGORIES.map((category) => {
          const standings = results[category.slug];
          const userStanding = standings.find(
            (s) => s.userName.toLowerCase() === userName.toLowerCase()
          );
          const qualifiedCount = standings.filter((s) => !s.isDisqualified).length;

          // Find the leader (rank 1, not disqualified)
          const leader = standings.find((s) => s.rank === 1 && !s.isDisqualified);

          return {
            category: category.slug,
            displayName: category.displayName,
            unit: category.unit,
            userRank: userStanding?.isDisqualified ? null : (userStanding?.rank ?? null),
            userPoints: userStanding?.points ?? null,
            totalParticipants: qualifiedCount,
            leaderName: leader?.userName ?? null,
            leaderPoints: leader?.points ?? null,
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
}

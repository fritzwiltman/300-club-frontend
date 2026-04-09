import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CategorySlug, getCategoryBySlug, MlbLeader, User, UserStanding } from '../../core/models';
import { LeaderboardService, UserService } from '../../core/services';
import { LeagueLeadersComponent, LoadingSpinnerComponent, RulesPopoverComponent, UserComparisonModalComponent } from '../../shared/ui';

@Component({
  selector: 'app-leaderboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LeagueLeadersComponent, LoadingSpinnerComponent, RulesPopoverComponent, UserComparisonModalComponent],
  templateUrl: './leaderboard.html',
})
export class LeaderboardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly userService = inject(UserService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly _standings = signal<UserStanding[]>([]);
  protected readonly expandedUser = signal<string | null>(null);
  protected readonly mlbLeaders = signal<MlbLeader[]>([]);

  // Comparison modal state
  protected readonly showComparisonModal = signal(false);
  protected readonly comparisonUserA = signal<User | null>(null);
  protected readonly comparisonUserB = signal<User | null>(null);

  protected readonly categorySlug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('category') as CategorySlug | null)),
    { initialValue: null }
  );

  protected readonly category = computed(() => {
    const slug = this.categorySlug();
    return slug ? getCategoryBySlug(slug) : undefined;
  });

  protected readonly sortedStandings = computed(() => {
    const standings = this._standings();
    // Sort: qualified users by rank first, then disqualified at the end
    return [...standings].sort((a, b) => {
      if (a.isDisqualified && !b.isDisqualified) return 1;
      if (!a.isDisqualified && b.isDisqualified) return -1;
      return a.rank - b.rank;
    });
  });

  protected readonly currentUserStanding = computed(() => {
    const standings = this._standings();
    const currentUserName = this.userService.currentUserName();
    return standings.find(
      (s) => s.userName.toLowerCase() === currentUserName.toLowerCase()
    );
  });

  protected readonly totalParticipants = computed(() => {
    return this._standings().filter((s) => !s.isDisqualified).length;
  });

  /**
   * Get player names that the current user has picked for this category.
   * Used to highlight MLB leaders that match user picks.
   */
  protected readonly currentUserPickNames = computed(() => {
    const userStanding = this.currentUserStanding();
    const cat = this.category();
    if (!userStanding || !cat) return [];

    const names: string[] = [];

    switch (cat.slug) {
      case 'batters':
      case 'ops':
        // Batter picks for AVG/OPS categories
        userStanding.batterPicks?.forEach((p) => names.push(p.playerName));
        break;
      case 'homeruns':
        // Home run picks
        userStanding.homerunPicks?.forEach((p) => names.push(p.playerName));
        break;
      case 'pitchers':
        // Pitcher picks
        userStanding.pitcherPicks?.forEach((p) => names.push(p.playerName));
        break;
      case 'rbi-champion':
      case 'stolen-bases':
        // Single prediction pick
        if (userStanding.predictedPlayer) {
          names.push(userStanding.predictedPlayer);
        }
        break;
    }

    return names;
  });

  constructor() {
    // Load leaderboard when category or season changes
    effect(() => {
      const slug = this.categorySlug();
      const season = this.leaderboardService.selectedSeason();
      if (slug && getCategoryBySlug(slug)) {
        this.loadLeaderboard(slug, season);
      }
    });
  }

  private loadLeaderboard(category: CategorySlug, season: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.mlbLeaders.set([]);

    this.leaderboardService.getLeaderboard(category, season).subscribe({
      next: (standings) => {
        this._standings.set(standings);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load leaderboard');
        this.isLoading.set(false);
      },
    });

    // Load MLB leaders separately (non-blocking)
    this.leaderboardService.getMlbLeaders(category, season).subscribe({
      next: (leaders) => this.mlbLeaders.set(leaders),
      error: () => {
        // Silently fail - MLB leaders are supplementary
      },
    });
  }

  protected isCurrentUser(standing: UserStanding): boolean {
    const currentUserName = this.userService.currentUserName();
    return currentUserName.toLowerCase() === standing.userName.toLowerCase();
  }

  protected formatPoints(points: number): string {
    const cat = this.category();
    if (!cat) return points.toString();

    if (cat.slug === 'batters' || cat.slug === 'ops') {
      // Multiply by 1000 and show one decimal (e.g., 0.2948 → 294.8)
      return (points * 1000).toFixed(1);
    }
    return Math.round(points).toString();
  }

  protected formatAverage(value: number | null | undefined): string {
    if (value === null || value === undefined) return '--';
    // Multiply by 1000 and show one decimal (e.g., 0.2948 → 294.8)
    return (value * 1000).toFixed(1);
  }

  protected formatPct(value: number | null | undefined): string {
    if (value === null || value === undefined) return '--';
    return value.toFixed(3);
  }

  protected formatEra(value: number | null | undefined): string {
    if (value === null || value === undefined) return '--';
    return value.toFixed(2);
  }

  protected formatDifference(value: number | null | undefined): string {
    if (value === null || value === undefined) return '--';
    return (value >= 0 ? '+' : '') + value;
  }

  protected toggleExpand(userName: string): void {
    if (this.expandedUser() === userName) {
      this.expandedUser.set(null);
    } else {
      this.expandedUser.set(userName);
    }
  }

  protected isExpanded(userName: string): boolean {
    return this.expandedUser() === userName;
  }

  protected hasPicks(standing: UserStanding): boolean {
    return !!(
      standing.batterPicks?.length ||
      standing.homerunPicks?.length ||
      standing.pitcherPicks?.length ||
      standing.alternatePicks?.length
    );
  }

  protected getColumnCount(): number {
    const cat = this.category();
    if (!cat) return 3;

    switch (cat.slug) {
      case 'batters':
      case 'ops':
      case 'dimaggio':
        return 4; // Rank, Name, Points, Alt AVG
      case 'homeruns':
        return 5; // Rank, Name, Points, 4th HR, Alt AVG
      case 'pitchers':
        return 7; // Rank, Name, Points, 4th W, W-L%, ERA, Alt AVG
      case 'rbi-champion':
      case 'stolen-bases':
        return 6; // Rank, Name, Points, Pick, Diff, Alt AVG
      default:
        return 3;
    }
  }

  protected openComparisonModal(userA?: User | null, userB?: User | null): void {
    this.comparisonUserA.set(userA ?? null);
    this.comparisonUserB.set(userB ?? null);
    this.showComparisonModal.set(true);
  }

  protected closeComparisonModal(): void {
    this.showComparisonModal.set(false);
    this.comparisonUserA.set(null);
    this.comparisonUserB.set(null);
  }

  protected getUserByName(userName: string): User | null {
    const users = this.userService.users();
    return users.find((u) => u.name.toLowerCase() === userName.toLowerCase()) ?? null;
  }
}

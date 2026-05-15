import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { CategorySlug, getCategoryBySlug, MlbLeader, User, UserStanding } from '../../core/models';
import { LeaderboardService, UserService } from '../../core/services';
import { LeagueLeadersComponent, LoadingSpinnerComponent, RulesPopoverComponent, UserComparisonModalComponent } from '../../shared/ui';

@Component({
  selector: 'app-leaderboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, LeagueLeadersComponent, LoadingSpinnerComponent, RulesPopoverComponent, UserComparisonModalComponent],
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

  // Filter state
  protected readonly userNameFilters = signal<string[]>([]);
  protected readonly selectedPlayerFilters = signal<Set<string>>(new Set());
  protected readonly showPlayerDropdown = signal(false);

  // Form controls for search inputs
  protected readonly userSearchControl = new FormControl('', { nonNullable: true });
  protected readonly playerSearchControl = new FormControl('', { nonNullable: true });

  protected readonly categorySlug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('category') as CategorySlug | null)),
    { initialValue: null }
  );

  protected readonly category = computed(() => {
    const slug = this.categorySlug();
    return slug ? getCategoryBySlug(slug) : undefined;
  });

  protected readonly sortedStandings = computed(() => {
    const standings = this.filteredStandings();
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

  protected readonly totalStandings = computed(() => {
    return this._standings().length;
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

  /**
   * All unique player names across all standings for the current category.
   * Used to populate the player filter dropdown.
   */
  protected readonly allPlayerNames = computed(() => {
    const standings = this._standings();
    const cat = this.category();
    if (!cat) return [];

    const namesSet = new Set<string>();
    standings.forEach((standing) => {
      switch (cat.slug) {
        case 'batters':
        case 'ops':
          standing.batterPicks?.forEach((p) => namesSet.add(p.playerName));
          break;
        case 'homeruns':
          standing.homerunPicks?.forEach((p) => namesSet.add(p.playerName));
          standing.alternatePicks?.forEach((p) => namesSet.add(p.playerName));
          break;
        case 'pitchers':
          standing.pitcherPicks?.forEach((p) => namesSet.add(p.playerName));
          break;
        case 'rbi-champion':
        case 'stolen-bases':
          if (standing.predictedPlayer) namesSet.add(standing.predictedPlayer);
          break;
        // dimaggio has no player picks
      }
    });

    return Array.from(namesSet).sort((a, b) => a.localeCompare(b));
  });

  /**
   * Whether any filter is currently active.
   */
  protected readonly hasActiveFilters = computed(() => {
    return (
      this.userNameFilters().length > 0 ||
      this.selectedPlayerFilters().size > 0
    );
  });

  /**
   * Max YTD value for prediction categories (SB/RBI).
   * Users who have this value picked the current leader.
   */
  protected readonly maxPickedPlayerYtdValue = computed(() => {
    const standings = this._standings();
    const cat = this.category();
    if (!cat || (cat.slug !== 'rbi-champion' && cat.slug !== 'stolen-bases')) {
      return null;
    }
    const values = standings
      .map((s) => s.pickedPlayerYtdValue)
      .filter((v): v is number => v !== null && v !== undefined);
    return values.length > 0 ? Math.max(...values) : null;
  });

  /**
   * Player search value from the dropdown search input.
   */
  protected readonly playerSearchValue = toSignal(
    this.playerSearchControl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  /**
   * Player names filtered by the dropdown search input.
   */
  protected readonly filteredPlayerNames = computed(() => {
    const allPlayers = this.allPlayerNames();
    const search = this.playerSearchValue().toLowerCase().trim();
    if (!search) return allPlayers;
    return allPlayers.filter((p) => p.toLowerCase().includes(search));
  });

  /**
   * Whether all of the current user's players are selected in the filter.
   */
  protected readonly allMyPlayersSelected = computed(() => {
    const myPlayers = this.currentUserPickNames();
    if (myPlayers.length === 0) return false;
    const currentFilters = this.selectedPlayerFilters();
    return myPlayers.every(p => currentFilters.has(p));
  });

  /**
   * Standings filtered by all active filters.
   * User name filters use OR logic: matches if ANY filter matches.
   * Player filters use AND logic: must have ALL selected players.
   */
  protected readonly filteredStandings = computed(() => {
    let standings = this._standings();
    const userNameQueries = this.userNameFilters().map(q => q.toLowerCase().trim());
    const playerFilters = this.selectedPlayerFilters();
    const cat = this.category();

    // Apply user name filters (OR logic - match any)
    if (userNameQueries.length > 0) {
      standings = standings.filter((s) =>
        userNameQueries.some(query => s.userName.toLowerCase().includes(query))
      );
    }

    // Apply player selection filter (AND logic - must have all selected players)
    if (playerFilters.size > 0) {
      standings = standings.filter((s) =>
        this.standingHasAllPlayers(s, playerFilters, cat?.slug)
      );
    }

    return standings;
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

    // Clear filters when category changes (but not on initial load)
    let previousSlug: CategorySlug | null = null;
    effect(() => {
      const slug = this.categorySlug();
      if (slug && previousSlug !== null && slug !== previousSlug) {
        untracked(() => this.clearAllFilters());
      }
      previousSlug = slug;
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

  /**
   * Check if a standing's picked player is the current leader (has highest YTD value).
   * Used for prediction categories (RBI Champion, Stolen Bases).
   */
  protected pickedLeader(standing: UserStanding): boolean {
    const maxValue = this.maxPickedPlayerYtdValue();
    if (maxValue === null || standing.pickedPlayerYtdValue === null || standing.pickedPlayerYtdValue === undefined) {
      return false;
    }
    return standing.pickedPlayerYtdValue === maxValue;
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
        return 7; // Rank, Name, Pick, Guessed RBIs, Deviation, YTD RBIs, Tiebreaker
      case 'stolen-bases':
        return 7; // Rank, Name, Pick, Guessed SBs, Deviation, YTD SBs, Tiebreaker
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

  // Filter action methods
  protected togglePlayerDropdown(): void {
    this.showPlayerDropdown.update((v) => !v);
    if (!this.showPlayerDropdown()) {
      this.playerSearchControl.reset();
    }
  }

  protected togglePlayerFilter(playerName: string): void {
    this.selectedPlayerFilters.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(playerName)) {
        newSet.delete(playerName);
      } else {
        newSet.add(playerName);
      }
      return newSet;
    });
  }

  protected selectMyPlayers(): void {
    const myPlayers = this.currentUserPickNames();
    if (myPlayers.length === 0) return;

    const currentFilters = this.selectedPlayerFilters();
    const allMyPlayersSelected = myPlayers.every(p => currentFilters.has(p));

    if (allMyPlayersSelected) {
      // Remove all my players from the filter
      this.selectedPlayerFilters.update(set => {
        const newSet = new Set(set);
        myPlayers.forEach(p => newSet.delete(p));
        return newSet;
      });
    } else {
      // Add all my players to the filter
      this.selectedPlayerFilters.set(new Set(myPlayers));
    }
  }

  protected onUserSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addUserNameFilter();
    }
  }

  protected addUserNameFilter(): void {
    const value = this.userSearchControl.value.trim();
    if (value && !this.userNameFilters().includes(value)) {
      this.userNameFilters.update(filters => [...filters, value]);
    }
    this.userSearchControl.reset();
  }

  protected removeUserNameFilter(filter: string): void {
    this.userNameFilters.update(filters => filters.filter(f => f !== filter));
  }

  protected clearAllFilters(): void {
    this.userSearchControl.reset();
    this.playerSearchControl.reset();
    this.userNameFilters.set([]);
    this.selectedPlayerFilters.set(new Set());
    this.showPlayerDropdown.set(false);
  }

  /**
   * Check if a standing has ALL of the specified players in their picks.
   */
  private standingHasAllPlayers(
    standing: UserStanding,
    players: Set<string>,
    categorySlug: CategorySlug | undefined
  ): boolean {
    if (!categorySlug) return false;

    const normalizedPlayers = Array.from(players).map((p) => p.toLowerCase());

    // Get the user's pick names for this category
    let userPickNames: string[] = [];

    switch (categorySlug) {
      case 'batters':
      case 'ops':
        userPickNames = standing.batterPicks?.map((p) => p.playerName.toLowerCase()) ?? [];
        break;
      case 'homeruns':
        userPickNames = [
          ...(standing.homerunPicks?.map((p) => p.playerName.toLowerCase()) ?? []),
          ...(standing.alternatePicks?.map((p) => p.playerName.toLowerCase()) ?? []),
        ];
        break;
      case 'pitchers':
        userPickNames = standing.pitcherPicks?.map((p) => p.playerName.toLowerCase()) ?? [];
        break;
      case 'rbi-champion':
      case 'stolen-bases':
        userPickNames = standing.predictedPlayer ? [standing.predictedPlayer.toLowerCase()] : [];
        break;
      case 'dimaggio':
        return false; // No player picks
      default:
        return false;
    }

    // Check that ALL selected players are in the user's picks
    return normalizedPlayers.every((player) => userPickNames.includes(player));
  }
}

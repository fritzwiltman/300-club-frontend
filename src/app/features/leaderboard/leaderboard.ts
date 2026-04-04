import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Category, CategorySlug, getCategoryBySlug, User, UserStanding } from '../../core/models';
import { LeaderboardService, UserService } from '../../core/services';
import { LoadingSpinnerComponent, RulesPopoverComponent, UserComparisonModalComponent } from '../../shared/ui';

@Component({
  selector: 'app-leaderboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingSpinnerComponent, RulesPopoverComponent, UserComparisonModalComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Back Link -->
      <a
        routerLink="/"
        class="inline-flex items-center gap-1 text-sm text-club-green hover:text-club-forest
               focus:outline-none focus-visible:underline mb-4"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </a>

      @if (category(); as cat) {
        <!-- Header -->
        <header class="mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl sm:text-3xl font-bold text-club-forest">
                {{ cat.displayName }} Leaderboard
              </h1>
              <app-rules-popover [category]="cat" />
            </div>
            <button
              type="button"
              (click)="openComparisonModal()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                     bg-club-sage/50 text-club-forest rounded-md
                     hover:bg-club-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare
            </button>
          </div>
          <p class="mt-1 text-club-gray">{{ cat.description }}</p>
        </header>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="py-12">
            <app-loading-spinner message="Loading leaderboard..." />
          </div>
        } @else if (error()) {
          <!-- Error State -->
          <div
            class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
            role="alert"
          >
            <p>{{ error() }}</p>
          </div>
        } @else {
          <!-- User Position Card -->
          @if (currentUserStanding(); as userStanding) {
            <div class="mb-4 bg-club-sage/30 border border-club-sage rounded-lg p-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div class="flex items-center gap-3">
                  <span class="text-sm text-club-gray">Your Position:</span>
                  @if (userStanding.isDisqualified) {
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-club-burgundy text-white">
                      Disqualified
                    </span>
                  } @else {
                    <span class="text-2xl font-bold text-club-forest">
                      #{{ userStanding.rank }}
                    </span>
                    <span class="text-sm text-club-gray">
                      of {{ totalParticipants() }}
                    </span>
                  }
                </div>
                <div class="flex items-center gap-4 text-sm">
                  <div>
                    <span class="text-club-gray">{{ cat.unit }}:</span>
                    <span class="ml-1 font-mono font-semibold">
                      @if (userStanding.points !== null) {
                        {{ formatPoints(userStanding.points) }}
                      } @else {
                        --
                      }
                    </span>
                  </div>
                  @if (userStanding.alternatesAverage !== null && userStanding.alternatesAverage !== undefined) {
                    <div>
                      <span class="text-club-gray">Alt AVG:</span>
                      <span class="ml-1 font-mono">{{ formatAverage(userStanding.alternatesAverage) }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Leaderboard Table -->
          <div class="bg-white rounded-lg shadow overflow-x-auto">
            <table class="w-full min-w-[400px]">
              <thead class="bg-club-forest text-white">
                <tr>
                  <th scope="col" class="px-3 py-3 text-left text-sm font-semibold w-14">
                    Rank
                  </th>
                  <th scope="col" class="px-3 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th scope="col" class="px-3 py-3 text-right text-sm font-semibold">
                    {{ cat.unit }}
                  </th>
                  <!-- Tiebreaker columns based on category -->
                  @switch (cat.slug) {
                    @case ('batters') {
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Alternates Average (Tiebreaker)">
                        Alt AVG
                      </th>
                    }
                    @case ('ops') {
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Alternates Average (Tiebreaker)">
                        Alt AVG
                      </th>
                    }
                    @case ('homeruns') {
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="4th Pick Home Runs (1st Tiebreaker)">
                        4th HR
                      </th>
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Alternates Average (2nd Tiebreaker)">
                        Alt AVG
                      </th>
                    }
                    @case ('pitchers') {
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="4th Pitcher Wins (1st Tiebreaker)">
                        4th W
                      </th>
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Win-Loss Percentage (2nd Tiebreaker)">
                        W-L%
                      </th>
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="ERA (3rd Tiebreaker)">
                        ERA
                      </th>
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Alternates Average (4th Tiebreaker)">
                        Alt AVG
                      </th>
                    }
                    @case ('rbi-champion') {
                      <th scope="col" class="px-3 py-3 text-left text-sm font-semibold">
                        Pick
                      </th>
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Difference from actual">
                        Diff
                      </th>
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Alternates Average (Tiebreaker)">
                        Alt AVG
                      </th>
                    }
                    @case ('stolen-bases') {
                      <th scope="col" class="px-3 py-3 text-left text-sm font-semibold">
                        Pick
                      </th>
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Difference from actual">
                        Diff
                      </th>
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Alternates Average (Tiebreaker)">
                        Alt AVG
                      </th>
                    }
                    @case ('dimaggio') {
                      <th scope="col" class="px-3 py-3 text-right text-sm font-semibold" title="Alternates Average (Tiebreaker)">
                        Alt AVG
                      </th>
                    }
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (standing of sortedStandings(); track standing.userName; let idx = $index) {
                  <tr
                    [class.bg-club-sage/20]="isCurrentUser(standing)"
                    [class.bg-gray-50]="standing.isDisqualified"
                    [class.text-club-gray]="standing.isDisqualified"
                    [class.cursor-pointer]="hasPicks(standing)"
                    [class.hover:bg-gray-100]="hasPicks(standing) && !isCurrentUser(standing)"
                    (click)="hasPicks(standing) && toggleExpand(standing.userName)"
                  >
                    <td class="px-3 py-3 text-sm">
                      <div class="flex items-center gap-1">
                        @if (hasPicks(standing)) {
                          <svg
                            class="w-4 h-4 text-club-gray transition-transform"
                            [class.rotate-90]="isExpanded(standing.userName)"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        }
                        @if (standing.isDisqualified) {
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-club-burgundy text-white">
                            DQ
                          </span>
                        } @else {
                          <span class="font-semibold">{{ standing.rank }}</span>
                        }
                      </div>
                    </td>
                    <td class="px-3 py-3">
                      <span [class.font-semibold]="isCurrentUser(standing)">
                        {{ standing.userName }}
                      </span>
                      @if (isCurrentUser(standing)) {
                        <span class="ml-2 text-xs text-club-green">(You)</span>
                      }
                    </td>
                    <td class="px-3 py-3 text-right font-mono">
                      @if (standing.points !== null) {
                        {{ formatPoints(standing.points) }}
                      } @else {
                        --
                      }
                    </td>
                    <!-- Tiebreaker values based on category -->
                    @switch (cat.slug) {
                      @case ('batters') {
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatAverage(standing.alternatesAverage) }}
                        </td>
                      }
                      @case ('ops') {
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatAverage(standing.alternatesAverage) }}
                        </td>
                      }
                      @case ('homeruns') {
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ standing.fourthPickValue ?? '--' }}
                        </td>
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatAverage(standing.alternatesAverage) }}
                        </td>
                      }
                      @case ('pitchers') {
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ standing.fourthPickValue ?? '--' }}
                        </td>
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatPct(standing.winLossPct) }}
                        </td>
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatEra(standing.era) }}
                        </td>
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatAverage(standing.alternatesAverage) }}
                        </td>
                      }
                      @case ('rbi-champion') {
                        <td class="px-3 py-3 text-sm">
                          @if (standing.predictedPlayer) {
                            <span [class.text-club-green]="standing.isCorrectPlayer" [class.font-medium]="standing.isCorrectPlayer">
                              {{ standing.predictedPlayer }}
                            </span>
                          } @else {
                            --
                          }
                        </td>
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatDifference(standing.actualDifference) }}
                        </td>
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatAverage(standing.alternatesAverage) }}
                        </td>
                      }
                      @case ('stolen-bases') {
                        <td class="px-3 py-3 text-sm">
                          @if (standing.predictedPlayer) {
                            <span [class.text-club-green]="standing.isCorrectPlayer" [class.font-medium]="standing.isCorrectPlayer">
                              {{ standing.predictedPlayer }}
                            </span>
                          } @else {
                            --
                          }
                        </td>
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatDifference(standing.actualDifference) }}
                        </td>
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatAverage(standing.alternatesAverage) }}
                        </td>
                      }
                      @case ('dimaggio') {
                        <td class="px-3 py-3 text-right font-mono text-sm text-club-gray">
                          {{ formatAverage(standing.alternatesAverage) }}
                        </td>
                      }
                    }
                  </tr>
                  <!-- Expanded Picks Row -->
                  @if (isExpanded(standing.userName) && hasPicks(standing)) {
                    <tr class="bg-gray-50">
                      <td [attr.colspan]="getColumnCount()" class="px-4 py-3">
                        <div class="text-sm">
                          <h4 class="font-semibold text-club-forest mb-2">Picks</h4>
                          @switch (cat.slug) {
                            @case ('batters') {
                              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                @for (pick of standing.batterPicks; track pick.playerName) {
                                  <div
                                    class="flex justify-between items-center px-3 py-2 rounded-md"
                                    [class.bg-white]="!pick.isDisqualified"
                                    [class.bg-red-50]="pick.isDisqualified"
                                    [class.border]="true"
                                    [class.border-gray-200]="!pick.isDisqualified"
                                    [class.border-red-200]="pick.isDisqualified"
                                  >
                                    <span [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                                    <div class="flex items-center gap-2">
                                      @if (pick.isDisqualified) {
                                        <span class="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                          {{ pick.plateAppearances }} PA
                                        </span>
                                      } @else {
                                        <span class="font-mono text-club-gray">{{ (pick.average * 1000).toFixed(1) }}</span>
                                        @if (pick.plateAppearances) {
                                          <span class="text-xs text-club-gray">{{ pick.plateAppearances }} PA</span>
                                        }
                                      }
                                    </div>
                                  </div>
                                }
                              </div>
                            }
                            @case ('ops') {
                              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                @for (pick of standing.batterPicks; track pick.playerName) {
                                  <div
                                    class="flex justify-between items-center px-3 py-2 rounded-md"
                                    [class.bg-white]="!pick.isDisqualified"
                                    [class.bg-red-50]="pick.isDisqualified"
                                    [class.border]="true"
                                    [class.border-gray-200]="!pick.isDisqualified"
                                    [class.border-red-200]="pick.isDisqualified"
                                  >
                                    <span [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                                    <div class="flex items-center gap-2">
                                      @if (pick.isDisqualified) {
                                        <span class="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                          {{ pick.plateAppearances }} PA
                                        </span>
                                      } @else {
                                        <span class="font-mono text-club-gray">{{ (pick.ops * 1000).toFixed(1) }}</span>
                                        @if (pick.plateAppearances) {
                                          <span class="text-xs text-club-gray">{{ pick.plateAppearances }} PA</span>
                                        }
                                      }
                                    </div>
                                  </div>
                                }
                              </div>
                            }
                            @case ('homeruns') {
                              <div class="space-y-3">
                                @if (standing.homerunPicks?.length) {
                                  <div>
                                    <h5 class="text-xs font-medium text-club-gray uppercase mb-1">Home Run Picks</h5>
                                    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                      @for (pick of standing.homerunPicks; track pick.playerName) {
                                        <div class="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-gray-200">
                                          <span>{{ pick.playerName }}</span>
                                          <span class="font-mono font-semibold">{{ pick.homeRuns }}</span>
                                        </div>
                                      }
                                    </div>
                                  </div>
                                }
                                @if (standing.alternatePicks?.length) {
                                  <div>
                                    <h5 class="text-xs font-medium text-club-gray uppercase mb-1">Alternate Batters</h5>
                                    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                      @for (pick of standing.alternatePicks; track pick.playerName) {
                                        <div
                                          class="flex justify-between items-center px-3 py-2 rounded-md"
                                          [class.bg-white]="!pick.isDisqualified"
                                          [class.bg-red-50]="pick.isDisqualified"
                                          [class.border]="true"
                                          [class.border-gray-200]="!pick.isDisqualified"
                                          [class.border-red-200]="pick.isDisqualified"
                                        >
                                          <span [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                                          <span class="font-mono text-club-gray">{{ (pick.average * 1000).toFixed(1) }}</span>
                                        </div>
                                      }
                                    </div>
                                  </div>
                                }
                              </div>
                            }
                            @case ('pitchers') {
                              <div class="grid gap-2 sm:grid-cols-2">
                                @for (pick of standing.pitcherPicks; track pick.playerName) {
                                  <div class="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-gray-200">
                                    <span>{{ pick.playerName }}</span>
                                    <div class="flex gap-3 font-mono text-sm text-club-gray">
                                      <span title="Wins-Losses">{{ pick.wins }}-{{ pick.losses }}</span>
                                      <span title="ERA">{{ pick.era.toFixed(2) }}</span>
                                      <span title="Strikeouts">{{ pick.strikeouts }} K</span>
                                    </div>
                                  </div>
                                }
                              </div>
                            }
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      } @else {
        <!-- Invalid Category -->
        <div class="text-center py-12">
          <h1 class="text-2xl font-bold text-club-forest">Category Not Found</h1>
          <p class="mt-2 text-club-gray">The category "{{ categorySlug() }}" doesn't exist.</p>
          <a
            routerLink="/"
            class="mt-4 inline-block text-club-green hover:underline"
          >
            Return to Home
          </a>
        </div>
      }
    </div>

    <!-- Comparison Modal -->
    @if (showComparisonModal() && category()) {
      <app-user-comparison-modal
        [category]="category()!"
        [initialUserA]="comparisonUserA()"
        [initialUserB]="comparisonUserB()"
        (close)="closeComparisonModal()"
      />
    }
  `,
})
export class LeaderboardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly userService = inject(UserService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly _standings = signal<UserStanding[]>([]);
  protected readonly expandedUser = signal<string | null>(null);

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

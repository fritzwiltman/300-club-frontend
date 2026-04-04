import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import {
  Category,
  CategorySlug,
  CategorySummary,
  CATEGORIES,
  getCategoryBySlug,
  UserStanding,
  User,
} from '../../core/models';
import { LeaderboardService, UserService } from '../../core/services';
import { LoadingSpinnerComponent, RulesPopoverComponent } from '../../shared/ui';

interface CategoryWithStanding extends CategorySummary {
  standing: UserStanding | null;
}

@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingSpinnerComponent, RulesPopoverComponent],
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

      @if (isLoading()) {
        <div class="py-12">
          <app-loading-spinner message="Loading profile..." />
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div
          class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
          role="alert"
        >
          <p class="font-medium">{{ error() }}</p>
          <a
            routerLink="/"
            class="mt-3 inline-block text-sm font-medium text-red-600 hover:text-red-800
                   focus:outline-none focus-visible:underline"
          >
            Return to Home
          </a>
        </div>
      } @else if (profileUser()) {
        <!-- Header -->
        <header class="mb-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-club-forest">
            {{ profileUser()!.name }}
          </h1>
          <p class="mt-1 text-club-gray">
            {{ leaderboardService.selectedSeason() }} Season Standings
          </p>
          @if (isCurrentUser()) {
            <span class="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-club-lime text-club-forest">
              This is you
            </span>
          }
        </header>

        <!-- Category Cards Grid -->
        @if (categoryData().length > 0) {
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Category standings"
          >
            @for (cat of categoryData(); track cat.category) {
              <div role="listitem" class="flex flex-col">
                <!-- Category Card (clickable to expand) -->
                <button
                  type="button"
                  (click)="toggleExpand(cat.category)"
                  class="text-left h-full rounded-xl bg-white shadow-md p-5
                         border-2 transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime focus-visible:ring-offset-2"
                  [class.border-club-lime]="isExpanded(cat.category)"
                  [class.border-transparent]="!isExpanded(cat.category)"
                  [class.hover:border-club-sage]="!isExpanded(cat.category)"
                  [attr.aria-expanded]="isExpanded(cat.category)"
                >
                  <!-- Category Name with chevron -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                      <h2 class="text-lg font-bold text-club-forest">
                        {{ cat.displayName }}
                      </h2>
                      @if (getCategory(cat.category); as fullCat) {
                        <app-rules-popover [category]="fullCat" />
                      }
                    </div>
                    <svg
                      class="w-5 h-5 text-club-gray transition-transform"
                      [class.rotate-180]="isExpanded(cat.category)"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  <!-- Rank Display -->
                  <div class="mt-3 flex items-baseline gap-2">
                    @if (cat.userRank !== null) {
                      <span class="text-4xl font-extrabold text-club-green">
                        #{{ cat.userRank }}
                      </span>
                      <span class="text-sm text-club-gray">
                        of {{ cat.totalParticipants }}
                      </span>
                    } @else {
                      <span class="text-2xl font-bold text-club-burgundy">DQ</span>
                      <span class="text-sm text-club-gray">Disqualified</span>
                    }
                  </div>

                  <!-- Points -->
                  <div class="mt-2">
                    @if (cat.userPoints !== null) {
                      <span class="text-lg font-semibold text-club-forest">
                        {{ formatPoints(cat.userPoints, cat.category) }}
                      </span>
                      <span class="text-sm text-club-gray ml-1">
                        {{ cat.unit }}
                      </span>
                    } @else {
                      <span class="text-sm text-club-gray">No points</span>
                    }
                  </div>

                  <!-- Alternates Average (tiebreaker) -->
                  @if (cat.standing?.alternatesAverage !== null && cat.standing?.alternatesAverage !== undefined) {
                    <div class="mt-2 text-sm text-club-gray">
                      Alt AVG: <span class="font-mono">{{ formatAverage(cat.standing!.alternatesAverage) }}</span>
                    </div>
                  }
                </button>

                <!-- Expanded Picks Section -->
                @if (isExpanded(cat.category) && cat.standing) {
                  <div class="mt-2 bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <h3 class="text-sm font-semibold text-club-forest mb-3">Picks</h3>
                    @switch (cat.category) {
                      @case ('batters') {
                        @if (cat.standing.batterPicks?.length) {
                          <div class="grid gap-2 sm:grid-cols-2">
                            @for (pick of cat.standing.batterPicks; track pick.playerName) {
                              <div
                                class="flex justify-between items-center px-3 py-2 rounded-md text-sm"
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
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        } @else {
                          <p class="text-sm text-club-gray">No picks data available</p>
                        }
                      }
                      @case ('ops') {
                        @if (cat.standing.batterPicks?.length) {
                          <div class="grid gap-2 sm:grid-cols-2">
                            @for (pick of cat.standing.batterPicks; track pick.playerName) {
                              <div
                                class="flex justify-between items-center px-3 py-2 rounded-md text-sm"
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
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        } @else {
                          <p class="text-sm text-club-gray">No picks data available</p>
                        }
                      }
                      @case ('homeruns') {
                        @if (cat.standing.homerunPicks?.length) {
                          <div class="space-y-3">
                            <div>
                              <h4 class="text-xs font-medium text-club-gray uppercase mb-1">Home Run Picks</h4>
                              <div class="grid gap-2 sm:grid-cols-2">
                                @for (pick of cat.standing.homerunPicks; track pick.playerName) {
                                  <div class="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-gray-200 text-sm">
                                    <span>{{ pick.playerName }}</span>
                                    <span class="font-mono font-semibold">{{ pick.homeRuns }} HR</span>
                                  </div>
                                }
                              </div>
                            </div>
                            @if (cat.standing.alternatePicks?.length) {
                              <div>
                                <h4 class="text-xs font-medium text-club-gray uppercase mb-1">Alternate Batters</h4>
                                <div class="grid gap-2 sm:grid-cols-2">
                                  @for (pick of cat.standing.alternatePicks; track pick.playerName) {
                                    <div
                                      class="flex justify-between items-center px-3 py-2 rounded-md text-sm"
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
                        } @else {
                          <p class="text-sm text-club-gray">No picks data available</p>
                        }
                      }
                      @case ('pitchers') {
                        @if (cat.standing.pitcherPicks?.length) {
                          <div class="grid gap-2 sm:grid-cols-2">
                            @for (pick of cat.standing.pitcherPicks; track pick.playerName) {
                              <div class="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-gray-200 text-sm">
                                <span>{{ pick.playerName }}</span>
                                <div class="flex gap-2 font-mono text-club-gray text-xs">
                                  <span>{{ pick.wins }}-{{ pick.losses }}</span>
                                  <span>{{ pick.era.toFixed(2) }} ERA</span>
                                  <span>{{ pick.strikeouts }} K</span>
                                </div>
                              </div>
                            }
                          </div>
                        } @else {
                          <p class="text-sm text-club-gray">No picks data available</p>
                        }
                      }
                      @case ('rbi-champion') {
                        <div class="space-y-2">
                          @if (cat.standing.predictedPlayer) {
                            <div class="flex items-center gap-2">
                              <span class="text-sm text-club-gray">Predicted:</span>
                              <span class="font-medium" [class.text-club-green]="cat.standing.isCorrectPlayer">
                                {{ cat.standing.predictedPlayer }}
                              </span>
                              @if (cat.standing.isCorrectPlayer) {
                                <span class="text-xs px-1.5 py-0.5 bg-club-lime/30 text-club-forest rounded">Correct!</span>
                              }
                            </div>
                            @if (cat.standing.actualDifference !== null && cat.standing.actualDifference !== undefined) {
                              <div class="text-sm text-club-gray">
                                Difference: <span class="font-mono">{{ formatDifference(cat.standing.actualDifference) }}</span>
                              </div>
                            }
                          } @else {
                            <p class="text-sm text-club-gray">No prediction data available</p>
                          }
                        </div>
                      }
                      @case ('stolen-bases') {
                        <div class="space-y-2">
                          @if (cat.standing.predictedPlayer) {
                            <div class="flex items-center gap-2">
                              <span class="text-sm text-club-gray">Predicted:</span>
                              <span class="font-medium" [class.text-club-green]="cat.standing.isCorrectPlayer">
                                {{ cat.standing.predictedPlayer }}
                              </span>
                              @if (cat.standing.isCorrectPlayer) {
                                <span class="text-xs px-1.5 py-0.5 bg-club-lime/30 text-club-forest rounded">Correct!</span>
                              }
                            </div>
                            @if (cat.standing.actualDifference !== null && cat.standing.actualDifference !== undefined) {
                              <div class="text-sm text-club-gray">
                                Difference: <span class="font-mono">{{ formatDifference(cat.standing.actualDifference) }}</span>
                              </div>
                            }
                          } @else {
                            <p class="text-sm text-club-gray">No prediction data available</p>
                          }
                        </div>
                      }
                      @case ('dimaggio') {
                        <div class="text-sm text-club-gray">
                          <p>Predicted streak: <span class="font-semibold text-club-forest">{{ cat.standing.points }} games</span></p>
                        </div>
                      }
                    }

                    <!-- Link to full leaderboard -->
                    <a
                      [routerLink]="['/leaderboard', cat.category]"
                      class="mt-3 inline-flex items-center gap-1 text-sm text-club-green hover:text-club-forest
                             focus:outline-none focus-visible:underline"
                    >
                      View full leaderboard
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class UserProfileComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly userService = inject(UserService);
  protected readonly leaderboardService = inject(LeaderboardService);

  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly _profileUser = signal<User | null>(null);
  private readonly _categoryData = signal<CategoryWithStanding[]>([]);
  protected readonly expandedCategory = signal<CategorySlug | null>(null);

  protected readonly profileUser = this._profileUser.asReadonly();
  protected readonly categoryData = this._categoryData.asReadonly();

  protected readonly userId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('userId'))),
    { initialValue: null }
  );

  protected readonly isCurrentUser = computed(() => {
    const profile = this._profileUser();
    const current = this.userService.currentUser();
    return profile !== null && current !== null && profile.mbrId === current.mbrId;
  });

  constructor() {
    // Load profile when userId or season changes
    effect(() => {
      const userId = this.userId();
      const season = this.leaderboardService.selectedSeason();
      if (userId) {
        this.loadProfile(Number(userId), season);
      }
    });
  }

  private loadProfile(userId: number, season: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    // First, ensure users are loaded
    const users = this.userService.users();
    if (users.length === 0) {
      // Load users first
      this.userService.loadUsers().subscribe({
        next: (loadedUsers) => {
          this.findUserAndLoadData(userId, loadedUsers, season);
        },
        error: () => {
          this.error.set('Failed to load users');
          this.isLoading.set(false);
        },
      });
    } else {
      this.findUserAndLoadData(userId, users, season);
    }
  }

  private findUserAndLoadData(userId: number, users: User[], season: number): void {
    const user = users.find((u) => u.mbrId === userId);
    if (!user) {
      this.error.set(`User not found (ID: ${userId})`);
      this.isLoading.set(false);
      return;
    }

    this._profileUser.set(user);

    // Load all category data for this user
    const categoryRequests: Record<CategorySlug, ReturnType<typeof this.leaderboardService.getLeaderboard>> = {
      batters: this.leaderboardService.getLeaderboard('batters', season),
      ops: this.leaderboardService.getLeaderboard('ops', season),
      homeruns: this.leaderboardService.getLeaderboard('homeruns', season),
      pitchers: this.leaderboardService.getLeaderboard('pitchers', season),
      'rbi-champion': this.leaderboardService.getLeaderboard('rbi-champion', season),
      'stolen-bases': this.leaderboardService.getLeaderboard('stolen-bases', season),
      dimaggio: this.leaderboardService.getLeaderboard('dimaggio', season),
    };

    forkJoin(categoryRequests).subscribe({
      next: (results) => {
        const categoryData: CategoryWithStanding[] = CATEGORIES.map((cat) => {
          const standings = results[cat.slug];
          const userStanding = standings.find(
            (s) => s.userName.toLowerCase() === user.name.toLowerCase()
          );
          const qualifiedCount = standings.filter((s) => !s.isDisqualified).length;

          // Find the leader (rank 1, not disqualified)
          const leader = standings.find((s) => s.rank === 1 && !s.isDisqualified);

          return {
            category: cat.slug,
            displayName: cat.displayName,
            unit: cat.unit,
            userRank: userStanding?.isDisqualified ? null : (userStanding?.rank ?? null),
            userPoints: userStanding?.points ?? null,
            totalParticipants: qualifiedCount,
            leaderName: leader?.userName ?? null,
            leaderPoints: leader?.points ?? null,
            standing: userStanding ?? null,
          };
        });

        this._categoryData.set(categoryData);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load standings');
        this.isLoading.set(false);
      },
    });
  }

  protected toggleExpand(category: CategorySlug): void {
    if (this.expandedCategory() === category) {
      this.expandedCategory.set(null);
    } else {
      this.expandedCategory.set(category);
    }
  }

  protected isExpanded(category: CategorySlug): boolean {
    return this.expandedCategory() === category;
  }

  protected formatPoints(points: number, category: CategorySlug): string {
    if (category === 'batters' || category === 'ops') {
      return points.toFixed(3);
    }
    return Math.round(points).toString();
  }

  protected formatAverage(value: number | null | undefined): string {
    if (value === null || value === undefined) return '--';
    return (value * 1000).toFixed(1);
  }

  protected formatDifference(value: number | null | undefined): string {
    if (value === null || value === undefined) return '--';
    return (value >= 0 ? '+' : '') + value;
  }

  protected getCategory(slug: CategorySlug): Category | undefined {
    return getCategoryBySlug(slug);
  }
}

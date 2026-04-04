import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Category,
  CategorySlug,
  User,
  UserStanding,
  BatterPick,
  HomerunPick,
  PitcherPick,
  AlternatePick,
} from '../../core/models';
import { LeaderboardService, UserService } from '../../core/services';
import { LoadingSpinnerComponent } from './loading-spinner';

@Component({
  selector: 'app-user-comparison-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
    >
      <!-- Modal -->
      <div
        #modalContent
        class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="comparison-title" class="text-xl font-bold text-club-forest">
            Compare {{ category().displayName }} Picks
          </h2>
          <button
            type="button"
            (click)="close.emit()"
            class="text-club-gray hover:text-club-forest
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime rounded"
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- User Selection -->
        <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div class="grid grid-cols-2 gap-4">
            <!-- User A -->
            <div>
              <label for="user-a-select" class="block text-sm font-medium text-club-forest mb-1">
                User A
              </label>
              <select
                id="user-a-select"
                [formControl]="userAControl"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-club-lime focus:border-club-lime"
              >
                <option [ngValue]="null">Select a user...</option>
                @for (user of users(); track user.mbrId) {
                  <option [ngValue]="user">{{ user.name }}</option>
                }
              </select>
            </div>

            <!-- User B -->
            <div>
              <label for="user-b-select" class="block text-sm font-medium text-club-forest mb-1">
                User B
              </label>
              <select
                id="user-b-select"
                [formControl]="userBControl"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-club-lime focus:border-club-lime"
              >
                <option [ngValue]="null">Select a user...</option>
                @for (user of users(); track user.mbrId) {
                  <option [ngValue]="user">{{ user.name }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <!-- Comparison Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          @if (isLoading()) {
            <div class="py-8">
              <app-loading-spinner message="Loading picks..." />
            </div>
          } @else if (!selectedUserA() || !selectedUserB()) {
            <div class="text-center py-8 text-club-gray">
              <p>Select two users above to compare their {{ category().displayName.toLowerCase() }} picks.</p>
            </div>
          } @else if (standingA() && standingB()) {
            <!-- User Headers with Rankings -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-club-sage/20 rounded-lg p-3 text-center">
                <h3 class="font-semibold text-club-forest">{{ selectedUserA()!.name }}</h3>
                @if (standingA()!.isDisqualified) {
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-club-burgundy text-white">
                    Disqualified
                  </span>
                } @else {
                  <div class="text-sm text-club-gray">
                    Rank #{{ standingA()!.rank }} · {{ formatPoints(standingA()!.points) }}
                  </div>
                }
              </div>
              <div class="bg-club-sage/20 rounded-lg p-3 text-center">
                <h3 class="font-semibold text-club-forest">{{ selectedUserB()!.name }}</h3>
                @if (standingB()!.isDisqualified) {
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-club-burgundy text-white">
                    Disqualified
                  </span>
                } @else {
                  <div class="text-sm text-club-gray">
                    Rank #{{ standingB()!.rank }} · {{ formatPoints(standingB()!.points) }}
                  </div>
                }
              </div>
            </div>

            <!-- Category-specific picks comparison -->
            @switch (category().slug) {
              @case ('batters') {
                <div class="grid grid-cols-2 gap-4">
                  <!-- User A Picks -->
                  <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-club-gray uppercase">Picks</h4>
                    @for (pick of standingA()!.batterPicks ?? []; track pick.playerName) {
                      <div
                        class="flex justify-between items-center px-3 py-2 rounded-md border"
                        [class.bg-white]="!pick.isDisqualified"
                        [class.border-gray-200]="!pick.isDisqualified"
                        [class.bg-red-50]="pick.isDisqualified"
                        [class.border-red-200]="pick.isDisqualified"
                      >
                        <span class="text-sm" [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                        @if (pick.isDisqualified) {
                          <span class="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">{{ pick.plateAppearances }} PA</span>
                        } @else {
                          <span class="font-mono text-sm">{{ formatBatterAvg(pick.average) }}</span>
                        }
                      </div>
                    }
                  </div>
                  <!-- User B Picks -->
                  <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-club-gray uppercase">Picks</h4>
                    @for (pick of standingB()!.batterPicks ?? []; track pick.playerName) {
                      <div
                        class="flex justify-between items-center px-3 py-2 rounded-md border"
                        [class.bg-white]="!pick.isDisqualified"
                        [class.border-gray-200]="!pick.isDisqualified"
                        [class.bg-red-50]="pick.isDisqualified"
                        [class.border-red-200]="pick.isDisqualified"
                      >
                        <span class="text-sm" [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                        @if (pick.isDisqualified) {
                          <span class="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">{{ pick.plateAppearances }} PA</span>
                        } @else {
                          <span class="font-mono text-sm">{{ formatBatterAvg(pick.average) }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              @case ('ops') {
                <div class="grid grid-cols-2 gap-4">
                  <!-- User A Picks -->
                  <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-club-gray uppercase">Picks</h4>
                    @for (pick of standingA()!.batterPicks ?? []; track pick.playerName) {
                      <div
                        class="flex justify-between items-center px-3 py-2 rounded-md border"
                        [class.bg-white]="!pick.isDisqualified"
                        [class.border-gray-200]="!pick.isDisqualified"
                        [class.bg-red-50]="pick.isDisqualified"
                        [class.border-red-200]="pick.isDisqualified"
                      >
                        <span class="text-sm" [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                        @if (pick.isDisqualified) {
                          <span class="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">{{ pick.plateAppearances }} PA</span>
                        } @else {
                          <span class="font-mono text-sm">{{ formatOps(pick.ops) }}</span>
                        }
                      </div>
                    }
                  </div>
                  <!-- User B Picks -->
                  <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-club-gray uppercase">Picks</h4>
                    @for (pick of standingB()!.batterPicks ?? []; track pick.playerName) {
                      <div
                        class="flex justify-between items-center px-3 py-2 rounded-md border"
                        [class.bg-white]="!pick.isDisqualified"
                        [class.border-gray-200]="!pick.isDisqualified"
                        [class.bg-red-50]="pick.isDisqualified"
                        [class.border-red-200]="pick.isDisqualified"
                      >
                        <span class="text-sm" [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                        @if (pick.isDisqualified) {
                          <span class="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">{{ pick.plateAppearances }} PA</span>
                        } @else {
                          <span class="font-mono text-sm">{{ formatOps(pick.ops) }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              @case ('homeruns') {
                <div class="space-y-4">
                  <!-- HR Picks -->
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <h4 class="text-xs font-semibold text-club-gray uppercase">Home Run Picks</h4>
                      @for (pick of standingA()!.homerunPicks ?? []; track pick.playerName) {
                        <div class="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-gray-200">
                          <span class="text-sm">{{ pick.playerName }}</span>
                          <span class="font-mono font-semibold">{{ pick.homeRuns }}</span>
                        </div>
                      }
                    </div>
                    <div class="space-y-2">
                      <h4 class="text-xs font-semibold text-club-gray uppercase">Home Run Picks</h4>
                      @for (pick of standingB()!.homerunPicks ?? []; track pick.playerName) {
                        <div class="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-gray-200">
                          <span class="text-sm">{{ pick.playerName }}</span>
                          <span class="font-mono font-semibold">{{ pick.homeRuns }}</span>
                        </div>
                      }
                    </div>
                  </div>
                  <!-- Alternates -->
                  @if ((standingA()!.alternatePicks?.length ?? 0) > 0 || (standingB()!.alternatePicks?.length ?? 0) > 0) {
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <h4 class="text-xs font-semibold text-club-gray uppercase">Alternate Batters</h4>
                        @for (pick of standingA()!.alternatePicks ?? []; track pick.playerName) {
                          <div
                            class="flex justify-between items-center px-3 py-2 rounded-md border"
                            [class.bg-white]="!pick.isDisqualified"
                            [class.border-gray-200]="!pick.isDisqualified"
                            [class.bg-red-50]="pick.isDisqualified"
                            [class.border-red-200]="pick.isDisqualified"
                          >
                            <span class="text-sm" [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                            <span class="font-mono text-sm text-club-gray">{{ formatBatterAvg(pick.average) }}</span>
                          </div>
                        }
                      </div>
                      <div class="space-y-2">
                        <h4 class="text-xs font-semibold text-club-gray uppercase">Alternate Batters</h4>
                        @for (pick of standingB()!.alternatePicks ?? []; track pick.playerName) {
                          <div
                            class="flex justify-between items-center px-3 py-2 rounded-md border"
                            [class.bg-white]="!pick.isDisqualified"
                            [class.border-gray-200]="!pick.isDisqualified"
                            [class.bg-red-50]="pick.isDisqualified"
                            [class.border-red-200]="pick.isDisqualified"
                          >
                            <span class="text-sm" [class.text-club-gray]="pick.isDisqualified">{{ pick.playerName }}</span>
                            <span class="font-mono text-sm text-club-gray">{{ formatBatterAvg(pick.average) }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              @case ('pitchers') {
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-club-gray uppercase">Pitcher Picks</h4>
                    @for (pick of standingA()!.pitcherPicks ?? []; track pick.playerName) {
                      <div class="px-3 py-2 bg-white rounded-md border border-gray-200">
                        <div class="font-medium text-sm">{{ pick.playerName }}</div>
                        <div class="flex gap-3 mt-1 text-xs font-mono text-club-gray">
                          <span>{{ pick.wins }}-{{ pick.losses }}</span>
                          <span>{{ pick.era.toFixed(2) }} ERA</span>
                          <span>{{ pick.strikeouts }} K</span>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-club-gray uppercase">Pitcher Picks</h4>
                    @for (pick of standingB()!.pitcherPicks ?? []; track pick.playerName) {
                      <div class="px-3 py-2 bg-white rounded-md border border-gray-200">
                        <div class="font-medium text-sm">{{ pick.playerName }}</div>
                        <div class="flex gap-3 mt-1 text-xs font-mono text-club-gray">
                          <span>{{ pick.wins }}-{{ pick.losses }}</span>
                          <span>{{ pick.era.toFixed(2) }} ERA</span>
                          <span>{{ pick.strikeouts }} K</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              @case ('rbi-champion') {
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <div class="text-xs font-semibold text-club-gray uppercase mb-2">Predicted RBI Leader</div>
                    <div class="text-lg font-semibold text-club-forest">
                      {{ standingA()!.predictedPlayer ?? '--' }}
                    </div>
                    @if (standingA()!.predictedValue !== null && standingA()!.predictedValue !== undefined) {
                      <div class="text-sm text-club-gray mt-1">{{ standingA()!.predictedValue }} RBI</div>
                    }
                    @if (standingA()!.actualDifference !== null && standingA()!.actualDifference !== undefined) {
                      <div class="text-xs mt-2" [class.text-club-green]="standingA()!.isCorrectPlayer" [class.text-club-gray]="!standingA()!.isCorrectPlayer">
                        {{ formatDifference(standingA()!.actualDifference) }} from actual
                      </div>
                    }
                  </div>
                  <div class="p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <div class="text-xs font-semibold text-club-gray uppercase mb-2">Predicted RBI Leader</div>
                    <div class="text-lg font-semibold text-club-forest">
                      {{ standingB()!.predictedPlayer ?? '--' }}
                    </div>
                    @if (standingB()!.predictedValue !== null && standingB()!.predictedValue !== undefined) {
                      <div class="text-sm text-club-gray mt-1">{{ standingB()!.predictedValue }} RBI</div>
                    }
                    @if (standingB()!.actualDifference !== null && standingB()!.actualDifference !== undefined) {
                      <div class="text-xs mt-2" [class.text-club-green]="standingB()!.isCorrectPlayer" [class.text-club-gray]="!standingB()!.isCorrectPlayer">
                        {{ formatDifference(standingB()!.actualDifference) }} from actual
                      </div>
                    }
                  </div>
                </div>
              }

              @case ('stolen-bases') {
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <div class="text-xs font-semibold text-club-gray uppercase mb-2">Predicted SB Leader</div>
                    <div class="text-lg font-semibold text-club-forest">
                      {{ standingA()!.predictedPlayer ?? '--' }}
                    </div>
                    @if (standingA()!.predictedValue !== null && standingA()!.predictedValue !== undefined) {
                      <div class="text-sm text-club-gray mt-1">{{ standingA()!.predictedValue }} SB</div>
                    }
                    @if (standingA()!.actualDifference !== null && standingA()!.actualDifference !== undefined) {
                      <div class="text-xs mt-2" [class.text-club-green]="standingA()!.isCorrectPlayer" [class.text-club-gray]="!standingA()!.isCorrectPlayer">
                        {{ formatDifference(standingA()!.actualDifference) }} from actual
                      </div>
                    }
                  </div>
                  <div class="p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <div class="text-xs font-semibold text-club-gray uppercase mb-2">Predicted SB Leader</div>
                    <div class="text-lg font-semibold text-club-forest">
                      {{ standingB()!.predictedPlayer ?? '--' }}
                    </div>
                    @if (standingB()!.predictedValue !== null && standingB()!.predictedValue !== undefined) {
                      <div class="text-sm text-club-gray mt-1">{{ standingB()!.predictedValue }} SB</div>
                    }
                    @if (standingB()!.actualDifference !== null && standingB()!.actualDifference !== undefined) {
                      <div class="text-xs mt-2" [class.text-club-green]="standingB()!.isCorrectPlayer" [class.text-club-gray]="!standingB()!.isCorrectPlayer">
                        {{ formatDifference(standingB()!.actualDifference) }} from actual
                      </div>
                    }
                  </div>
                </div>
              }

              @case ('dimaggio') {
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <div class="text-xs font-semibold text-club-gray uppercase mb-2">Predicted Longest Streak</div>
                    <div class="text-lg font-semibold text-club-forest">
                      {{ standingA()!.predictedValue ?? '--' }} games
                    </div>
                    @if (standingA()!.actualDifference !== null && standingA()!.actualDifference !== undefined) {
                      <div class="text-xs mt-2 text-club-gray">
                        {{ formatDifference(standingA()!.actualDifference) }} from actual
                      </div>
                    }
                  </div>
                  <div class="p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <div class="text-xs font-semibold text-club-gray uppercase mb-2">Predicted Longest Streak</div>
                    <div class="text-lg font-semibold text-club-forest">
                      {{ standingB()!.predictedValue ?? '--' }} games
                    </div>
                    @if (standingB()!.actualDifference !== null && standingB()!.actualDifference !== undefined) {
                      <div class="text-xs mt-2 text-club-gray">
                        {{ formatDifference(standingB()!.actualDifference) }} from actual
                      </div>
                    }
                  </div>
                </div>
              }
            }
          } @else {
            <div class="text-center py-8 text-club-gray">
              <p>Could not load comparison data. Please try again.</p>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            (click)="close.emit()"
            class="w-full sm:w-auto px-4 py-2 bg-club-forest text-white rounded-md
                   hover:bg-club-green focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  `,
})
export class UserComparisonModalComponent {
  private readonly userService = inject(UserService);
  private readonly leaderboardService = inject(LeaderboardService);

  /** The category to compare picks for (required) */
  readonly category = input.required<Category>();
  /** Pre-selected user A (optional) */
  readonly initialUserA = input<User | null>(null);
  /** Pre-selected user B (optional) */
  readonly initialUserB = input<User | null>(null);

  readonly close = output<void>();

  protected readonly userAControl = new FormControl<User | null>(null);
  protected readonly userBControl = new FormControl<User | null>(null);

  /** Users sorted alphabetically by name */
  protected readonly users = computed(() =>
    [...this.userService.users()].sort((a, b) => a.name.localeCompare(b.name))
  );
  protected readonly isLoading = signal(false);
  private readonly _standings = signal<UserStanding[]>([]);

  protected readonly selectedUserA = signal<User | null>(null);
  protected readonly selectedUserB = signal<User | null>(null);

  private readonly modalContent = viewChild<ElementRef<HTMLDivElement>>('modalContent');

  protected readonly standingA = computed(() => {
    const userA = this.selectedUserA();
    if (!userA) return null;
    return this._standings().find(
      (s) => s.userName.toLowerCase() === userA.name.toLowerCase()
    ) ?? null;
  });

  protected readonly standingB = computed(() => {
    const userB = this.selectedUserB();
    if (!userB) return null;
    return this._standings().find(
      (s) => s.userName.toLowerCase() === userB.name.toLowerCase()
    ) ?? null;
  });

  constructor() {
    // Load users if not already loaded
    if (this.userService.users().length === 0) {
      this.userService.loadUsers().subscribe();
    }

    // Set initial users if provided
    effect(() => {
      const initialA = this.initialUserA();
      const initialB = this.initialUserB();

      if (initialA) {
        this.userAControl.setValue(initialA);
      }
      if (initialB) {
        this.userBControl.setValue(initialB);
      }
    });

    // Load leaderboard data when category changes
    effect(() => {
      const cat = this.category();
      if (cat) {
        this.loadLeaderboard(cat.slug);
      }
    });

    // React to user selection changes
    this.userAControl.valueChanges.subscribe((user) => {
      this.selectedUserA.set(user);
    });

    this.userBControl.valueChanges.subscribe((user) => {
      this.selectedUserB.set(user);
    });

    // Focus trap - focus modal on open
    effect(() => {
      const modal = this.modalContent();
      if (modal) {
        modal.nativeElement.focus();
      }
    });
  }

  private loadLeaderboard(category: CategorySlug): void {
    this.isLoading.set(true);
    const season = this.leaderboardService.selectedSeason();

    this.leaderboardService.getLeaderboard(category, season).subscribe({
      next: (standings) => {
        this._standings.set(standings);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  protected formatPoints(points: number | null): string {
    if (points === null) return '--';
    const cat = this.category();
    if (cat.slug === 'batters' || cat.slug === 'ops') {
      return (points * 1000).toFixed(1);
    }
    return Math.round(points).toString();
  }

  protected formatBatterAvg(value: number): string {
    return (value * 1000).toFixed(1);
  }

  protected formatOps(value: number): string {
    return (value * 1000).toFixed(0);
  }

  protected formatDifference(value: number | null | undefined): string {
    if (value === null || value === undefined) return '--';
    return (value >= 0 ? '+' : '') + value;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}

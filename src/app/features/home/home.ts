import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { CategorySummary } from '../../core/models';
import { LeaderboardService, UserService } from '../../core/services';
import { CategoryCardComponent, LoadingSpinnerComponent, UserSelectModalComponent } from '../../shared/ui';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryCardComponent, LoadingSpinnerComponent, UserSelectModalComponent],
  template: `
    <!-- User Selection Modal (only show after initialization to prevent flash) -->
    @if (showUserModal()) {
      <app-user-select-modal (userSelected)="onUserSelected()" />
    }

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <header class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-club-forest">
          Welcome, {{ userService.currentUserName() || 'Guest' }}
        </h1>
        <p class="mt-1 text-club-gray">
          Your standings across all categories
        </p>
      </header>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="py-12">
          <app-loading-spinner message="Loading your standings..." />
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div
          class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
          role="alert"
        >
          <p class="font-medium">Error loading standings</p>
          <p class="text-sm mt-1">{{ error() }}</p>
          <button
            type="button"
            (click)="retry()"
            class="mt-3 text-sm font-medium text-red-600 hover:text-red-800
                   focus:outline-none focus-visible:underline"
          >
            Try again
          </button>
        </div>
      } @else if (summaries() && summaries()!.length > 0) {
        <!-- Category Cards Grid -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          role="list"
          aria-label="Competition categories"
        >
          @for (summary of summaries(); track summary.category) {
            <div role="listitem">
              <app-category-card [summary]="summary" />
            </div>
          }
        </div>
      } @else if (userService.isUserSelected()) {
        <!-- No Data State -->
        <div class="text-center py-12 text-club-gray">
          <p>No standings data available.</p>
        </div>
      }
    </div>
  `,
})
export class HomeComponent {
  protected readonly userService = inject(UserService);
  private readonly leaderboardService = inject(LeaderboardService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly _summaries = signal<CategorySummary[] | null>(null);

  protected readonly summaries = this._summaries.asReadonly();

  // Only show modal after initialization to prevent flash on page reload
  protected readonly showUserModal = computed(
    () => this.userService.isInitialized() && !this.userService.isUserSelected()
  );

  constructor() {
    // Load summaries when user or season changes
    effect(() => {
      const userName = this.userService.currentUserName();
      const season = this.leaderboardService.selectedSeason();
      if (userName) {
        this.loadSummaries(userName, season);
      } else {
        this._summaries.set(null);
      }
    });
  }

  private loadSummaries(userName: string, season: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.leaderboardService.getCategorySummaries(userName, season).subscribe({
      next: (summaries) => {
        this._summaries.set(summaries);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load standings');
        this.isLoading.set(false);
      },
    });
  }

  protected onUserSelected(): void {
    // Summaries will load via the effect
  }

  protected retry(): void {
    const userName = this.userService.currentUserName();
    const season = this.leaderboardService.selectedSeason();
    if (userName) {
      this.loadSummaries(userName, season);
    }
  }
}

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
  templateUrl: './home.html',
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

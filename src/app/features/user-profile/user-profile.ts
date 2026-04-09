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
  templateUrl: './user-profile.html',
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

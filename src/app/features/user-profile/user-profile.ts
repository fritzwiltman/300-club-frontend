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
  AlternatePick,
} from '../../core/models';
import { LeaderboardService, UserService } from '../../core/services';
import { LoadingSpinnerComponent, RulesPopoverComponent } from '../../shared/ui';

// Extended slug type to include the pseudo-category for alternates
type ProfileCategorySlug = CategorySlug | 'alternates';

interface CategoryWithStanding extends CategorySummary {
  standing: UserStanding | null;
}

interface ProfileCategory {
  slug: ProfileCategorySlug;
  displayName: string;
  unit: string;
  userPoints: number | null;
  standing: UserStanding | null;
  alternatePicks?: readonly AlternatePick[];
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
  protected readonly expandedCategories = signal<Set<ProfileCategorySlug>>(new Set());

  protected readonly profileUser = this._profileUser.asReadonly();
  protected readonly categoryData = this._categoryData.asReadonly();

  // Display categories including the alternates pseudo-category
  protected readonly displayCategories = computed((): ProfileCategory[] => {
    const data = this._categoryData();
    if (data.length === 0) return [];

    const result: ProfileCategory[] = [];

    // Find alternate picks - check batters first, then homeruns (homeruns endpoint returns them)
    const battersData = data.find(c => c.category === 'batters');
    const homerunsData = data.find(c => c.category === 'homeruns');
    const alternatePicks = battersData?.standing?.alternatePicks ?? homerunsData?.standing?.alternatePicks;

    for (const cat of data) {
      // Add the category
      result.push({
        slug: cat.category,
        displayName: cat.displayName,
        unit: cat.unit,
        userPoints: cat.userPoints,
        standing: cat.standing,
      });

      // After batters, insert the alternates pseudo-category
      if (cat.category === 'batters' && alternatePicks?.length) {
        // Calculate alternates average
        const qualifiedAlternates = alternatePicks.filter(p => !p.isDisqualified);
        const avgPoints = qualifiedAlternates.length > 0
          ? qualifiedAlternates.reduce((sum, p) => sum + p.average, 0) / qualifiedAlternates.length
          : null;

        result.push({
          slug: 'alternates',
          displayName: 'Alternate Batters',
          unit: 'AVG',
          userPoints: avgPoints,
          standing: null,
          alternatePicks: alternatePicks,
        });
      }
    }

    return result;
  });

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
            mlbLeaderName: null,
            mlbLeaderValue: null,
            mlbLeaderHeadshotUrl: null,
            mlbLeaderTeam: null,
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

  protected toggleExpand(category: ProfileCategorySlug): void {
    const current = this.expandedCategories();
    const newSet = new Set(current);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    this.expandedCategories.set(newSet);
  }

  protected isExpanded(category: ProfileCategorySlug): boolean {
    return this.expandedCategories().has(category);
  }

  protected formatPoints(points: number, category: ProfileCategorySlug): string {
    if (category === 'batters' || category === 'ops' || category === 'alternates') {
      // AVG and OPS: multiply by 1000 and show 1 decimal (e.g., 299.9)
      return (points * 1000).toFixed(1);
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

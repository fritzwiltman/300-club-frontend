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

interface UserWithRank extends User {
  rank: number;
  isDisqualified: boolean;
}

@Component({
  selector: 'app-user-comparison-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './user-comparison-modal.html',
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

  protected readonly isLoading = signal(false);
  private readonly _standings = signal<UserStanding[]>([]);

  protected readonly selectedUserA = signal<User | null>(null);
  protected readonly selectedUserB = signal<User | null>(null);

  private readonly modalContent = viewChild<ElementRef<HTMLDivElement>>('modalContent');

  /** Users with rank info, sorted by rank */
  protected readonly rankedUsers = computed(() => {
    const users = this.userService.users();
    const standings = this._standings();

    // Map users to include rank info
    const usersWithRank: UserWithRank[] = users.map((user) => {
      const standing = standings.find(
        (s) => s.userName.toLowerCase() === user.name.toLowerCase()
      );
      return {
        ...user,
        rank: standing?.rank ?? 999,
        isDisqualified: standing?.isDisqualified ?? true,
      };
    });

    // Sort: qualified users by rank, then disqualified users alphabetically
    return usersWithRank.sort((a, b) => {
      if (a.isDisqualified && !b.isDisqualified) return 1;
      if (!a.isDisqualified && b.isDisqualified) return -1;
      if (a.isDisqualified && b.isDisqualified) return a.name.localeCompare(b.name);
      return a.rank - b.rank;
    });
  });

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

  // Shared player names sets
  private readonly sharedBatterNames = computed(() => {
    const picksA = this.standingA()?.batterPicks ?? [];
    const picksB = this.standingB()?.batterPicks ?? [];
    const namesB = new Set(picksB.map((p) => p.playerName.toLowerCase()));
    return new Set(
      picksA
        .filter((p) => namesB.has(p.playerName.toLowerCase()))
        .map((p) => p.playerName.toLowerCase())
    );
  });

  private readonly sharedHomerunNames = computed(() => {
    const picksA = this.standingA()?.homerunPicks ?? [];
    const picksB = this.standingB()?.homerunPicks ?? [];
    const namesB = new Set(picksB.map((p) => p.playerName.toLowerCase()));
    return new Set(
      picksA
        .filter((p) => namesB.has(p.playerName.toLowerCase()))
        .map((p) => p.playerName.toLowerCase())
    );
  });

  private readonly sharedPitcherNames = computed(() => {
    const picksA = this.standingA()?.pitcherPicks ?? [];
    const picksB = this.standingB()?.pitcherPicks ?? [];
    const namesB = new Set(picksB.map((p) => p.playerName.toLowerCase()));
    return new Set(
      picksA
        .filter((p) => namesB.has(p.playerName.toLowerCase()))
        .map((p) => p.playerName.toLowerCase())
    );
  });

  private readonly sharedAlternateNames = computed(() => {
    const picksA = this.standingA()?.alternatePicks ?? [];
    const picksB = this.standingB()?.alternatePicks ?? [];
    const namesB = new Set(picksB.map((p) => p.playerName.toLowerCase()));
    return new Set(
      picksA
        .filter((p) => namesB.has(p.playerName.toLowerCase()))
        .map((p) => p.playerName.toLowerCase())
    );
  });

  // Sorted picks - shared first, then unique
  protected readonly sortedBatterPicksA = computed(() => {
    const picks = [...(this.standingA()?.batterPicks ?? [])];
    const shared = this.sharedBatterNames();
    return picks.sort((a, b) => {
      const aShared = shared.has(a.playerName.toLowerCase());
      const bShared = shared.has(b.playerName.toLowerCase());
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;
      return 0;
    });
  });

  protected readonly sortedBatterPicksB = computed(() => {
    const picks = [...(this.standingB()?.batterPicks ?? [])];
    const shared = this.sharedBatterNames();
    return picks.sort((a, b) => {
      const aShared = shared.has(a.playerName.toLowerCase());
      const bShared = shared.has(b.playerName.toLowerCase());
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;
      return 0;
    });
  });

  protected readonly sortedHomerunPicksA = computed(() => {
    const picks = [...(this.standingA()?.homerunPicks ?? [])];
    const shared = this.sharedHomerunNames();
    return picks.sort((a, b) => {
      const aShared = shared.has(a.playerName.toLowerCase());
      const bShared = shared.has(b.playerName.toLowerCase());
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;
      return 0;
    });
  });

  protected readonly sortedHomerunPicksB = computed(() => {
    const picks = [...(this.standingB()?.homerunPicks ?? [])];
    const shared = this.sharedHomerunNames();
    return picks.sort((a, b) => {
      const aShared = shared.has(a.playerName.toLowerCase());
      const bShared = shared.has(b.playerName.toLowerCase());
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;
      return 0;
    });
  });

  protected readonly sortedPitcherPicksA = computed(() => {
    const picks = [...(this.standingA()?.pitcherPicks ?? [])];
    const shared = this.sharedPitcherNames();
    return picks.sort((a, b) => {
      const aShared = shared.has(a.playerName.toLowerCase());
      const bShared = shared.has(b.playerName.toLowerCase());
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;
      return 0;
    });
  });

  protected readonly sortedPitcherPicksB = computed(() => {
    const picks = [...(this.standingB()?.pitcherPicks ?? [])];
    const shared = this.sharedPitcherNames();
    return picks.sort((a, b) => {
      const aShared = shared.has(a.playerName.toLowerCase());
      const bShared = shared.has(b.playerName.toLowerCase());
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;
      return 0;
    });
  });

  protected readonly sortedAlternatePicksA = computed(() => {
    const picks = [...(this.standingA()?.alternatePicks ?? [])];
    const shared = this.sharedAlternateNames();
    return picks.sort((a, b) => {
      const aShared = shared.has(a.playerName.toLowerCase());
      const bShared = shared.has(b.playerName.toLowerCase());
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;
      return 0;
    });
  });

  protected readonly sortedAlternatePicksB = computed(() => {
    const picks = [...(this.standingB()?.alternatePicks ?? [])];
    const shared = this.sharedAlternateNames();
    return picks.sort((a, b) => {
      const aShared = shared.has(a.playerName.toLowerCase());
      const bShared = shared.has(b.playerName.toLowerCase());
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;
      return 0;
    });
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

  protected isSharedBatterPick(playerName: string): boolean {
    return this.sharedBatterNames().has(playerName.toLowerCase());
  }

  protected isSharedHomerunPick(playerName: string): boolean {
    return this.sharedHomerunNames().has(playerName.toLowerCase());
  }

  protected isSharedPitcherPick(playerName: string): boolean {
    return this.sharedPitcherNames().has(playerName.toLowerCase());
  }

  protected isSharedAlternatePick(playerName: string): boolean {
    return this.sharedAlternateNames().has(playerName.toLowerCase());
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
    return (value * 1000).toFixed(0);
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

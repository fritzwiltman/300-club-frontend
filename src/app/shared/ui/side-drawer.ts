import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LeaderboardService, Season, UserService } from '../../core/services';

@Component({
  selector: 'app-side-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/50 animate-fade-in"
      (click)="close.emit()"
      aria-hidden="true"
    ></div>

    <!-- Drawer -->
    <div
      #drawerContent
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      class="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl flex flex-col
             animate-slide-in-right"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-club-forest">
        <h2 id="drawer-title" class="text-lg font-semibold text-white">
          Menu
        </h2>
        <button
          type="button"
          (click)="close.emit()"
          class="p-1 rounded-md text-white/80 hover:text-white hover:bg-club-green/30
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
          aria-label="Close menu"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Season Section -->
        <section>
          <h3 class="text-xs font-semibold text-club-gray uppercase tracking-wide mb-2">
            Season
          </h3>
          <div class="space-y-1">
            @for (season of leaderboardService.availableSeasons; track season) {
              <button
                type="button"
                (click)="onSeasonSelect(season)"
                class="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm
                       transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
                [class.bg-club-sage]="leaderboardService.selectedSeason() === season"
                [class.text-club-forest]="leaderboardService.selectedSeason() === season"
                [class.font-medium]="leaderboardService.selectedSeason() === season"
                [class.hover:bg-gray-100]="leaderboardService.selectedSeason() !== season"
                [class.text-club-forest]="leaderboardService.selectedSeason() !== season"
              >
                <span>{{ season }}</span>
                @if (leaderboardService.selectedSeason() === season) {
                  <svg class="w-4 h-4 text-club-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                }
              </button>
            }
          </div>
        </section>

        <!-- User Section -->
        <section>
          <h3 class="text-xs font-semibold text-club-gray uppercase tracking-wide mb-2">
            Current User
          </h3>
          @if (userService.isUserSelected()) {
            <div class="bg-club-sage/30 rounded-lg p-3">
              <div class="font-medium text-club-forest">
                {{ userService.currentUserName() }}
              </div>
              <button
                type="button"
                (click)="onChangeUser()"
                class="mt-2 text-sm text-club-green hover:text-club-forest underline
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime rounded"
              >
                Switch User
              </button>
            </div>
          } @else {
            <div class="text-sm text-club-gray">
              No user selected
            </div>
          }
        </section>

        <!-- Navigation Section -->
        <section>
          <h3 class="text-xs font-semibold text-club-gray uppercase tracking-wide mb-2">
            Navigation
          </h3>
          <div class="space-y-1">
            <a
              routerLink="/"
              (click)="close.emit()"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-club-forest
                     hover:bg-gray-100 transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </a>
            @if (userService.isUserSelected()) {
              <a
                [routerLink]="['/user', userService.currentUser()?.mbrId]"
                (click)="close.emit()"
                class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-club-forest
                       hover:bg-gray-100 transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My Profile</span>
              </a>
            }
            <a
              routerLink="/users"
              (click)="close.emit()"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-club-forest
                     hover:bg-gray-100 transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Browse Users</span>
            </a>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-club-gray text-center">
        The Three Hundred Club
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slide-in-right {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-fade-in {
      animation: fade-in 200ms ease-out;
    }
    .animate-slide-in-right {
      animation: slide-in-right 200ms ease-out;
    }
  `],
})
export class SideDrawerComponent {
  protected readonly userService = inject(UserService);
  protected readonly leaderboardService = inject(LeaderboardService);
  private readonly router = inject(Router);

  readonly close = output<void>();

  private readonly drawerContent = viewChild<ElementRef<HTMLDivElement>>('drawerContent');

  constructor() {
    // Focus the drawer when opened
    setTimeout(() => {
      this.drawerContent()?.nativeElement.focus();
    }, 0);
  }

  protected onSeasonSelect(season: Season): void {
    this.leaderboardService.setSeason(season);
  }

  protected onChangeUser(): void {
    this.close.emit();
    this.userService.clearUser();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}

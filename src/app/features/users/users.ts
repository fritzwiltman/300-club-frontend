import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '../../core/models';
import { UserService } from '../../core/services';
import { LoadingSpinnerComponent } from '../../shared/ui';

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      <!-- Header -->
      <header class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-club-forest">
          Browse Users
        </h1>
        <p class="mt-1 text-club-gray">
          View standings for any member
        </p>
      </header>

      <!-- Search -->
      <div class="mb-6">
        <label for="user-search" class="sr-only">Search users</label>
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-club-gray"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="user-search"
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by name..."
            class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-club-lime focus:border-club-lime
                   text-club-forest placeholder-club-gray"
          />
          @if (searchQuery()) {
            <button
              type="button"
              (click)="clearSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                     text-club-gray hover:text-club-forest hover:bg-gray-100
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
              aria-label="Clear search"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          }
        </div>
      </div>

      @if (isLoading()) {
        <div class="py-12">
          <app-loading-spinner message="Loading users..." />
        </div>
      } @else {
        <!-- Results count -->
        <p class="text-sm text-club-gray mb-3">
          @if (searchQuery()) {
            {{ filteredUsers().length }} of {{ users().length }} members
          } @else {
            {{ users().length }} members
          }
        </p>

        <!-- User List -->
        <div class="bg-white rounded-lg shadow divide-y divide-gray-100">
          @for (user of filteredUsers(); track user.mbrId) {
            <a
              [routerLink]="['/user', user.mbrId]"
              class="flex items-center justify-between px-4 py-3
                     hover:bg-club-sage/20 transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-club-lime"
              [class.bg-club-sage/30]="isCurrentUser(user)"
            >
              <div class="flex items-center gap-3">
                <!-- Avatar placeholder -->
                <div class="w-10 h-10 rounded-full bg-club-sage flex items-center justify-center">
                  <span class="text-sm font-semibold text-club-forest">
                    {{ getInitials(user.name) }}
                  </span>
                </div>
                <div>
                  <span class="font-medium text-club-forest">{{ user.name }}</span>
                  @if (isCurrentUser(user)) {
                    <span class="ml-2 text-xs px-1.5 py-0.5 bg-club-lime text-club-forest rounded">You</span>
                  }
                </div>
              </div>
              <svg class="w-5 h-5 text-club-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          } @empty {
            <div class="px-4 py-8 text-center text-club-gray">
              <p>No users found matching "{{ searchQuery() }}"</p>
              <button
                type="button"
                (click)="clearSearch()"
                class="mt-2 text-club-green hover:text-club-forest underline
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime rounded"
              >
                Clear search
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class UsersComponent {
  private readonly userService = inject(UserService);

  protected readonly searchQuery = signal('');
  protected readonly isLoading = signal(false);
  protected readonly users = this.userService.users;

  protected readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allUsers = this.users();

    if (!query) {
      return allUsers;
    }

    return allUsers.filter((user) =>
      user.name.toLowerCase().includes(query)
    );
  });

  constructor() {
    // Load users if not already loaded
    if (this.userService.users().length === 0) {
      this.isLoading.set(true);
      this.userService.loadUsers().subscribe({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false),
      });
    }
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected isCurrentUser(user: User): boolean {
    const current = this.userService.currentUser();
    return current !== null && current.mbrId === user.mbrId;
  }

  protected getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

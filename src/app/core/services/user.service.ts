import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { User, RawUser, mapRawUser } from '../models';

const STORAGE_KEY = '300club_user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  // Private writable signals
  private readonly _currentUser = signal<User | null>(null);
  private readonly _users = signal<User[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _isInitialized = signal(false);

  // Public readonly signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly users = this._users.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isInitialized = this._isInitialized.asReadonly();

  // Computed state
  readonly isUserSelected = computed(() => this._currentUser() !== null);
  readonly currentUserName = computed(() => this._currentUser()?.name ?? '');
  readonly currentUserId = computed(() => this._currentUser()?.mbrId ?? null);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (!this.isBrowser) {
      // Don't mark as initialized during SSR - wait for client hydration
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        this._currentUser.set(user);
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }

    // Mark as initialized after checking localStorage
    this._isInitialized.set(true);
  }

  selectUser(user: User): void {
    this._currentUser.set(user);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }

  clearUser(): void {
    this._currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  loadUsers(): Observable<User[]> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<RawUser[]>('/leaderboard/users/').pipe(
      map((rawUsers) => rawUsers.map(mapRawUser)),
      tap({
        next: (users) => {
          this._users.set(users);
          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.message ?? 'Failed to load users');
          this._isLoading.set(false);
        },
      })
    );
  }
}

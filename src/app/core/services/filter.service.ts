import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CategorySlug, SavedFilter, SavedFiltersStorage } from '../models';

const STORAGE_KEY = '300club_saved_filters';

@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly platformId = inject(PLATFORM_ID);

  // Private writable signal for all saved filters
  private readonly _savedFilters = signal<SavedFiltersStorage>({});

  // Public readonly signal
  readonly savedFilters = this._savedFilters.asReadonly();

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Get saved filters for a specific category.
   */
  getSavedFiltersForCategory(category: CategorySlug): readonly SavedFilter[] {
    return this._savedFilters()[category] ?? [];
  }

  /**
   * Create a computed signal for a specific category's saved filters.
   * Useful for reactive updates in components.
   */
  savedFiltersForCategory(category: CategorySlug) {
    return computed(() => this.getSavedFiltersForCategory(category));
  }

  /**
   * Save a new filter for a category.
   */
  saveFilter(
    category: CategorySlug,
    name: string,
    userNameFilters: readonly string[],
    playerFilters: readonly string[]
  ): void {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      category,
      userNameFilters,
      playerFilters,
      createdAt: Date.now(),
    };

    this._savedFilters.update((current) => {
      const categoryFilters = current[category] ?? [];
      return {
        ...current,
        [category]: [...categoryFilters, newFilter],
      };
    });

    this.persistToStorage();
  }

  /**
   * Delete a saved filter by ID.
   */
  deleteFilter(category: CategorySlug, filterId: string): void {
    this._savedFilters.update((current) => {
      const categoryFilters = current[category] ?? [];
      return {
        ...current,
        [category]: categoryFilters.filter((f) => f.id !== filterId),
      };
    });

    this.persistToStorage();
  }

  /**
   * Clear all saved filters for a category.
   */
  clearFiltersForCategory(category: CategorySlug): void {
    this._savedFilters.update((current) => {
      const { [category]: _, ...rest } = current;
      return rest;
    });

    this.persistToStorage();
  }

  private loadFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const filters = JSON.parse(stored) as SavedFiltersStorage;
        this._savedFilters.set(filters);
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }

  private persistToStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._savedFilters()));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }
}

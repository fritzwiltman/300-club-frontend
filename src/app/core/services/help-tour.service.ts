import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = '300club_tour_completed';

export interface TourStep {
  readonly id: string;
  readonly targetSelector: string;
  readonly title: string;
  readonly description: string;
  readonly position: 'top' | 'bottom' | 'left' | 'right';
}

export const LEADERBOARD_TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'search',
    targetSelector: '#user-search',
    title: 'Search Users',
    description: 'Type a name and press Enter to filter the leaderboard. Add multiple names to see any matching users (OR logic).',
    position: 'bottom',
  },
  {
    id: 'filter',
    targetSelector: '[data-tour="filter-button"]',
    title: 'Filter by Players',
    description: 'Click to filter by MLB players. Find users who picked specific players, or use "My Picks" to see who shares your selections.',
    position: 'bottom',
  },
  {
    id: 'save-filter',
    targetSelector: '[data-tour="filter-button"]',
    title: 'Save Filters',
    description: 'After selecting filters, click "Save current filter" to save your combination. Saved filters persist and are category-specific.',
    position: 'bottom',
  },
  {
    id: 'compare',
    targetSelector: '[data-tour="compare-button"]',
    title: 'Compare Users',
    description: 'Compare picks side-by-side between any two users. Great for seeing how your picks stack up!',
    position: 'bottom',
  },
  {
    id: 'active-filters',
    targetSelector: '[data-tour="filter-controls"]',
    title: 'Active Filters',
    description: 'Your active filters appear as chips below. Click X to remove individual filters, or "Clear all" to reset.',
    position: 'bottom',
  },
];

@Injectable({ providedIn: 'root' })
export class HelpTourService {
  private readonly platformId = inject(PLATFORM_ID);

  // Tour state
  readonly isActive = signal(false);
  readonly currentStepIndex = signal(0);
  readonly steps = signal<readonly TourStep[]>([]);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Check if the user has completed the tour before.
   */
  hasCompletedTour(): boolean {
    if (!this.isBrowser) return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  /**
   * Start the tour with the given steps.
   */
  startTour(steps: readonly TourStep[]): void {
    this.steps.set(steps);
    this.currentStepIndex.set(0);
    this.isActive.set(true);
  }

  /**
   * Start the leaderboard filter tour.
   */
  startLeaderboardTour(): void {
    this.startTour(LEADERBOARD_TOUR_STEPS);
  }

  /**
   * Move to the next step.
   */
  nextStep(): void {
    const current = this.currentStepIndex();
    const total = this.steps().length;
    if (current < total - 1) {
      this.currentStepIndex.set(current + 1);
    } else {
      this.completeTour();
    }
  }

  /**
   * Move to the previous step.
   */
  previousStep(): void {
    const current = this.currentStepIndex();
    if (current > 0) {
      this.currentStepIndex.set(current - 1);
    }
  }

  /**
   * Skip/close the tour without marking as complete.
   */
  closeTour(): void {
    this.isActive.set(false);
    this.currentStepIndex.set(0);
    this.steps.set([]);
  }

  /**
   * Complete the tour and mark as seen.
   */
  completeTour(): void {
    this.closeTour();
    if (this.isBrowser) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Reset the tour completion flag (for testing or re-showing).
   */
  resetTourCompletion(): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Get the current step.
   */
  get currentStep(): TourStep | null {
    const steps = this.steps();
    const index = this.currentStepIndex();
    return steps[index] ?? null;
  }
}

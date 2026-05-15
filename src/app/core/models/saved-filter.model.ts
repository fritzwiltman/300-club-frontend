import { CategorySlug } from './category.model';

/**
 * A saved filter configuration that persists user name and player filters
 * for quick re-application on the leaderboard.
 */
export interface SavedFilter {
  readonly id: string;
  readonly name: string;
  readonly category: CategorySlug;
  readonly userNameFilters: readonly string[];
  readonly playerFilters: readonly string[];
  readonly createdAt: number;
}

/**
 * Storage format for saved filters, organized by category slug.
 */
export type SavedFiltersStorage = Partial<Record<CategorySlug, readonly SavedFilter[]>>;

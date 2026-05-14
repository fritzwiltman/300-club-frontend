export type CategorySlug =
  | 'batters'
  | 'ops'
  | 'homeruns'
  | 'pitchers'
  | 'rbi-champion'
  | 'stolen-bases'
  | 'dimaggio';

export interface Category {
  readonly slug: CategorySlug;
  readonly displayName: string;
  readonly description: string;
  readonly unit: string;
  readonly minPlateAppearances?: number;
  readonly rules: string;
  readonly tiebreakers: readonly string[];
}

export const CATEGORIES: readonly Category[] = [
  {
    slug: 'batters',
    displayName: 'Batters',
    description: 'Aggregate batting average of qualified picks',
    unit: 'AVG',
    minPlateAppearances: 502,
    rules: 'Pick 10 batters. Your score is the aggregate batting average of all qualified picks. Alternates automatically replace any batter who fails to reach the prorated minimum plate appearances (502 PA full season).',
    tiebreakers: ['Alternates\' Average'],
  },
  {
    slug: 'ops',
    displayName: 'OPS',
    description: 'Aggregate OPS of picks',
    unit: 'OPS',
    minPlateAppearances: 502,
    rules: 'Pick 10 batters. Your score is the aggregate OPS (On-base Plus Slugging) of all qualified picks. Players must reach the prorated minimum plate appearances to qualify.',
    tiebreakers: ['Alternates\' OPS'],
  },
  {
    slug: 'homeruns',
    displayName: 'Home Runs',
    description: 'Top 3 of 4 picked players home runs',
    unit: 'HRs',
    rules: 'Pick 4 players. Your score is the total home runs from your top 3 performers. The 4th pick serves as your first tiebreaker.',
    tiebreakers: ['4th pick home runs', 'Alternates\' Average'],
  },
  {
    slug: 'pitchers',
    displayName: 'Pitchers',
    description: 'Top 3 of 4 pitchers wins',
    unit: 'Wins',
    rules: 'Pick 4 pitchers. Your score is the total wins from your top 3 performers. The 4th pitcher serves as your first tiebreaker.',
    tiebreakers: ['4th pitcher wins', 'Win-Loss percentage', 'ERA', 'Alternates\' Average'],
  },
  {
    slug: 'rbi-champion',
    displayName: 'RBI Champion',
    description: 'Predict the MLB RBI leader',
    unit: 'RBIs',
    rules: 'Predict which player will lead MLB in RBIs. If you pick the correct player, your score is their RBI total. The member whose prediction is closest to the actual RBI leader wins.',
    tiebreakers: ['Alternates\' Average'],
  },
  {
    slug: 'stolen-bases',
    displayName: 'Stolen Bases',
    description: 'Predict the MLB stolen base leader',
    unit: 'SBs',
    rules: 'Predict which player will lead MLB in stolen bases. If you pick the correct player, your score is their stolen base total. The member whose prediction is closest to the actual leader wins.',
    tiebreakers: ['Alternates\' Average'],
  },
  {
    slug: 'dimaggio',
    displayName: 'DiMaggio',
    description: 'Predict the longest hitting streak',
    unit: 'Games',
    rules: 'Predict the longest hitting streak of the MLB season. The member whose prediction is closest to the actual longest streak wins.',
    tiebreakers: ['Alternates\' Average'],
  },
] as const;

export function getCategoryBySlug(slug: CategorySlug): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

import { CategorySlug } from './category.model';

// Pick types for expandable rows
export interface BatterPick {
  readonly playerName: string;
  readonly average: number;
  readonly ops: number;
  readonly isDisqualified?: boolean;
  readonly plateAppearances?: number;
}

export interface HomerunPick {
  readonly playerName: string;
  readonly homeRuns: number;
}

export interface PitcherPick {
  readonly playerName: string;
  readonly wins: number;
  readonly losses: number;
  readonly era: number;
  readonly strikeouts: number;
}

export interface AlternatePick {
  readonly playerName: string;
  readonly average: number;
  readonly isDisqualified: boolean;
  readonly plateAppearances?: number;
}

export interface UserStanding {
  readonly userName: string;
  readonly rank: number;
  readonly points: number | null;
  readonly isDisqualified: boolean;
  // Tiebreaker fields (optional, varies by category)
  readonly alternatesAverage?: number | null;
  readonly alternatesOps?: number | null;
  readonly fourthPickValue?: number | null; // 4th HR or 4th pitcher wins
  readonly winLossPct?: number | null;
  readonly era?: number | null;
  // For prediction categories
  readonly predictedPlayer?: string;
  readonly predictedValue?: number | null;
  readonly actualDifference?: number | null;
  readonly isCorrectPlayer?: boolean;
  // Picks for expandable rows
  readonly batterPicks?: readonly BatterPick[];
  readonly homerunPicks?: readonly HomerunPick[];
  readonly pitcherPicks?: readonly PitcherPick[];
  readonly alternatePicks?: readonly AlternatePick[];
}

export interface CategorySummary {
  readonly category: CategorySlug;
  readonly displayName: string;
  readonly unit: string;
  readonly userRank: number | null;
  readonly userPoints: number | null;
  readonly totalParticipants: number;
  // Leader info (contest leader among users)
  readonly leaderName: string | null;
  readonly leaderPoints: number | null;
  // MLB leader info (actual MLB stats leader)
  readonly mlbLeaderName: string | null;
  readonly mlbLeaderValue: number | null;
  readonly mlbLeaderHeadshotUrl: string | null;
  readonly mlbLeaderTeam: string | null;
}

// Raw API response types for each category

export interface RawBatterEntry {
  readonly user_name: string;
  readonly aggregate_average: number | string | null;
  readonly alternate_average: number | string | null;
  readonly aggregate_ops: number | string | null;
  readonly rank: number;
  readonly qualified_picks?: readonly {
    player_name: string;
    average: number | string;
    ops: number | string;
    plate_appearances?: number | string;
  }[];
  readonly disqualified_picks?: readonly {
    player_name: string;
    plate_appearances: number | string;
  }[];
}

export interface RawOpsEntry {
  readonly user_name: string;
  readonly aggregate_ops: number | string | null;
  readonly alternate_average: number | string | null;
  readonly rank: number;
  readonly qualified_picks?: readonly {
    player_name: string;
    ops: number | string;
    average: number | string;
    plate_appearances?: number | string;
  }[];
  readonly disqualified_picks?: readonly {
    player_name: string;
    plate_appearances: number | string;
  }[];
}

export interface RawHomerunsEntry {
  readonly user_name: string;
  readonly top_three_total_homeruns: number;
  readonly first_tiebreaker_homeruns: number | null;
  readonly second_tiebreaker_average: number;
  readonly rank: number;
  readonly all_homerun_picks?: readonly {
    player_name: string;
    home_runs: number;
  }[];
  readonly alternate_batters_picks?: readonly {
    player_name: string;
    average: number | string;
    is_disqualified: boolean;
  }[];
}

export interface RawPitchersEntry {
  readonly user_name: string;
  readonly top_three_total_wins: number;
  readonly first_tiebreaker_wins: number | null;
  readonly second_tiebreaker_win_pct: number | null;
  readonly third_tiebreaker_era: number | null;
  readonly fourth_tiebreaker_alt_avg: number | null;
  readonly rank: number;
  readonly pitcher_picks?: readonly {
    player_name: string;
    wins: number;
    losses: number;
    era: number | string;
    strikeouts: number;
  }[];
}

export interface RawRbiChampionResponse {
  readonly actual_rbi_leader: {
    player_name: string;
    rbis: number;
  };
  readonly leaderboard: readonly {
    user_name: string;
    predicted_player: string;
    predicted_rbis: number | null;
    predicted_correct_player: boolean;
    rbi_difference: number | null;
    alternates_average: number | null;
    rank: number | null;
  }[];
}

export interface RawStolenBasesResponse {
  readonly actual_sb_leader: {
    player_name: string;
    stolen_bases: number;
  };
  readonly leaderboard: readonly {
    user_name: string;
    predicted_player: string;
    predicted_stolen_bases: number | null;
    predicted_correct_player: boolean;
    sb_difference: number | null;
    alternates_average: number | null;
    rank: number | null;
  }[];
}

export interface RawDimaggioResponse {
  readonly actual_longest_streak: number | null;
  readonly streak_holder_name: string | null;
  readonly leaderboard: readonly {
    user_name: string;
    predicted_streak: number | null;
    is_exact_match: boolean;
    alternates_average: number | null;
    rank: number | null;
  }[];
}

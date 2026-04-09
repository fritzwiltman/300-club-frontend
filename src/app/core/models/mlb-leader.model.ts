/**
 * MLB League Leader - represents a top player in a category
 */
export interface MlbLeader {
  readonly rank: number;
  readonly playerName: string;
  readonly team: string;
  readonly value: number;
  readonly headshotUrl: string | null;
}

/**
 * Raw API response for a single MLB leader
 */
export interface RawMlbLeader {
  readonly rank: number;
  readonly player_name: string;
  readonly team: string;
  readonly value: number;
  readonly headshot_url: string | null;
}

/**
 * Raw API response wrapper
 */
export interface RawMlbLeadersResponse {
  readonly leaders: readonly RawMlbLeader[];
}
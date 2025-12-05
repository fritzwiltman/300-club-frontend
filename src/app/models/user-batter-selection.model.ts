import { Batter } from './batter.model';
import { DisqualifiedBatterSelection } from './disqualified-batter-selection.model';

export interface UserBatterSelection {
    rank: number;
    name: string;
    eligibleBattersAvg: number;
    alternatesAvg: number;
    eligibleOPS: number;
    qualifiedPicks: Batter[];
    disqualifiedPicks: DisqualifiedBatterSelection[];
}

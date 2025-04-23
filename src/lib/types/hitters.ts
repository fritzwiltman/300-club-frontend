export interface UserHitterSelection {
    rank: number;
    name: string;
    eligibleBattersAvg: number;
    alternatesAvg: number;
    eligibleOPS: number;
    selections: Hitter[];
}

export interface Hitter {
    name: string;
    avg: number;
    ops: number;
}
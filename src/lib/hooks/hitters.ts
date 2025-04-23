import { useState, useEffect } from 'react';
import { UserHitterSelection, Hitter } from '../types/hitters';

export function useHitterLeaderboard() {
    const [hittersLeaderboardData, setHittersLeaderboardData] = useState<UserHitterSelection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchHitterLeaderboard() {
            try {
                const response = await fetch("http://127.0.0.1:8000/leaderboard/batters/");
                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }
                const data = await response.json();

                const transformedData: UserHitterSelection[] = data.map((userSelection: any) =>({
                    rank: userSelection["rank"],
                    name: userSelection["user_name"],
                    eligibleBattersAvg: Number(userSelection["aggregate_average"]),
                    alternatesAvg: Number(userSelection["alternate_average"]),
                    eligibleOPS: Number(userSelection["aggregate_ops"]),
                    selections: userSelection["qualified_picks"].map((selection: any) => ({
                        name: selection["player_name"],
                        avg: Number(selection["average"]),
                        ops: Number(selection["ops"]),
                    })),
                }));
                setHittersLeaderboardData(transformedData);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error);
                } else {
                    setError(new Error("An unknown error occurred"));
                }
                setHittersLeaderboardData([]);
            } finally {
                setLoading(false);
            }
        }
        fetchHitterLeaderboard();
    }, []);
    
    return { hittersLeaderboardData: hittersLeaderboardData, loading, error };
}


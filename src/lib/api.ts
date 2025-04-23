import { UserHitterSelection } from './types/hitters';

export async function getHitterLeaderboard() {
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
        selections: userSelection["qualified_picks"].map((selection: any) => {

            return {
                name: selection["player_name"],
                average: Number(selection["average"]),
                ops: Number(selection["ops"]),
            };
        }),
    }));
    return transformedData;
}
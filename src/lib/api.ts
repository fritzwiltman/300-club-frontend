import { UserHitterSelection } from './types/hitters';

export async function getHitterLeaderboard() {
    const response = await fetch("http://127.0.0.1:8000/leaderboard/batters");
    
    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    console.log("HITTERS");
    const data = await response.json();
    console.log(data);

    const transformedData: UserHitterSelection[] = data.map((userSelection: any) =>({
        rank: userSelection["rank"],
        name: userSelection["user_name"],
        eligibleBattersAvg: Number(userSelection["aggregate_average"]),
        alternatesAvg: Number(userSelection["alternate_average"]),
        eligibleOPS: Number(userSelection["aggregate_ops"]),
        selections: userSelection["qualified_picks"].map((selection: any) => {
            console.log("Selection Data:", selection);  // Log the full selection object
            console.log("Selection Average Before Transformation:", selection["average"]);
    
            return {
                name: selection["player_name"],
                average: Number(selection["average"]),
                ops: Number(selection["ops"]),
            };
        }),
    }));

    return transformedData;
}
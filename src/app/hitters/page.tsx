import { UserHitterSelection } from "@/lib/types/hitters"
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getHitterLeaderboard } from "@/lib/api";


export default async function HittersLeaderboard() {
    const hittersLeaderboardData = await getHitterLeaderboard();

    return (
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={hittersLeaderboardData} />
        </div>
    );
}
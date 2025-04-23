'use client'

import { useHitterLeaderboard } from "@/lib/hooks/hitters";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { useUser } from "@/context/UserContext";

export default function HittersLeaderboard() {
    const { hittersLeaderboardData, loading, error } = useHitterLeaderboard();
    const { userName } = useUser();

    if (loading) return <p>Loading…</p>;
    if (error) return <p>Error: {error.message}</p>;

    const yourEntry = hittersLeaderboardData.find((u) => u.name === userName)

    return (
        <div className="container mx-auto py-10">
            {yourEntry && (
                <div className="mb-4 text-lg">
                    Your rank: <span className="font-bold">{yourEntry.rank}</span>
                </div>
            )}
            <DataTable columns={columns} data={hittersLeaderboardData} highlightName={userName} />
        </div>
    );
}
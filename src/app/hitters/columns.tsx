"use client"

import { ColumnDef } from "@tanstack/react-table"
import { UserHitterSelection } from "@/lib/types/hitters"

export const columns: ColumnDef<UserHitterSelection>[] = [
    {
        accessorKey: "rank",
        header: ({ column }) => <span className="text-center w-full block">Rank</span>,
        cell: ({ getValue }) => <span className="text-center">{getValue<number>()}</span>,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <span className="text-center w-full block">Member</span>,
        cell: ({ getValue }) => <span className="font-medium text-center">{getValue<string>()}</span>,
    },
    {
        accessorKey: "eligibleBattersAvg",
        header: "Eligible Batters' Average",
        cell: ({ getValue }) => {
            const value = getValue<number>() * 1000;
            return <span>{value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}</span>
        },
    },
    {
        accessorKey: "alternatesAvg",
        header: "Alternates' Average",
        cell: ({ getValue }) => {
            const value = getValue<number>() * 1000;
            return <span>{value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}</span>
        },
    },
    {
        accessorKey: "eligibleOPS",
        header: "Eligible Batters' OPS",
        cell: ({ getValue }) => <span>{getValue<number>().toFixed(4)}</span>,
    },
]

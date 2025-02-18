"use client"

import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getExpandedRowModel } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserHitterSelection } from "@/lib/types/hitters";
import { useState } from "react";
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface DataTableProps {
    columns: ColumnDef<UserHitterSelection>[];
    data: UserHitterSelection[];
}

export function DataTable({ columns, data }: DataTableProps) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    })

    const handleRowClick = (rowId: string) => {
        setExpandedRow((prevRow) => (prevRow === rowId ? null : rowId))
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => {
                            const isExpanded = expandedRow === row.id;
                            return (
                                <React.Fragment key={row.id}>
                                    <TableRow key={row.id} onClick={() => handleRowClick(row.id)}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right">
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow key={`${row.id}-expanded`}>
                                            <TableCell colSpan={columns.length}>
                                                <div className="p-4 bg-gray-100 rounded-md">
                                                    <h3 className="font-semibold text-lg mb-2">Selections:</h3>
                                                    <table className="w-full border-collapse border border-gray-200 rounded-md">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="border border-gray-300 px-3 py-2 text-left">Player</th>
                                                                <th className="border border-gray-300 px-3 py-2 text-center">AVG</th>
                                                                <th className="border border-gray-300 px-3 py-2 text-center">OPS</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(row.original.selections || []).map((selection, index) => (
                                                                <tr key={index} className="odd:bg-white even:bg-gray-50">
                                                                    <td className="border border-gray-300 px-3 py-2">{selection.name}</td>
                                                                    <td className="border border-gray-300 px-3 py-2 text-center">{(selection.average * 1000)}</td>
                                                                    <td className="border border-gray-300 px-3 py-2 text-center">{(selection.ops ?? 0).toFixed(3)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>)
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
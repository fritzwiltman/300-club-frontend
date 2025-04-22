"use client"

import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getExpandedRowModel } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserHitterSelection } from "@/lib/types/hitters";
import { useState, useEffect } from "react";
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

interface DataTableProps {
    columns: ColumnDef<UserHitterSelection>[];
    data: UserHitterSelection[];
}

export function DataTable({ columns, data }: DataTableProps) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    useEffect(() => {
        console.log("Modal open state changed:", isModalOpen);
    }, [isModalOpen]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),

    });

    const handleCheckboxChange = (row: UserHitterSelection) => {
        setSelectedRows((prevSelectedRows) => {
            const newSelectedRows = { ...prevSelectedRows };

            if (newSelectedRows[row.name]) {
                delete newSelectedRows[row.name];
            } else if (Object.keys(newSelectedRows).length < 5) {
                newSelectedRows[row.name] = true;
            }

            return newSelectedRows;
        })
    };

    const selectedUsers = Object.keys(selectedRows).filter((rowId) => selectedRows[rowId])

    const handleRowClick = (rowId: string) => {
        setExpandedRow((prevRow) => (prevRow === rowId ? null : rowId))
    };

    return (
        <div>
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Member Ranking For Batters</h2>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    disabled={Object.keys(selectedRows).length < 2}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:cursor-not-allowed disabled:opacity-50"
                >Compare ({selectedUsers.length}) Users' Selections</Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                <TableHead className="w-10 text-center">Compare</TableHead>
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
                                <TableHead className="w-10 text-center">Show Selections</TableHead>
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const isExpanded = expandedRow === row.id;
                                const isSelected = !!selectedRows[row.original.name];

                                return (
                                    <React.Fragment key={row.id}>
                                        <TableRow key={row.id} onClick={(e) => e.stopPropagation()} >
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleCheckboxChange(row.original)}
                                                    disabled={!isSelected && Object.keys(selectedRows).length >= 5}
                                                />
                                            </TableCell>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right pr-4 cursor-pointer hover:opacity-80" onClick={() => handleRowClick(row.id)}>
                                                <div className="flex justify-end items-center">
                                                    {isExpanded ? <ChevronDown size={16} className="cursor-pointer" /> : <ChevronRight size={16} className="cursor-pointer" />}
                                                </div>
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
            <Dialog open={isModalOpen} onOpenChange={() => setIsModalOpen(!isModalOpen)}>
                <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <DialogHeader>
                        <DialogTitle>
                            Compare Users' Selections
                        </DialogTitle>
                        <DialogDescription>Comparing selections of selected users</DialogDescription>
                    </DialogHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">Player</TableHead>
                                    {selectedUsers.map((rowId) => {
                                        const user = data.find((row) => row.name === rowId);
                                        return (
                                            <TableHead key={rowId} className="text-center">
                                                {user?.name}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(() => {
                                    // Step 1: Collect all unique player names and count occurrences
                                    const playerSelectionCount = new Map<string, number>();

                                    selectedUsers.forEach((userName) => {
                                        const user = data.find((row) => row.name === userName);
                                        user?.selections.forEach((sel) => {
                                            playerSelectionCount.set(sel.name, (playerSelectionCount.get(sel.name) || 0) + 1);
                                        });
                                    });

                                    // Step 2: Sort players by most selected first, then alphabetically
                                    const sortedPlayers = Array.from(playerSelectionCount.keys()).sort((a, b) => {
                                        const countA = playerSelectionCount.get(a) || 0;
                                        const countB = playerSelectionCount.get(b) || 0;
                                        return countB - countA || a.localeCompare(b); // Sort by count, then alphabetically
                                    });

                                    // Step 3: Render table rows
                                    return sortedPlayers.map((playerName) => {
                                        // Check if all users selected this player (for row highlighting)
                                        const userSelections = selectedUsers.map((userName) => {
                                            const user = data.find((row) => row.name === userName);
                                            return user?.selections.find((sel) => sel.name === playerName) || null;
                                        });

                                        const hasDifferences = userSelections.some((sel => sel === null));

                                        return (
                                            <TableRow key={playerName} className={hasDifferences ? "bg-red-200" : ""}>
                                                <TableCell className="font-medium">{playerName}</TableCell>
                                                {selectedUsers.map((userName, index) => {
                                                    const user = data.find((row) => row.name === userName);
                                                    const selection = user?.selections.find((sel) => sel.name === playerName);

                                                    return (
                                                        <TableCell key={userName} className="text-center">
                                                            {selection ? (
                                                                <>
                                                                    <span>AVG: {(selection.average * 1000).toFixed(0)}</span>
                                                                    <br />
                                                                    <span>OPS: {(selection.ops ?? 0).toFixed(3)}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-500">—</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    });
                                })()}
                            </TableBody>

                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
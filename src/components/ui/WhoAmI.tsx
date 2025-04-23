'use client'

import { useUser } from "@/context/UserContext"
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";

export function WhoAmI() {
    const { userName, setUserName } = useUser();
    const [draft, setDraft] = useState('');

    // If we already know who they are, don't show
    if (userName) return null;

    return (
        <Dialog open={!userName}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Welcome to the 300 Club</DialogTitle>
                    <p>Please select your name, or </p>
                </DialogHeader>
                <div className="space-y-4">
                    <input
                        placeholder="Enter your name"
                        value={draft}
                        onChange={(e) => setDraft(e.currentTarget.value)}
                    />
                    <Button
                        disabled={!draft.trim()}
                        onClick={() => setUserName(draft.trim())}
                    >
                        Let’s Go
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
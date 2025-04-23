'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserContextValue {
    userName: string | null;
    setUserName: (name: string) => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [userName, setUserName] = useState<string | null>(null);

    // On mount, load from localStorage
    useEffect(() => {
        const saved = window.localStorage.getItem('hc_current_user');
        if (saved) setUserName(saved);
    }, [])

    // Whenever it changes, save it
    useEffect(() => {
        if (userName) window.localStorage.setItem('hc_current_user', userName);
    }, [userName])

    return (
        <UserContext.Provider value={{ userName, setUserName }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be inside UserProvider');
    return ctx;
}
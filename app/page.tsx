"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";

/**
 * Root page — acts as a client-side fallback redirect.
 * The middleware handles most cases, but if the cookie isn't set yet
 * (e.g. first load with Zustand persisted state), this ensures proper routing.
 */
export default function Home() {
    const router = useRouter();
    const { user } = useStore();

    useEffect(() => {
        if (user && user.id && user.id !== "1") {
            router.replace("/dashboard");
        } else {
            router.replace("/login");
        }
    }, [user, router]);

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
                    <span className="text-white text-xl font-bold">₹</span>
                </div>
                <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    );
}

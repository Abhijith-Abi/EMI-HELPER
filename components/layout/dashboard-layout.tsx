"use client";

import { useState, useEffect } from "react";
import { Sidebar, MobileSidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { useStore } from "@/store";
import { Logo } from "@/components/ui/logo";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = useStore((s) => s.user);

    // The proxy (server-side) already verified the user-id cookie before
    // this page was served. If we're here, the user is authenticated at
    // the network level. We just need to wait for Zustand to rehydrate
    // from localStorage so the UI has user data to display.
    //
    // If somehow the store never gets a valid user (e.g. localStorage was
    // cleared manually), redirect to login after a generous timeout.
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Check if store already has a valid user
        const currentUser = useStore.getState().user;
        if (currentUser && currentUser.id && currentUser.id !== "1") {
            setReady(true);
            return;
        }

        // Subscribe to store changes (Zustand persist rehydration)
        const unsub = useStore.subscribe((state) => {
            if (state.user && state.user.id && state.user.id !== "1") {
                setReady(true);
            }
        });

        // Fallback: if after 2 seconds we still don't have a user,
        // something is wrong — redirect to login
        const timeout = setTimeout(() => {
            const u = useStore.getState().user;
            if (!u || !u.id || u.id === "1") {
                window.location.href = "/login";
            } else {
                setReady(true);
            }
        }, 2000);

        return () => {
            unsub();
            clearTimeout(timeout);
        };
    }, []);

    // Also react if user becomes available after initial mount
    useEffect(() => {
        if (user && user.id && user.id !== "1") {
            setReady(true);
        }
    }, [user]);

    if (!ready) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-[pulse_6s_infinite]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-[pulse_6s_infinite]" />
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute h-20 w-20 rounded-full bg-indigo-500/5 animate-ping border border-indigo-500/10" />
                        <Logo iconSize={64} className="animate-[pulse_2s_infinite]" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5 mt-4">
                        <h3 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-indigo-200">
                            Cash ERP
                        </h3>
                        <p className="text-xs text-muted-foreground animate-pulse">
                            Loading secure dashboard...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />

            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="relative flex w-full max-w-xs flex-1 bg-card border-r shadow-xl">
                        <MobileSidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-6xl">{children}</div>
                </main>
            </div>
        </div>
    );
}

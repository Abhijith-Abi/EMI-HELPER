"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useStore } from "@/store";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import {
    LayoutDashboard,
    Wallet,
    TrendingUp,
    Target,
    BarChart3,
    Settings,
    LogOut,
    Landmark,
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "EMI Manager", href: "/dashboard/emis", icon: Landmark },
    { name: "Expenses", href: "/dashboard/expenses", icon: Wallet },
    { name: "Goals", href: "/dashboard/goals", icon: Target },
    { name: "AI Recovery", href: "/dashboard/predictor", icon: TrendingUp },
    { name: "Insights", href: "/dashboard/insights", icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logoutUser } = useStore();

    const handleSignOut = async () => {
        try {
            if (auth) {
                await signOut(auth);
            }
        } catch (e) {
            console.error(e);
        }
        logoutUser();
        window.location.href = "/login";
    };

    return (
        <div className="hidden border-r border-indigo-100/50 bg-white/70 backdrop-blur-xl md:flex md:w-64 md:flex-col">
            <div className="flex h-16 shrink-0 items-center px-6">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 font-bold text-xl tracking-tight"
                >
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-lg">
                            C
                        </span>
                    </div>
                    Cash ERP
                </Link>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
                <nav className="flex-1 space-y-1 px-4 py-4">
                    <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Overview
                    </div>
                    {navigation.map((item) => {
                        const isActive =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname === item.href ||
                                  pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none",
                                    isActive
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-primary/10 rounded-md border-l-2 border-primary"
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 shrink-0 z-10",
                                        isActive
                                            ? "text-primary"
                                            : "text-muted-foreground group-hover:text-foreground",
                                    )}
                                    aria-hidden="true"
                                />
                                <span className="z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t p-4">
                    <nav className="space-y-1">
                        <Link
                            href="/dashboard/settings"
                            className={cn(
                                "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none",
                                pathname === "/dashboard/settings"
                                    ? "text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            )}
                        >
                            {pathname === "/dashboard/settings" && (
                                <motion.div
                                    layoutId="activeSidebar"
                                    className="absolute inset-0 bg-primary/10 rounded-md border-l-2 border-primary"
                                    transition={{
                                        type: "spring",
                                        stiffness: 380,
                                        damping: 30,
                                    }}
                                />
                            )}
                            <Settings className="mr-3 h-5 w-5 shrink-0 z-10" />
                            <span className="z-10">Settings</span>
                        </Link>

                        <button
                            onClick={handleSignOut}
                            className="w-full group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors outline-none cursor-pointer"
                        >
                            <LogOut className="mr-3 h-5 w-5 shrink-0" />
                            Sign out
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar({ onClose }: { onClose: () => void }) {
    const pathname = usePathname();
    const { logoutUser } = useStore();

    const handleSignOut = async () => {
        try {
            if (auth) {
                await signOut(auth);
            }
        } catch (e) {
            console.error(e);
        }
        logoutUser();
        window.location.href = "/login";
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b">
                <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="flex items-center gap-2 font-bold text-xl tracking-tight"
                >
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-lg">
                            C
                        </span>
                    </div>
                    Cash ERP
                </Link>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
                <nav className="flex-1 space-y-1 px-4 py-4">
                    {navigation.map((item) => {
                        const isActive =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname === item.href ||
                                  pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 shrink-0",
                                        isActive
                                            ? "text-primary"
                                            : "text-muted-foreground",
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t p-4 space-y-1">
                    <Link
                        href="/dashboard/settings"
                        onClick={onClose}
                        className={cn(
                            "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                            pathname === "/dashboard/settings"
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                    >
                        <Settings className="mr-3 h-5 w-5 shrink-0" />
                        Settings
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    >
                        <LogOut className="mr-3 h-5 w-5 shrink-0" />
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}

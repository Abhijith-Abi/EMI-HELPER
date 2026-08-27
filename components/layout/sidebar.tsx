"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    ShieldCheck,
    CreditCard,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "EMI Manager", href: "/dashboard/emis", icon: Landmark },
    { name: "Expenses", href: "/dashboard/expenses", icon: Wallet },
    { name: "Goals", href: "/dashboard/goals", icon: Target },
    { name: "AI Recovery", href: "/dashboard/predictor", icon: TrendingUp },
    { name: "Smart Insights", href: "/dashboard/insights", icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logoutUser, user, emis } = useStore();

    const activeEmis = emis.filter((e) => e.status === "Active" && e.remaining_months > 0);
    const totalActiveEmi = activeEmis.reduce((s, e) => s + e.emi_amount, 0);

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
        <aside className="hidden border-r border-white/[0.08] bg-[#090d16]/90 backdrop-blur-2xl md:flex md:w-64 md:flex-col shrink-0 z-30">
            {/* Top Logo Section */}
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/[0.06]">
                <Link href="/dashboard" className="outline-none">
                    <Logo iconSize={32} showText={true} textSize="text-xl" />
                </Link>
            </div>

            {/* Navigation links */}
            <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
                <nav className="space-y-1.5">
                    <div className="mb-3 px-3 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/70">
                        Financial Suite
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
                                    "group relative flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 outline-none select-none",
                                    isActive
                                        ? "text-white font-semibold shadow-lg shadow-indigo-500/10"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]",
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeSidebarPill"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/20 via-indigo-500/15 to-transparent border border-indigo-500/30"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 32,
                                        }}
                                    />
                                )}
                                <item.icon
                                    className={cn(
                                        "mr-3 h-4 w-4 shrink-0 z-10 transition-colors",
                                        isActive
                                            ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                                            : "text-slate-400 group-hover:text-slate-200",
                                    )}
                                    aria-hidden="true"
                                />
                                <span className="z-10 tracking-tight">{item.name}</span>

                                {item.name === "EMI Manager" && activeEmis.length > 0 && (
                                    <span className="ml-auto z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        {activeEmis.length}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Snapshot Card & Settings */}
                <div className="space-y-4 pt-4">
                    {/* Active monthly commitment card */}
                    <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-3.5 shadow-inner">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span className="flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                                Active EMI Load
                            </span>
                            <span className="text-[10px] text-emerald-400 font-medium">Monthly</span>
                        </div>
                        <p className="text-base font-bold text-white font-mono">
                            ₹{totalActiveEmi.toLocaleString()}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{activeEmis.length} active loan{activeEmis.length === 1 ? "" : "s"}</span>
                            <span className="text-indigo-400 font-semibold">
                                {user?.salary ? Math.round((totalActiveEmi / user.salary) * 100) : 0}% of salary
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-white/[0.06] pt-3 space-y-1">
                        <Link
                            href="/dashboard/settings"
                            className={cn(
                                "group relative flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors outline-none",
                                pathname === "/dashboard/settings"
                                    ? "text-white font-semibold bg-white/[0.06] border border-white/[0.08]"
                                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                            )}
                        >
                            <Settings className="mr-3 h-4 w-4 shrink-0" />
                            Settings
                        </Link>

                        <button
                            onClick={handleSignOut}
                            className="w-full group flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors outline-none cursor-pointer"
                        >
                            <LogOut className="mr-3 h-4 w-4 shrink-0" />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export function MobileSidebar({ onClose }: { onClose: () => void }) {
    const pathname = usePathname();
    const { logoutUser, emis } = useStore();
    const activeEmis = emis.filter((e) => e.status === "Active" && e.remaining_months > 0);

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
        <div className="flex flex-col w-full h-full bg-[#090d16] text-foreground">
            <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/[0.08]">
                <Link href="/dashboard" onClick={onClose} className="outline-none">
                    <Logo iconSize={32} showText={true} textSize="text-xl" />
                </Link>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 justify-between">
                <nav className="space-y-1.5">
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
                                    "flex items-center rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-600/20 text-white font-semibold border border-indigo-500/30"
                                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-4 w-4 shrink-0",
                                        isActive ? "text-indigo-400" : "text-slate-400",
                                    )}
                                />
                                {item.name}

                                {item.name === "EMI Manager" && activeEmis.length > 0 && (
                                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                        {activeEmis.length}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/[0.08] pt-4 space-y-1">
                    <Link
                        href="/dashboard/settings"
                        onClick={onClose}
                        className={cn(
                            "flex items-center rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                            pathname === "/dashboard/settings"
                                ? "bg-white/[0.06] text-white font-semibold"
                                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                        )}
                    >
                        <Settings className="mr-3 h-4 w-4 shrink-0" />
                        Settings
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center rounded-xl px-3.5 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                        <LogOut className="mr-3 h-4 w-4 shrink-0" />
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}

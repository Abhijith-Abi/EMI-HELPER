"use client";

import { useState, useRef, useEffect } from "react";
import {
    Menu,
    Bell,
    Search,
    Trash2,
    Check,
    CheckCheck,
    Inbox,
    Sparkles,
    CreditCard,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteModal } from "@/components/ui/delete-modal";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
    const { user, notifications, markNotificationRead, deleteNotification, payAllDueEmis } =
        useStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetDeleteId, setTargetDeleteId] = useState("");

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const initials = user?.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
        : "US";

    const handleMarkAllRead = () => {
        notifications.forEach((n) => {
            if (!n.read) markNotificationRead(n.id);
        });
        toast.success("All notifications marked as read!");
    };

    const triggerDeleteNotification = (id: string) => {
        setTargetDeleteId(id);
        setDeleteModalOpen(true);
    };

    const handleConfirmDeleteNotification = () => {
        deleteNotification(targetDeleteId);
        toast.success("Notification deleted.");
    };

    const handleQuickPayDue = () => {
        const count = payAllDueEmis(true);
        if (count > 0) {
            toast.success(`Successfully processed payment for ${count} due EMI${count > 1 ? "s" : ""}!`);
        } else {
            toast.info("No EMIs are currently due for payment.");
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-white/[0.08] bg-[#090d16]/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
            {/* Mobile logo & hamburger */}
            <div className="flex items-center gap-2 md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    onClick={onMenuClick}
                >
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
                <div className="h-4 w-px bg-white/[0.08] mx-1" aria-hidden="true" />
                <Logo iconSize={26} />
            </div>

            {/* Quick search input */}
            <div className="hidden md:flex flex-1 max-w-md items-center relative">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                <input
                    id="search-field"
                    className="h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
                    placeholder="Search transactions, EMIs, insights..."
                    type="search"
                />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* 1-Click Pay Due Button */}
                <Button
                    onClick={handleQuickPayDue}
                    size="sm"
                    variant="outline"
                    className="hidden sm:inline-flex border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-white hover:border-indigo-500/50 text-xs font-semibold h-8 rounded-lg transition-all"
                >
                    <CreditCard className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                    Pay Due EMIs
                </Button>

                {/* Quick Add Expense Link */}
                <Link href="/dashboard/expenses">
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold h-8 rounded-lg shadow-md shadow-indigo-600/20"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Add Expense</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                </Link>

                {/* Notification Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <span className="sr-only">View notifications</span>
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute 1 top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        )}
                    </Button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-3 w-80 sm:w-96 origin-top-right rounded-2xl border border-white/[0.1] bg-[#0f172a]/95 backdrop-blur-2xl shadow-2xl p-4 z-50 text-white"
                            >
                                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-white">
                                            Notifications
                                        </h3>
                                        {unreadCount > 0 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5" />
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-72 overflow-y-auto space-y-2 py-1 pr-1 scrollbar-thin">
                                    {notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                                            <Inbox className="h-8 w-8 mb-2 text-slate-600" />
                                            <p className="text-xs font-medium text-slate-400">
                                                All caught up! 🎉
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={`relative rounded-xl border p-3 transition-colors ${
                                                    n.read
                                                        ? "bg-white/[0.02] border-white/[0.04] text-slate-400"
                                                        : "bg-indigo-500/10 border-indigo-500/25 text-slate-200"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="space-y-0.5 flex-1 pr-2">
                                                        <p className="text-xs font-semibold text-white">
                                                            {n.title}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 leading-relaxed">
                                                            {n.body}
                                                        </p>
                                                        <span className="text-[10px] text-slate-500 block pt-1">
                                                            {n.date}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {!n.read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-indigo-400 hover:bg-indigo-500/20"
                                                                onClick={() => markNotificationRead(n.id)}
                                                                title="Mark as read"
                                                            >
                                                                <Check className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                                                            onClick={() => triggerDeleteNotification(n.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User Avatar */}
                <Link href="/dashboard/settings">
                    <div className="flex items-center gap-2 pl-1 group cursor-pointer">
                        <Avatar className="h-8 w-8 rounded-xl border border-indigo-500/30 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-md">
                            <AvatarFallback className="bg-transparent text-white font-semibold text-xs">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:block text-left">
                            <p className="text-xs font-semibold text-white leading-tight group-hover:text-indigo-300 transition-colors">
                                {user?.name ? user.name.split(" ")[0] : "Account"}
                            </p>
                            <p className="text-[10px] text-emerald-400 font-medium">
                                Pro Member
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDeleteNotification}
                title="Delete Notification"
                itemName="this notification"
                description="Are you sure you want to remove this notification alert?"
            />
        </header>
    );
}

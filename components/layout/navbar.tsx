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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteModal } from "@/components/ui/delete-modal";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
    const { user, notifications, markNotificationRead, deleteNotification } =
        useStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Proper Delete Modal controls inside Navbar
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
        : "JD";

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

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-indigo-100/50 bg-white/60 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1.5 md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    className="p-1 text-muted-foreground hover:text-foreground"
                    onClick={onMenuClick}
                >
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
                <div
                    className="h-4 w-px bg-indigo-100/60 mx-1"
                    aria-hidden="true"
                />
                <Logo iconSize={26} />
            </div>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <form
                    className="relative flex flex-1 items-center"
                    action="#"
                    method="GET"
                >
                    <label htmlFor="search-field" className="sr-only">
                        Search
                    </label>
                    <Search
                        className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <input
                        id="search-field"
                        className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm outline-none"
                        placeholder="Search transactions, EMIs..."
                        type="search"
                        name="search"
                    />
                </form>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    {/* Notification Button and Popover */}
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground relative"
                            onClick={() =>
                                setShowNotifications(!showNotifications)
                            }
                        >
                            <span className="sr-only">View notifications</span>
                            <Bell className="h-5 w-5" aria-hidden="true" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>

                        {/* Notification Dropdown Panel */}
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    transition={{
                                        type: "spring",
                                        duration: 0.3,
                                    }}
                                    className="absolute right-0 mt-3 w-80 sm:w-96 origin-top-right rounded-2xl border border-indigo-100 bg-white shadow-2xl p-4 z-50"
                                >
                                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Notification Center
                                        </h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                            >
                                                <CheckCheck className="h-3.5 w-3.5" />{" "}
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-72 overflow-y-auto space-y-2 py-1 pr-1 scrollbar-thin">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                <Inbox className="h-8 w-8 mb-2 text-muted-foreground/50" />
                                                <p className="text-xs font-medium">
                                                    All caught up! 🎉
                                                </p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    className={`relative rounded-xl border p-3 transition-colors ${
                                                        n.read
                                                            ? "bg-muted/40 border-border"
                                                            : "bg-indigo-50 border-indigo-200"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="space-y-1 pr-6">
                                                            <h4 className="text-xs font-bold text-foreground leading-snug">
                                                                {n.title}
                                                            </h4>
                                                            <p className="text-[11px] text-muted-foreground leading-normal">
                                                                {n.body}
                                                            </p>
                                                            <span className="text-[9px] font-semibold text-muted-foreground/60 block mt-1">
                                                                {n.date}
                                                            </span>
                                                        </div>

                                                        {/* Notification Control Buttons */}
                                                        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                                                            {!n.read && (
                                                                <button
                                                                    onClick={() =>
                                                                        markNotificationRead(
                                                                            n.id,
                                                                        )
                                                                    }
                                                                    className="rounded-full p-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                                    title="Mark as Read"
                                                                >
                                                                    <Check className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    triggerDeleteNotification(
                                                                        n.id,
                                                                    )
                                                                }
                                                                className="rounded-full p-1 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                                                title="Delete Notification"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>

                                                        {/* Unread Status Dot */}
                                                        {!n.read && (
                                                            <span className="absolute bottom-2 right-3 h-2 w-2 rounded-full bg-primary" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Separator */}
                    <div
                        className="hidden lg:block lg:h-6 lg:w-px lg:bg-border"
                        aria-hidden="true"
                    />

                    {/* Profile dropdown */}
                    <div className="flex items-center gap-x-4 lg:gap-x-6">
                        <div className="-m-1.5 flex items-center p-1.5">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden lg:flex lg:items-center">
                                <span
                                    className="ml-3 text-sm font-semibold leading-6 text-foreground"
                                    aria-hidden="true"
                                >
                                    {user?.name || "John Doe"}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDeleteNotification}
                title="Delete Alert Notification"
                description="Are you sure you want to dismiss and permanently delete this notification? It will be removed from your cloud account logs."
            />
        </header>
    );
}

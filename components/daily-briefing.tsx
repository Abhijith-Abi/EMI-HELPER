"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const BRIEFING_KEY = "ai-daily-briefing";

interface StoredBriefing {
    date: string;
    text: string;
}

export function DailyBriefing() {
    const { user, emis, expenses, goals } = useStore();
    const [briefing, setBriefing] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const generatedRef = useRef(false);

    const today = new Date().toISOString().split("T")[0];

    const generate = async (showNotification = false) => {
        setLoading(true);
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content:
                                "Give me a short daily financial briefing (under 100 words). Include: 1) A one-line summary of my financial health today, 2) The single most important action to focus on today, 3) One key number to remember (daily spending limit or upcoming EMI). Be motivating and concise like a personal CFO checking in each morning. Start directly with the briefing, no greeting.",
                        },
                    ],
                    context: {
                        salary: user?.salary || 0,
                        emis,
                        expenses,
                        goals,
                    },
                }),
            });
            const data = await res.json();
            const text = data.reply || "";
            if (text) {
                setBriefing(text);
                // Store today's briefing
                localStorage.setItem(
                    BRIEFING_KEY,
                    JSON.stringify({ date: today, text }),
                );

                if (showNotification) {
                    // Add to in-app notification center
                    const notifId = `briefing-${today}`;
                    const existing = useStore.getState().notifications;
                    if (!existing.some((n) => n.id === notifId)) {
                        useStore.setState((state) => ({
                            notifications: [
                                {
                                    id: notifId,
                                    title: "🌅 Your Daily AI Briefing",
                                    body:
                                        text.length > 140
                                            ? text.substring(0, 140) + "..."
                                            : text,
                                    date: today,
                                    read: false,
                                },
                                ...state.notifications,
                            ],
                        }));
                    }

                    // Show browser/desktop notification
                    if (
                        "Notification" in window &&
                        Notification.permission === "granted"
                    ) {
                        const show = (reg?: ServiceWorkerRegistration) => {
                            try {
                                const body =
                                    text.length > 160
                                        ? text.substring(0, 160) + "..."
                                        : text;
                                if (reg) {
                                    reg.showNotification(
                                        "🌅 Your Daily AI Briefing",
                                        {
                                            body,
                                            icon: "/icons/icon-192x192.png",
                                            badge: "/icons/icon-192x192.png",
                                            tag: notifId,
                                            data: { url: "/dashboard" },
                                        } as NotificationOptions,
                                    );
                                } else {
                                    new Notification(
                                        "🌅 Your Daily AI Briefing",
                                        {
                                            body,
                                            icon: "/icons/icon-192x192.png",
                                            tag: notifId,
                                        },
                                    );
                                }
                            } catch {}
                        };
                        if ("serviceWorker" in navigator) {
                            navigator.serviceWorker.ready
                                .then(show)
                                .catch(() => show());
                        } else {
                            show();
                        }
                    }
                }
            }
        } catch {
            setBriefing(
                "Couldn't load your briefing. Tap refresh to try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate once per day
    useEffect(() => {
        if (generatedRef.current) return;
        if (!user?.salary) return; // wait until data is loaded
        generatedRef.current = true;

        let stored: StoredBriefing | null = null;
        try {
            stored = JSON.parse(localStorage.getItem(BRIEFING_KEY) || "null");
        } catch {}

        if (stored && stored.date === today) {
            // Already have today's briefing — just show it
            setBriefing(stored.text);
        } else {
            // New day — generate fresh and notify
            generate(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.salary]);

    const renderText = (text: string) => {
        return text.split("\n").map((line, i) => {
            const t = line.trim();
            if (!t) return null;
            if (t.startsWith("*") || t.startsWith("-")) {
                return (
                    <div key={i} className="flex gap-2">
                        <span className="text-indigo-500">•</span>
                        <span>{formatBold(t.replace(/^[*-]\s*/, ""))}</span>
                    </div>
                );
            }
            return <p key={i}>{formatBold(t)}</p>;
        });
    };
    const formatBold = (text: string) => {
        return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
            p.startsWith("**") && p.endsWith("**") ? (
                <strong key={i} className="font-semibold text-foreground">
                    {p.slice(2, -2)}
                </strong>
            ) : (
                <span key={i}>{p}</span>
            ),
        );
    };

    return (
        <Card className="glassmorphism border-violet-500/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -mt-10 -mr-10" />
            <CardHeader className="relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-500">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base">
                                Today's AI Briefing
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                                Auto-generated daily by your AI coach
                            </CardDescription>
                        </div>
                    </div>
                    {briefing && !loading && (
                        <Button
                            onClick={() => generate(false)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-violet-600"
                            title="Refresh"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="relative">
                {loading ? (
                    <div className="flex items-center gap-3 py-4">
                        <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />
                        <p className="text-xs text-muted-foreground">
                            Preparing your briefing...
                        </p>
                    </div>
                ) : briefing ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-muted-foreground leading-relaxed space-y-1"
                    >
                        {renderText(briefing)}
                    </motion.div>
                ) : (
                    <Button
                        onClick={() => generate(true)}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                    >
                        <Brain className="mr-2 h-4 w-4" /> Generate Today's
                        Briefing
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

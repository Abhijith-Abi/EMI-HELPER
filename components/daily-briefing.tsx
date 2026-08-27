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
import { Brain, Loader2, RefreshCw, Sparkles, Languages } from "lucide-react";
import { motion } from "framer-motion";

const BRIEFING_KEY = "ai-daily-briefing";

interface StoredBriefing {
    date: string;
    lang: string;
    text: string;
}

export function DailyBriefing() {
    const { user, emis, expenses, goals } = useStore();
    const [briefing, setBriefing] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<"malayalam" | "english">("malayalam");
    const generatedRef = useRef(false);

    const today = new Date().toISOString().split("T")[0];

    const generate = async (langToUse?: "malayalam" | "english", showNotification = false) => {
        const lang = langToUse || language;
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
                                lang === "malayalam"
                                    ? "ഇന്നത്തെ സാമ്പത്തിക വിവരങ്ങളുടെ ഒരു ലഘു വിവരണം (Daily Briefing) തരൂ. 1) ഇന്നത്തെ കടം, സാലറി സ്ഥിതി, 2) ഇന്ന് ശ്രദ്ധിക്കേണ്ട പ്രധാന കാര്യം, 3) ദിവസേനയുള്ള സുരക്ഷിതമായ ചെലവ് പരിധി."
                                    : "Give me a short daily financial briefing (under 80 words). Include: 1) Summary of my debt status and cash flow today, 2) The single most important financial action to focus on, 3) Daily spending limit or upcoming EMI due. Be concise, direct and motivating. Start directly with the briefing.",
                        },
                    ],
                    context: {
                        salary: user?.salary || 0,
                        emis,
                        expenses,
                        goals,
                    },
                    language: lang,
                }),
            });
            const data = await res.json();
            const text = data.reply || "";
            if (text) {
                setBriefing(text);
                localStorage.setItem(
                    BRIEFING_KEY,
                    JSON.stringify({ date: today, lang, text }),
                );

                if (showNotification) {
                    const notifId = `briefing-${today}`;
                    const existing = useStore.getState().notifications;
                    if (!existing.some((n) => n.id === notifId)) {
                        useStore.setState((state) => ({
                            notifications: [
                                {
                                    id: notifId,
                                    title: lang === "malayalam" ? "🌅 ഇന്നത്തെ AI സാമ്പത്തിക വിവരണം" : "🌅 Your Daily AI Briefing",
                                    body: text.length > 140 ? text.substring(0, 140) + "..." : text,
                                    date: today,
                                    read: false,
                                },
                                ...state.notifications,
                            ],
                        }));
                    }
                }
            }
        } catch {
            setBriefing(
                lang === "malayalam"
                    ? "വിവരണം ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക."
                    : "Couldn't load your briefing. Click refresh to try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (generatedRef.current) return;
        if (!user?.salary) return;
        generatedRef.current = true;

        let stored: StoredBriefing | null = null;
        try {
            stored = JSON.parse(localStorage.getItem(BRIEFING_KEY) || "null");
        } catch {}

        if (stored && stored.date === today) {
            setBriefing(stored.text);
            if (stored.lang === "english" || stored.lang === "malayalam") {
                setLanguage(stored.lang);
            }
        } else {
            generate("malayalam", true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.salary]);

    const handleSwitchLanguage = (newLang: "malayalam" | "english") => {
        setLanguage(newLang);
        generate(newLang, false);
    };

    const renderText = (text: string) => {
        return text.split("\n").map((line, i) => {
            const t = line.trim();
            if (!t) return null;
            if (t.startsWith("*") || t.startsWith("-") || t.startsWith("•")) {
                return (
                    <div key={i} className="flex gap-2 text-slate-200">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{formatBold(t.replace(/^[*-•]\s*/, ""))}</span>
                    </div>
                );
            }
            return <p key={i} className="text-slate-200 leading-relaxed">{formatBold(t)}</p>;
        });
    };

    const formatBold = (text: string) => {
        return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
            p.startsWith("**") && p.endsWith("**") ? (
                <strong key={i} className="font-semibold text-white">
                    {p.slice(2, -2)}
                </strong>
            ) : (
                <span key={i}>{p}</span>
            ),
        );
    };

    return (
        <Card className="glassmorphism border-indigo-500/30 overflow-hidden relative shadow-lg shadow-indigo-500/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mt-16 -mr-16 pointer-events-none" />
            <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/30">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold text-white">
                                {language === "malayalam" ? "AI പ്രഭാത സാമ്പത്തിക വിവരണം" : "AI Morning Executive Briefing"}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                {language === "malayalam"
                                    ? "നിങ്ങളുടെ യഥാർത്ഥ വരുമാനവും ലോണുകളും അടിസ്ഥാനമാക്കിയുള്ള വിവരണം"
                                    : "Auto-generated daily analysis based on your real numbers"}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Language Toggle */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/[0.08]">
                            <button
                                onClick={() => handleSwitchLanguage("malayalam")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    language === "malayalam"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                മലയാളം
                            </button>
                            <button
                                onClick={() => handleSwitchLanguage("english")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    language === "english"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                English
                            </button>
                        </div>

                        {briefing && !loading && (
                            <Button
                                onClick={() => generate(language, false)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-indigo-400 hover:text-white hover:bg-white/[0.06] rounded-xl"
                                title="Regenerate today's briefing"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
                {loading ? (
                    <div className="flex items-center gap-3 py-3">
                        <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                        <p className="text-xs text-slate-400">
                            {language === "malayalam"
                                ? "ഇന്നത്തെ വിവരണം തയ്യാറാക്കുന്നു..."
                                : "Synthesizing today's financial briefing..."}
                        </p>
                    </div>
                ) : briefing ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-slate-300 leading-relaxed space-y-1.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 p-3.5"
                    >
                        {renderText(briefing)}
                    </motion.div>
                ) : (
                    <Button
                        onClick={() => generate("malayalam", true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold h-10 shadow-md rounded-xl"
                    >
                        <Brain className="mr-2 h-4 w-4" /> {language === "malayalam" ? "വിവരണം കാണുക" : "Generate Morning Briefing"}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

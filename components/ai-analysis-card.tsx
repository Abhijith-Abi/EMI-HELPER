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
import { Sparkles, Loader2, RefreshCw, Brain } from "lucide-react";
import { motion } from "framer-motion";

interface AIAnalysisCardProps {
    title: string;
    description: string;
    prompt: string;
    buttonLabel?: string;
    cacheKey?: string; // unique key for daily caching
    autoGenerate?: boolean; // auto-generate once per day
}

export function AIAnalysisCard({
    title,
    description,
    prompt,
    buttonLabel = "Generate AI Analysis",
    cacheKey,
    autoGenerate = false,
}: AIAnalysisCardProps) {
    const { user, emis, expenses, goals } = useStore();
    const [result, setResult] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<"english" | "malayalam">("malayalam");
    const autoRef = useRef(false);
    const today = new Date().toISOString().split("T")[0];
    const storageKey = cacheKey ? `ai-card-${cacheKey}` : null;

    const generate = async (lang?: "english" | "malayalam") => {
        const useLang = lang || language;
        setLoading(true);
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: prompt }],
                    context: {
                        salary: user?.salary || 0,
                        emis,
                        expenses,
                        goals,
                    },
                    language: useLang,
                }),
            });
            const data = await res.json();
            const text = data.reply || "Couldn't generate analysis. Please try again.";
            setResult(text);
            if (storageKey) {
                localStorage.setItem(
                    storageKey,
                    JSON.stringify({ date: today, lang: useLang, text }),
                );
            }
        } catch {
            setResult("Connection error. Please check your internet and try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoRef.current || !storageKey) return;
        autoRef.current = true;

        let cached: { date: string; lang: string; text: string } | null = null;
        try {
            cached = JSON.parse(localStorage.getItem(storageKey) || "null");
        } catch {}

        if (cached && cached.date === today) {
            setResult(cached.text);
            if (cached.lang === "english" || cached.lang === "malayalam") {
                setLanguage(cached.lang);
            }
        } else if (autoGenerate && user?.salary) {
            generate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.salary]);

    const switchLanguage = (lang: "english" | "malayalam") => {
        setLanguage(lang);
        if (result) generate(lang);
    };

    const renderText = (text: string) => {
        return text.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-2" />;
            if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                return (
                    <div key={i} className="flex gap-2 items-start">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span className="flex-1 text-slate-200">
                            {formatBold(trimmed.replace(/^[*-]\s/, ""))}
                        </span>
                    </div>
                );
            }
            if (/^\d+\.\s/.test(trimmed)) {
                return (
                    <div key={i} className="flex gap-2 items-start">
                        <span className="flex-1 text-slate-200">{formatBold(trimmed)}</span>
                    </div>
                );
            }
            if (trimmed.startsWith("#")) {
                return (
                    <h4 key={i} className="font-bold text-sm text-white mt-2">
                        {trimmed.replace(/^#+\s/, "")}
                    </h4>
                );
            }
            return <p key={i} className="text-slate-300 leading-relaxed">{formatBold(trimmed)}</p>;
        });
    };

    const formatBold = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? (
                <strong key={i} className="font-semibold text-white">
                    {part.slice(2, -2)}
                </strong>
            ) : (
                <span key={i}>{part}</span>
            ),
        );
    };

    return (
        <Card className="glassmorphism border-violet-500/20">
            <CardHeader className="p-5 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
                        <Brain className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-base font-bold text-white">{title}</CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-400">{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
                {/* Language Toggle */}
                <div className="flex items-center gap-1 mb-3.5 p-1 rounded-xl bg-slate-900/80 border border-white/[0.08] w-fit">
                    <button
                        onClick={() => switchLanguage("english")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            language === "english"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => switchLanguage("malayalam")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            language === "malayalam"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        മലയാളം
                    </button>
                </div>

                {!result && !loading && (
                    <Button
                        onClick={() => generate()}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold h-9 shadow-md shadow-violet-600/20"
                    >
                        <Sparkles className="mr-2 h-4 w-4" /> {buttonLabel}
                    </Button>
                )}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
                        <p className="text-xs text-slate-400">
                            {language === "malayalam"
                                ? "AI നിങ്ങളുടെ സാമ്പത്തിക വിവരങ്ങൾ വിശകലനം ചെയ്യുന്നു..."
                                : "AI is analyzing your finances..."}
                        </p>
                    </div>
                )}
                {result && !loading && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="text-xs leading-relaxed space-y-1.5 rounded-xl bg-violet-950/20 border border-violet-500/20 p-4">
                            {renderText(result)}
                        </div>
                        <Button
                            onClick={() => generate()}
                            variant="ghost"
                            size="sm"
                            className="mt-3 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs font-semibold"
                        >
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />{" "}
                            {language === "malayalam" ? "വീണ്ടും സൃഷ്ടിക്കുക" : "Regenerate Analysis"}
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}

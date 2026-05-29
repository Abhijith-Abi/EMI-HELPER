"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Send,
    X,
    Bot,
    User as UserIcon,
    Loader2,
} from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTED_EN = [
    "How can I become debt-free faster?",
    "Where am I wasting money?",
    "Which loan should I pay off first?",
    "How much should I save each month?",
];

const SUGGESTED_ML = [
    "എങ്ങനെ വേഗം കടം തീർക്കാം?",
    "എവിടെയാണ് പണം പാഴാക്കുന്നത്?",
    "ഏത് ലോൺ ആദ്യം അടച്ചുതീർക്കണം?",
    "എത്ര രൂപ മാസം സേവ് ചെയ്യണം?",
];

export function AIAssistant() {
    const { user, emis, expenses, goals } = useStore();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<"english" | "malayalam">(
        "malayalam",
    );
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, loading]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;
        const newMessages: Message[] = [
            ...messages,
            { role: "user", content: text },
        ];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages,
                    context: {
                        salary: user?.salary || 0,
                        emis,
                        expenses,
                        goals,
                    },
                    language,
                }),
            });
            const data = await res.json();
            if (data.reply) {
                setMessages([
                    ...newMessages,
                    { role: "assistant", content: data.reply },
                ]);
            } else {
                setMessages([
                    ...newMessages,
                    {
                        role: "assistant",
                        content:
                            "Sorry, I couldn't process that. Please try again.",
                    },
                ]);
            }
        } catch {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content:
                        "Connection error. Please check your internet and try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white"
                aria-label="Open AI Assistant"
            >
                <Sparkles className="h-6 w-6" />
            </motion.button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.96 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="fixed z-50 bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-[85vh] sm:h-[600px] bg-white/95 backdrop-blur-2xl border border-indigo-100 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-indigo-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <div className="flex items-center gap-2">
                                    <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">
                                            AI Financial Coach
                                        </h3>
                                        <p className="text-[11px] text-white/80">
                                            Powered by your real data
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            setLanguage((l) =>
                                                l === "english"
                                                    ? "malayalam"
                                                    : "english",
                                            )
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-semibold transition-colors"
                                        title="Switch language"
                                    >
                                        {language === "english" ? "EN" : "ML"}
                                    </button>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4"
                            >
                                {messages.length === 0 && (
                                    <div className="text-center py-6">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-3">
                                            <Sparkles className="h-7 w-7 text-white" />
                                        </div>
                                        <h4 className="font-bold text-sm">
                                            {language === "malayalam"
                                                ? "ഹായ്"
                                                : "Hi"}{" "}
                                            {user?.name?.split(" ")[0] ||
                                                "there"}
                                            ! 👋
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1 mb-4 px-4">
                                            {language === "malayalam"
                                                ? "ഞാൻ നിങ്ങളുടെ സാമ്പത്തിക വിവരങ്ങൾ പരിശോധിച്ചു. കടം, സമ്പാദ്യം, ചെലവ് എന്നിവയെക്കുറിച്ച് എന്തും ചോദിക്കൂ."
                                                : "I've analyzed your finances. Ask me anything about your debt, savings, or spending."}
                                        </p>
                                        <div className="space-y-2">
                                            {(language === "malayalam"
                                                ? SUGGESTED_ML
                                                : SUGGESTED_EN
                                            ).map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() =>
                                                        sendMessage(q)
                                                    }
                                                    className="block w-full text-left text-xs px-3 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors text-indigo-700"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                                    >
                                        <div
                                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"}`}
                                        >
                                            {m.role === "user" ? (
                                                <UserIcon className="h-3.5 w-3.5" />
                                            ) : (
                                                <Bot className="h-3.5 w-3.5" />
                                            )}
                                        </div>
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-muted text-foreground"}`}
                                        >
                                            {m.content}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-2">
                                        <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                            <Bot className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-1">
                                            <span
                                                className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"
                                                style={{
                                                    animationDelay: "0ms",
                                                }}
                                            />
                                            <span
                                                className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"
                                                style={{
                                                    animationDelay: "150ms",
                                                }}
                                            />
                                            <span
                                                className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"
                                                style={{
                                                    animationDelay: "300ms",
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-indigo-100 bg-white/80">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        sendMessage(input);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        value={input}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                        placeholder={
                                            language === "malayalam"
                                                ? "നിങ്ങളുടെ പണത്തെക്കുറിച്ച് ചോദിക്കൂ..."
                                                : "Ask about your finances..."
                                        }
                                        className="flex-1 h-11 px-4 rounded-xl border border-indigo-100 bg-white text-sm outline-none focus:border-indigo-300 transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !input.trim()}
                                        className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

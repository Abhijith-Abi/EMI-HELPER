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
import { Button } from "@/components/ui/button";

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
    const [language, setLanguage] = useState<"english" | "malayalam">("malayalam");
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
                        content: "Sorry, I couldn't process that. Please try again.",
                    },
                ]);
            }
        } catch {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: "Connection error. Please check your internet and try again.",
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
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 shadow-xl shadow-indigo-600/40 flex items-center justify-center text-white border border-indigo-400/30 cursor-pointer"
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
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.96 }}
                            transition={{ type: "spring", duration: 0.35 }}
                            className="fixed z-50 bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-[85vh] sm:h-[600px] bg-[#0c101d]/95 backdrop-blur-2xl border border-white/[0.1] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-transparent">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white">AI Financial Coach</h3>
                                        <p className="text-[11px] text-slate-400">Powered by your live ledger data</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setLanguage((l) => (l === "english" ? "malayalam" : "english"))}
                                        className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-[11px] font-semibold text-slate-200 transition-colors cursor-pointer border border-white/[0.08]"
                                        title="Switch language"
                                    >
                                        {language === "english" ? "English" : "മലയാളം"}
                                    </button>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center py-6">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-300">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <h4 className="font-bold text-sm text-white">
                                            {language === "malayalam" ? "ഹായ്" : "Hi"} {user?.name?.split(" ")[0] || "there"}! 👋
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-1 mb-4 px-4 leading-relaxed">
                                            {language === "malayalam"
                                                ? "ഞാൻ നിങ്ങളുടെ സാമ്പത്തിക വിവരങ്ങൾ പരിശോധിച്ചു. കടം, സമ്പാദ്യം, ചെലവ് എന്നിവയെക്കുറിച്ച് എന്തും ചോദിക്കൂ."
                                                : "I've analyzed your cash flow and active loans. Ask me anything about repayment strategies, cutting expenses, or savings goals."}
                                        </p>
                                        <div className="space-y-2">
                                            {(language === "malayalam" ? SUGGESTED_ML : SUGGESTED_EN).map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => sendMessage(q)}
                                                    className="block w-full text-left text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-slate-300 hover:text-white cursor-pointer"
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
                                        className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                                    >
                                        <div
                                            className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                                                m.role === "user"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-slate-800 text-indigo-400 border border-white/[0.08]"
                                            }`}
                                        >
                                            {m.role === "user" ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                        </div>
                                        <div
                                            className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                                                m.role === "user"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-slate-900 border border-white/[0.08] text-slate-200 shadow-sm"
                                            }`}
                                        >
                                            {m.content}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-2.5">
                                        <div className="h-7 w-7 rounded-xl bg-slate-800 text-indigo-400 border border-white/[0.08] flex items-center justify-center shrink-0">
                                            <Bot className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="bg-slate-900 border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Form */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage(input);
                                }}
                                className="p-3 border-t border-white/[0.08] bg-[#0a0e19] flex gap-2 items-center"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={language === "malayalam" ? "ചോദ്യം ചോദിക്കൂ..." : "Ask your financial coach..."}
                                    className="flex-1 h-10 px-3.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50"
                                    disabled={loading}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || loading}
                                    className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

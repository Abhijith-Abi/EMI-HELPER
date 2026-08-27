"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Wallet,
    CreditCard,
    PiggyBank,
    TrendingUp,
    AlertCircle,
    Calendar,
    Clock,
    CheckCircle2,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    Check,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { toast } from "sonner";
import {
    requestNotificationPermissionAndRegisterToken,
    triggerLocalDueNotifications,
} from "@/lib/firebase/messaging";
import { DailyBriefing } from "@/components/daily-briefing";
import Link from "next/link";

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const { user, emis, expenses, goals, payEmiInstallment, undoEmiPayment, payAllDueEmis } =
        useStore();

    useEffect(() => {
        setMounted(true);
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        setSelectedMonth(currentMonthStr);
    }, []);

    const getDaysRemaining = (dueDateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateStr);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Register FCM Push token
    useEffect(() => {
        if (mounted && user?.id) {
            requestNotificationPermissionAndRegisterToken(user.id);
        }
    }, [mounted, user?.id]);

    // Local notifications & alerts
    useEffect(() => {
        if (!mounted || emis.length === 0) return;

        triggerLocalDueNotifications(emis);

        const { notifications, dismissedNotifications } = useStore.getState();

        emis.forEach((emi) => {
            if (emi.status !== "Active" || emi.remaining_months <= 0) return;
            const days = getDaysRemaining(emi.due_date);
            if (days >= 0 && days <= 3) {
                const notifId = `emi-due-${emi.id}-${emi.due_date}`;
                const alreadyExists = notifications.some((n) => n.id === notifId);
                const wasDismissed = dismissedNotifications.includes(notifId);
                if (!alreadyExists && !wasDismissed) {
                    useStore.setState((state) => ({
                        notifications: [
                            {
                                id: notifId,
                                title: `EMI Due Soon: ${emi.title}`,
                                body: `₹${emi.emi_amount.toLocaleString()} is due on ${emi.due_date} (${days === 0 ? "today" : `in ${days} day${days > 1 ? "s" : ""}`})`,
                                date: new Date().toISOString().split("T")[0],
                                read: false,
                            },
                            ...state.notifications,
                        ],
                    }));
                }
            }
        });
    }, [mounted, emis]);

    // Financial calculations
    const activeEmis = useMemo(
        () => emis.filter((e) => e.status === "Active" && e.remaining_months > 0),
        [emis],
    );
    const totalActiveEMI = useMemo(
        () => activeEmis.reduce((sum, emi) => sum + emi.emi_amount, 0),
        [activeEmis],
    );

    const currentMonthExpenses = useMemo(() => {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        return expenses.filter((e) => e.date.startsWith(monthKey));
    }, [expenses]);

    const totalMonthSpend = useMemo(
        () => currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        [currentMonthExpenses],
    );

    const salary = user?.salary || 0;
    const availableBalance = salary - totalActiveEMI - totalMonthSpend;
    const emiRatio = salary > 0 ? Math.round((totalActiveEMI / salary) * 100) : 0;
    const healthScore = Math.min(
        100,
        Math.max(
            0,
            Math.round(
                (availableBalance / (salary || 1)) * 50 +
                    (100 - emiRatio) * 0.3 +
                    (goals.length > 0 ? 20 : 10),
            ),
        ),
    );

    // Filter EMIs by selected month
    const emiMonths = useMemo(() => {
        const set = new Set(emis.map((e) => e.due_date.substring(0, 7)));
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        set.add(currentMonthStr);
        return Array.from(set).sort();
    }, [emis]);

    const formatMonthName = (monthStr: string) => {
        if (!monthStr) return "";
        const [year, month] = monthStr.split("-");
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        return date.toLocaleString("default", { month: "long", year: "numeric" });
    };

    const filteredEMIs = useMemo(
        () => emis.filter((e) => e.due_date.startsWith(selectedMonth)),
        [emis, selectedMonth],
    );

    // Chart datasets
    const expenseCategoryData = useMemo(() => {
        const categoryMap: Record<string, number> = {};
        expenses.forEach((e) => {
            categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
        });
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    const cashFlowBarData = useMemo(
        () => [
            { name: "Salary", amount: salary, fill: "#6366f1" },
            { name: "Active EMIs", amount: totalActiveEMI, fill: "#f43f5e" },
            { name: "Expenses", amount: totalMonthSpend, fill: "#f59e0b" },
            {
                name: "Net Cash",
                amount: Math.max(0, availableBalance),
                fill: availableBalance >= 0 ? "#10b981" : "#f43f5e",
            },
        ],
        [salary, totalActiveEMI, totalMonthSpend, availableBalance],
    );

    const handlePayEmi = (emi: (typeof emis)[0]) => {
        payEmiInstallment(emi.id, true);
        toast.success(`Recorded installment for "${emi.title}". Ledger updated.`);
    };

    const handleBatchPay = () => {
        const count = payAllDueEmis(true);
        if (count > 0) {
            toast.success(`Paid ${count} due EMI installment${count > 1 ? "s" : ""}!`);
        } else {
            toast.info("No active EMIs are due right now.");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
        },
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        show: { y: 0, opacity: 1 },
    };

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <span>Welcome back, {user?.name ? user.name.split(" ")[0] : "Financier"}!</span>
                        <span className="text-xl">👋</span>
                    </h2>
                    <p className="text-sm text-slate-400">
                        Here is your real-time cash flow & debt recovery cockpit.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleBatchPay}
                        variant="outline"
                        size="sm"
                        className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold h-8"
                    >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                        1-Click Pay Due EMIs
                    </Button>
                    <Link href="/dashboard/emis">
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold h-8 shadow-md shadow-indigo-600/20"
                        >
                            Manage EMIs
                        </Button>
                    </Link>
                </div>
            </div>

            {/* High EMI Warning Alert */}
            {emiRatio > 50 && (
                <Alert className="glassmorphism border-rose-500/30 bg-rose-500/10 text-rose-300">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                    <AlertTitle className="text-rose-400 font-bold text-sm">
                        High Debt Pressure Warning ({emiRatio}% of salary)
                    </AlertTitle>
                    <AlertDescription className="text-xs text-rose-300/90 mt-1">
                        Active EMIs total ₹{totalActiveEMI.toLocaleString()}, exceeding safe financial limits
                        (recommended &lt; 35%). Use the AI Recovery Engine to explore the Avalanche paydown strategy.
                    </AlertDescription>
                </Alert>
            )}

            {/* AI Daily Briefing */}
            <motion.div variants={itemVariants}>
                <DailyBriefing />
            </motion.div>

            {/* Hero Stat Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <motion.div variants={itemVariants}>
                    <Card className="glassmorphism hover:border-indigo-500/30 transition-all p-5 h-full">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Monthly Salary</span>
                            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 text-2xl font-bold text-white font-mono">
                            ₹{salary.toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                            <span>Primary net earnings</span>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glassmorphism hover:border-rose-500/30 transition-all p-5 h-full">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Active Monthly EMI</span>
                            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
                                <CreditCard className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 text-2xl font-bold text-rose-400 font-mono">
                            ₹{totalActiveEMI.toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{activeEmis.length} active loan{activeEmis.length === 1 ? "" : "s"}</span>
                            <span className="text-rose-400 font-semibold">{emiRatio}% of salary</span>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glassmorphism hover:border-emerald-500/30 transition-all p-5 h-full">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Available Cash</span>
                            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                <PiggyBank className="h-4 w-4" />
                            </div>
                        </div>
                        <div
                            className={`mt-3 text-2xl font-bold font-mono ${
                                availableBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                        >
                            ₹{availableBalance.toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                            <span>After EMIs & month spend</span>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="glassmorphism hover:border-violet-500/30 transition-all p-5 h-full">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Financial Health</span>
                            <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/20">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <div
                            className={`mt-3 text-2xl font-bold font-mono ${
                                healthScore >= 70
                                    ? "text-emerald-400"
                                    : healthScore >= 45
                                      ? "text-amber-400"
                                      : "text-rose-400"
                            }`}
                        >
                            {healthScore}/100
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">
                                {healthScore >= 70
                                    ? "Solid Health"
                                    : healthScore >= 45
                                      ? "Moderate"
                                      : "Action Needed"}
                            </span>
                            <span className="text-violet-400 font-medium">AI Score</span>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Monthly EMI Due Schedule Card */}
            <motion.div variants={itemVariants}>
                <Card className="glassmorphism border-white/[0.08] overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b border-white/[0.06]">
                        <div>
                            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-400" />
                                Monthly EMI Schedules & Due Dates
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Real-time installment tracker. Paying will advance due date and decrease remaining months.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Billing Month:</span>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-white outline-none cursor-pointer hover:border-indigo-500/50 transition-all"
                            >
                                {emiMonths.map((m) => (
                                    <option key={m} value={m} className="bg-slate-900 text-white">
                                        {formatMonthName(m)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        {filteredEMIs.length > 0 ? (
                            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredEMIs.map((emi) => {
                                    const daysRemaining = getDaysRemaining(emi.due_date);
                                    const isPaid = emi.status === "Paid" || emi.remaining_months === 0;
                                    const isOverdue = !isPaid && daysRemaining < 0;
                                    const isDueSoon = !isPaid && daysRemaining >= 0 && daysRemaining <= 5;

                                    return (
                                        <div
                                            key={emi.id}
                                            className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                                                isPaid
                                                    ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                                                    : isOverdue
                                                      ? "border-rose-500/30 bg-rose-500/[0.06] shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)]"
                                                      : isDueSoon
                                                        ? "border-amber-500/30 bg-amber-500/[0.06] shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]"
                                                        : "border-white/[0.08] bg-white/[0.02]"
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-white">{emi.title}</h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            Due: <span className="font-mono text-slate-300">{emi.due_date}</span>
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                            isPaid
                                                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                                : isOverdue
                                                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                                                  : isDueSoon
                                                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                                                    : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                                        }`}
                                                    >
                                                        {isPaid ? "Paid" : isOverdue ? `${Math.abs(daysRemaining)}d Overdue` : `${daysRemaining}d Left`}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                                                    <span>Tenure Remaining:</span>
                                                    <span className="font-mono font-semibold text-slate-200">
                                                        {emi.remaining_months} / {emi.total_months} months
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                                                        EMI Amount
                                                    </span>
                                                    <span className="text-base font-bold text-white font-mono">
                                                        ₹{emi.emi_amount.toLocaleString()}
                                                    </span>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => (isPaid ? undoEmiPayment(emi.id) : handlePayEmi(emi))}
                                                    className={`h-8 text-xs font-semibold rounded-lg transition-all ${
                                                        isPaid
                                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                                            : "border-indigo-500/30 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 hover:text-white"
                                                    }`}
                                                >
                                                    {isPaid ? (
                                                        <>
                                                            <Check className="h-3.5 w-3.5 mr-1" /> Paid (Undo)
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Pay Installment
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-500 text-sm">
                                No scheduled EMIs for this billing period.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Visual Analytics Charts Grid */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Cash Flow Distribution Bar Chart */}
                <motion.div variants={itemVariants}>
                    <Card className="glassmorphism border-white/[0.08] p-5 h-full">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-base font-bold text-white">
                                Cash Flow Architecture
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Monthly comparison of earnings vs active debt liability
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 h-[260px]">
                            {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashFlowBarData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#0f172a",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "12px",
                                                color: "#ffffff",
                                            }}
                                            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Amount"]}
                                        />
                                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                            {cashFlowBarData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Expense Categories Breakdown Pie Chart */}
                <motion.div variants={itemVariants}>
                    <Card className="glassmorphism border-white/[0.08] p-5 h-full">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-base font-bold text-white">
                                Spending Breakdown
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Category-wise expense allocations
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 h-[260px]">
                            {mounted && expenseCategoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseCategoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {expenseCategoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#0f172a",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "12px",
                                                color: "#ffffff",
                                            }}
                                            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Spent"]}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                                    No expense records logged yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

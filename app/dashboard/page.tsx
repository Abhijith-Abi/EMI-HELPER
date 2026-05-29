"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Wallet,
    CreditCard,
    PiggyBank,
    Target,
    TrendingUp,
    AlertCircle,
    Calendar,
    Clock,
    CheckCircle2,
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

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const { user, emis, expenses, goals, toggleEmiStatus } = useStore();

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

    // Register FCM Push token exactly once when the user is logged in
    useEffect(() => {
        if (mounted && user?.id) {
            requestNotificationPermissionAndRegisterToken(user.id);
        }
    }, [mounted, user?.id]);

    // Scan and trigger local reminders when EMIs state changes
    useEffect(() => {
        if (!mounted || emis.length === 0) return;

        // Scan and trigger desktop notifications for EMIs due within 3 days
        triggerLocalDueNotifications(emis);

        const { addNotification, notifications } = useStore.getState();

        // Add in-app notifications for EMIs due within 3 days
        emis.forEach((emi) => {
            if (emi.status !== "Active") return;
            const days = getDaysRemaining(emi.due_date);
            if (days >= 0 && days <= 3) {
                const notifId = `emi-due-${emi.id}-${emi.due_date}`;
                const alreadyExists = notifications.some(
                    (n) => n.id === notifId,
                );
                if (!alreadyExists) {
                    // Use store's set directly to avoid infinite loop
                    useStore.setState((state) => ({
                        notifications: [
                            {
                                id: notifId,
                                title: `EMI Due: ${emi.title}`,
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

        const overdueCount = emis.filter(
            (e) => e.status === "Active" && getDaysRemaining(e.due_date) < 0,
        ).length;
        const dueSoonCount = emis.filter(
            (e) =>
                e.status === "Active" &&
                getDaysRemaining(e.due_date) >= 0 &&
                getDaysRemaining(e.due_date) <= 5,
        ).length;

        if (overdueCount > 0) {
            toast.error(
                `Warning: You have ${overdueCount} overdue EMI${overdueCount > 1 ? "s" : ""}! Please pay them immediately.`,
                {
                    id: "overdue-alert",
                    duration: 8000,
                },
            );
        }
        if (dueSoonCount > 0) {
            toast.warning(
                `Notice: ${dueSoonCount} EMI${dueSoonCount > 1 ? "s are" : " is"} due within the next 5 days.`,
                {
                    id: "due-soon-alert",
                    duration: 6000,
                },
            );
        }
    }, [mounted, emis]);

    const totalEMI = emis.reduce((sum, emi) => sum + emi.emi_amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const balance = (user?.salary || 0) - totalEMI - totalExpenses;
    const healthScore = Math.min(
        100,
        Math.max(0, Math.round((balance / (user?.salary || 1)) * 100)),
    );

    const emiMonths = Array.from(
        new Set(emis.map((e) => e.due_date.substring(0, 7))),
    ).sort();
    const nowStr = new Date();
    const currentMonthStr = `${nowStr.getFullYear()}-${String(nowStr.getMonth() + 1).padStart(2, "0")}`;
    if (!emiMonths.includes(currentMonthStr)) {
        emiMonths.push(currentMonthStr);
        emiMonths.sort();
    }

    const formatMonthName = (monthStr: string) => {
        if (!monthStr) return "";
        const [year, month] = monthStr.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });
    };

    const filteredEMIs = emis.filter((e) =>
        e.due_date.startsWith(selectedMonth),
    );

    // Mock data for charts
    const expenseData = expenses.reduce((acc: any, exp) => {
        const existing = acc.find((a: any) => a.name === exp.category);
        if (existing) {
            existing.value += exp.amount;
        } else {
            acc.push({ name: exp.category, value: exp.amount });
        }
        return acc;
    }, []);

    const emiData = emis.map((emi) => ({
        name: emi.title,
        amount: emi.emi_amount,
    }));

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
    };

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Welcome back,{" "}
                        {user?.name ? user.name.split(" ")[0] : "User"}!
                    </h2>
                    <p className="text-muted-foreground">
                        Here's your financial overview for this month.
                    </p>
                </div>
            </div>

            {totalEMI > (user?.salary || 0) * 0.5 && (
                <Alert
                    variant="destructive"
                    className="glassmorphism border-l-4 border-l-red-500 bg-red-950/20 text-red-200"
                >
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertTitle className="text-red-400 font-semibold">
                        High EMI Burden Warning
                    </AlertTitle>
                    <AlertDescription className="text-red-200/90 text-xs">
                        Your total EMI (₹{totalEMI.toLocaleString()}) exceeds
                        50% of your monthly salary (₹
                        {(user?.salary || 0).toLocaleString()}). Avoid taking
                        new loans to maintain financial stability.
                    </AlertDescription>
                </Alert>
            )}

            {/* Daily AI Briefing — auto-generates once per day */}
            <motion.div variants={itemVariants}>
                <DailyBriefing />
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <motion.div variants={itemVariants} className="h-full">
                    <Card className="glassmorphism hover:scale-[1.02] transition-all duration-300 py-6 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Monthly Salary
                            </CardTitle>
                            <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-400">
                                <Wallet className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                                ₹{(user?.salary || 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Net monthly income
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="h-full">
                    <Card className="glassmorphism hover:scale-[1.02] transition-all duration-300 py-6 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total EMI Sum
                            </CardTitle>
                            <div className="p-2.5 rounded-lg bg-red-500/15 text-red-400">
                                <CreditCard className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-400">
                                ₹{totalEMI.toLocaleString()}
                            </div>
                            <p className="text-xs text-red-400 mt-1 font-semibold">
                                {Math.round(
                                    (totalEMI / (user?.salary || 1)) * 100,
                                )}
                                % of salary
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="h-full">
                    <Card className="glassmorphism hover:scale-[1.02] transition-all duration-300 py-6 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Available Balance
                            </CardTitle>
                            <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                                <PiggyBank className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${balance >= 0 ? "from-emerald-400 to-teal-400" : "from-red-400 to-rose-400"}`}
                            >
                                ₹{balance.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                After EMIs & Expenses
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="h-full">
                    <Card className="glassmorphism hover:scale-[1.02] transition-all duration-300 py-6 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Health Score
                            </CardTitle>
                            <div className="p-2.5 rounded-lg bg-violet-500/15 text-violet-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${healthScore > 50 ? "from-emerald-400 to-teal-400" : healthScore > 25 ? "from-amber-400 to-orange-400" : "from-red-400 to-rose-400"}`}
                            >
                                {healthScore}/100
                            </div>
                            <p
                                className={`text-xs mt-1 font-semibold ${healthScore > 50 ? "text-emerald-400" : healthScore > 25 ? "text-amber-400" : "text-red-400"}`}
                            >
                                {healthScore > 50
                                    ? "Looking good!"
                                    : healthScore > 25
                                      ? "Needs attention"
                                      : "Critical state"}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Monthly EMI Due Reminders & Alerts */}
            <motion.div variants={itemVariants} className="mt-6">
                <Card className="glassmorphism">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight">
                                EMI Due Reminders & Notifications
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Month-wise active schedules and payment status
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                Select Month:
                            </span>
                            <select
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(e.target.value)
                                }
                                className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground outline-none cursor-pointer hover:bg-card/80 transition-all"
                            >
                                {emiMonths.map((m) => (
                                    <option
                                        key={m}
                                        value={m}
                                        className="bg-background text-foreground"
                                    >
                                        {formatMonthName(m)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {filteredEMIs.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredEMIs.map((emi) => {
                                    const daysRemaining = getDaysRemaining(
                                        emi.due_date,
                                    );
                                    const isPaid = emi.status === "Paid";
                                    const isOverdue =
                                        !isPaid && daysRemaining < 0;
                                    const isDueSoon =
                                        !isPaid &&
                                        daysRemaining >= 0 &&
                                        daysRemaining <= 5;

                                    return (
                                        <motion.div
                                            key={emi.id}
                                            whileHover={{ scale: 1.01 }}
                                            className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 ${
                                                isPaid
                                                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                                                    : isOverdue
                                                      ? "bg-red-500/5 border-red-500/10 text-red-300 shadow-[0_0_15px_-3px_rgba(239,68,68,0.08)] animate-[pulse_3s_infinite]"
                                                      : isDueSoon
                                                        ? "bg-amber-500/5 border-amber-500/10 text-amber-300 shadow-[0_0_15px_-3px_rgba(245,158,11,0.08)]"
                                                        : "bg-blue-500/5 border-blue-500/10 text-blue-300"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground">
                                                        {emi.title}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground">
                                                        Due: {emi.due_date}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                        isPaid
                                                            ? "bg-emerald-500/15 text-emerald-500"
                                                            : isOverdue
                                                              ? "bg-red-500/15 text-red-500"
                                                              : isDueSoon
                                                                ? "bg-amber-500/15 text-amber-500"
                                                                : "bg-blue-500/15 text-blue-500"
                                                    }`}
                                                >
                                                    {isPaid ? (
                                                        <>
                                                            <CheckCircle2 className="h-3 w-3" />{" "}
                                                            Paid
                                                        </>
                                                    ) : isOverdue ? (
                                                        <>
                                                            <AlertCircle className="h-3 w-3" />{" "}
                                                            -
                                                            {Math.abs(
                                                                daysRemaining,
                                                            )}
                                                            d
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="h-3 w-3" />{" "}
                                                            {daysRemaining}d
                                                            left
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                                                <div>
                                                    <span className="text-[11px] text-muted-foreground block">
                                                        Amount
                                                    </span>
                                                    <span className="text-base font-bold text-foreground">
                                                        ₹
                                                        {emi.emi_amount.toLocaleString()}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        toggleEmiStatus(emi.id)
                                                    }
                                                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                                        isPaid
                                                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                                            : "border-white/10 bg-background/50 text-foreground hover:bg-white/5"
                                                    }`}
                                                >
                                                    {isPaid
                                                        ? "Mark Unpaid"
                                                        : "Mark as Paid"}
                                                </button>
                                            </div>

                                            {/* Display Days Alert info text */}
                                            {!isPaid && (
                                                <div className="mt-3 text-[11px] font-medium">
                                                    {isOverdue ? (
                                                        <span className="text-red-500">
                                                            ⚠️ Overdue by{" "}
                                                            {Math.abs(
                                                                daysRemaining,
                                                            )}{" "}
                                                            day
                                                            {Math.abs(
                                                                daysRemaining,
                                                            ) > 1
                                                                ? "s"
                                                                : ""}
                                                            ! Pay immediately.
                                                        </span>
                                                    ) : daysRemaining === 0 ? (
                                                        <span className="text-red-500">
                                                            🚨 Due TODAY! Pay
                                                            now.
                                                        </span>
                                                    ) : isDueSoon ? (
                                                        <span className="text-amber-500">
                                                            ⏰ {daysRemaining}{" "}
                                                            day
                                                            {daysRemaining > 1
                                                                ? "s"
                                                                : ""}{" "}
                                                            remaining
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            {daysRemaining} days
                                                            remaining
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
                                <h4 className="text-sm font-semibold text-muted-foreground">
                                    No EMIs due this month
                                </h4>
                                <p className="text-xs text-muted-foreground/60 mt-0.5">
                                    Select another month or add upcoming
                                    schedules in EMI Manager.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 lg:col-span-4"
                >
                    <Card className="h-full glassmorphism">
                        <CardHeader>
                            <CardTitle>EMI Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] min-h-[300px] w-full relative">
                            {mounted && emiData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={emiData}
                                        margin={{ bottom: 10 }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="emiGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#6366f1"
                                                    stopOpacity={0.95}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#3b82f6"
                                                    stopOpacity={0.2}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="rgba(120,119,198,0.1)"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#94a3b8"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) =>
                                                `₹${value}`
                                            }
                                        />
                                        <Tooltip
                                            cursor={{
                                                fill: "rgba(120, 119, 198, 0.05)",
                                            }}
                                            contentStyle={{
                                                backgroundColor:
                                                    "hsl(var(--card)/0.8)",
                                                backdropFilter: "blur(12px)",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "12px",
                                                boxShadow:
                                                    "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                        />
                                        <Bar
                                            name="EMI Amount (₹)"
                                            dataKey="amount"
                                            fill="url(#emiGradient)"
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                                    {mounted && emiData.length === 0
                                        ? "No active EMIs to display. Add one in EMI Manager!"
                                        : "Loading chart..."}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="col-span-1 lg:col-span-3"
                >
                    <Card className="h-full glassmorphism">
                        <CardHeader>
                            <CardTitle>Expense Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] min-h-[300px] w-full relative flex flex-col items-center justify-center">
                            {mounted && expenseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {expenseData.map(
                                                (entry: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                        stroke="hsl(var(--card))"
                                                        strokeWidth={3}
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "hsl(var(--card)/0.8)",
                                                backdropFilter: "blur(12px)",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "12px",
                                                boxShadow:
                                                    "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Legend
                                            layout="horizontal"
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            wrapperStyle={{
                                                fontSize: "11px",
                                                paddingTop: "10px",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                                    {mounted && expenseData.length === 0
                                        ? "No expenses logged yet. Add one in Expenses!"
                                        : "Loading chart..."}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
} from "recharts";
import {
    Brain,
    TrendingDown,
    Sparkles,
    AlertTriangle,
    ShieldCheck,
    Target,
    Zap,
    Heart,
    Flame,
    CreditCard,
    Calendar,
    ArrowRight,
} from "lucide-react";
import {
    calculateRiskLevel,
    calculateSurvival,
    calculateHealthScore,
    calculateSnowball,
    calculateAvalanche,
    calculateEMIPressure,
    generateWarnings,
    generateAIInsights,
    generate12MonthForecast,
    type RiskLevel,
} from "@/lib/engines/recovery-engine";
import { AIAnalysisCard } from "@/components/ai-analysis-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PredictorPage() {
    const { emis, expenses, user, goals } = useStore();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "strategy" | "forecast" | "warnings">("overview");
    const [extraPayment, setExtraPayment] = useState<number>(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    const salary = user?.salary || 0;
    const activeEmis = useMemo(
        () => emis.filter((e) => e.status === "Active" && e.remaining_months > 0),
        [emis],
    );
    const totalMonthlyEmi = useMemo(
        () => activeEmis.reduce((s, e) => s + e.emi_amount, 0),
        [activeEmis],
    );
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const avgMonthlyExpenses =
        expenses.length > 0
            ? totalExpenses / Math.max(1, new Set(expenses.map((e) => e.date.substring(0, 7))).size)
            : 0;
    const totalDebt = activeEmis.reduce((s, e) => s + e.emi_amount * e.remaining_months, 0);
    const maxMonths =
        activeEmis.length > 0 ? Math.max(...activeEmis.map((e) => e.remaining_months)) : 0;

    // Computed data
    const riskLevel = useMemo(() => calculateRiskLevel(totalMonthlyEmi, salary), [totalMonthlyEmi, salary]);
    const survival = useMemo(
        () => calculateSurvival(salary, totalMonthlyEmi, expenses),
        [salary, totalMonthlyEmi, expenses],
    );
    const healthScore = useMemo(
        () => calculateHealthScore(salary, totalMonthlyEmi, avgMonthlyExpenses, totalDebt, goals),
        [salary, totalMonthlyEmi, avgMonthlyExpenses, totalDebt, goals],
    );

    const snowball = useMemo(() => calculateSnowball(activeEmis, extraPayment), [activeEmis, extraPayment]);
    const avalanche = useMemo(() => calculateAvalanche(activeEmis, extraPayment), [activeEmis, extraPayment]);

    // Merge strategy data for chart
    const strategyChartData = useMemo(() => {
        const maxMonth = Math.max(avalanche.totalMonths, snowball.totalMonths, 1);
        const data: { month: number; avalanche: number; snowball: number }[] = [];
        for (let m = 0; m <= maxMonth; m++) {
            const aPoint = avalanche.monthlyData.find((d) => d.month === m);
            const sPoint = snowball.monthlyData.find((d) => d.month === m);
            const aVal = aPoint
                ? aPoint.totalDebt
                : (avalanche.monthlyData.filter((d) => d.month <= m).pop()?.totalDebt ?? 0);
            const sVal = sPoint
                ? sPoint.totalDebt
                : (snowball.monthlyData.filter((d) => d.month <= m).pop()?.totalDebt ?? 0);
            if (m % Math.max(1, Math.ceil(maxMonth / 20)) === 0 || m === maxMonth) {
                data.push({ month: m, avalanche: aVal, snowball: sVal });
            }
        }
        return data;
    }, [avalanche, snowball]);

    const emiPressure = useMemo(() => calculateEMIPressure(activeEmis, salary), [activeEmis, salary]);
    const warnings = useMemo(
        () => generateWarnings(salary, totalMonthlyEmi, expenses, activeEmis),
        [salary, totalMonthlyEmi, expenses, activeEmis],
    );
    const insights = useMemo(
        () => generateAIInsights(salary, totalMonthlyEmi, avgMonthlyExpenses, activeEmis, maxMonths),
        [salary, totalMonthlyEmi, avgMonthlyExpenses, activeEmis, maxMonths],
    );
    const forecast = useMemo(
        () => generate12MonthForecast(salary, totalMonthlyEmi, avgMonthlyExpenses, activeEmis),
        [salary, totalMonthlyEmi, avgMonthlyExpenses, activeEmis],
    );

    const riskColors: Record<RiskLevel, string> = {
        Safe: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
        Moderate: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        "High Risk": "text-orange-400 border-orange-500/30 bg-orange-500/10",
        Critical: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    };

    const tabs = [
        { id: "overview" as const, label: "Overview", icon: Brain },
        { id: "strategy" as const, label: "Repayment Strategy", icon: Target },
        { id: "forecast" as const, label: "12-Month Forecast", icon: TrendingDown },
        {
            id: "warnings" as const,
            label: `Warnings${warnings.length > 0 ? ` (${warnings.length})` : ""}`,
            icon: AlertTriangle,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Brain className="h-6 w-6 text-indigo-400" />
                        AI Debt Recovery & Forecast Engine
                    </h2>
                    <p className="text-sm text-slate-400">
                        Amortization modeling, Avalanche/Snowball payoff strategies, and 12-month balance forecasts.
                    </p>
                </div>
                <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${riskColors[riskLevel]}`}>
                    Risk Level: {riskLevel}
                </div>
            </div>

            {/* Emergency Mode Banner */}
            {survival.isEmergency && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3">
                    <Zap className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-rose-300 text-sm">Emergency Budget Mode Active</h3>
                        <p className="text-xs text-rose-300/80 mt-1">
                            Your monthly debt liabilities exceed your salary or projected cash balance is negative.
                            Prioritize high-interest loans and restrict discretionary spending immediately.
                        </p>
                    </div>
                </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                <Card className="glassmorphism p-4">
                    <p className="text-[11px] text-slate-400 font-medium">Total Outstanding Debt</p>
                    <p className="text-lg font-bold text-rose-400 font-mono mt-1">
                        ₹{totalDebt.toLocaleString()}
                    </p>
                </Card>
                <Card className="glassmorphism p-4">
                    <p className="text-[11px] text-slate-400 font-medium">Debt-Free Horizon</p>
                    <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                        {maxMonths > 0 ? `${maxMonths} Months` : "Debt-Free! 🎉"}
                    </p>
                </Card>
                <Card className="glassmorphism p-4">
                    <p className="text-[11px] text-slate-400 font-medium">Financial Health</p>
                    <p className="text-lg font-bold text-indigo-400 font-mono mt-1">
                        {healthScore.total}/100
                    </p>
                </Card>
                <Card className="glassmorphism p-4">
                    <p className="text-[11px] text-slate-400 font-medium">Safe Daily Spend Limit</p>
                    <p className="text-lg font-bold text-cyan-400 font-mono mt-1">
                        ₹{survival.dailyLimit.toLocaleString()}
                    </p>
                </Card>
                <Card className="glassmorphism p-4 col-span-2 lg:col-span-1">
                    <p className="text-[11px] text-slate-400 font-medium">Month Survival Index</p>
                    <p
                        className={`text-lg font-bold font-mono mt-1 ${
                            survival.survivalScore > 50 ? "text-emerald-400" : "text-rose-400"
                        }`}
                    >
                        {survival.survivalScore}%
                    </p>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/[0.08] overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                        }`}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    <AIAnalysisCard
                        title="AI Personalized Debt Recovery Plan"
                        description="Generate an end-to-end debt reduction strategy based on your exact loan numbers"
                        buttonLabel="Generate Recovery Strategy"
                        cacheKey="recovery-plan"
                        autoGenerate
                        prompt="Analyze my complete financial situation and create a step-by-step debt recovery plan. Include: 1) Which specific loan to pay off first and why, 2) Exactly how much extra monthly prepayment to allocate, 3) My realistic debt-free timeline, 4) Top 3 spending categories to trim with exact rupee amounts. Be specific with my actual numbers."
                    />

                    {/* AI Insights Grid */}
                    <Card className="glassmorphism border-white/[0.08]">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-400" />
                                Smart Financial Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            {insights.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {insights.map((tip, i) => (
                                        <div
                                            key={i}
                                            className={`rounded-xl border p-3.5 ${
                                                tip.type === "success"
                                                    ? "border-emerald-500/25 bg-emerald-500/5 text-slate-200"
                                                    : tip.type === "danger"
                                                      ? "border-rose-500/25 bg-rose-500/5 text-slate-200"
                                                      : tip.type === "warning"
                                                        ? "border-amber-500/25 bg-amber-500/5 text-slate-200"
                                                        : "border-indigo-500/25 bg-indigo-500/5 text-slate-200"
                                            }`}
                                        >
                                            <h4 className="text-xs font-bold text-white mb-1">{tip.title}</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">{tip.text}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 text-center py-6">
                                    Add your salary and EMIs to generate automated AI recovery insights.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* EMI Pressure Ranking */}
                    {emiPressure.length > 0 && (
                        <Card className="glassmorphism border-white/[0.08]">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-rose-400" />
                                    Loan Pressure Index
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Loans ranked by interest impact and salary burden
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-2">
                                {emiPressure.map((emi, idx) => (
                                    <div
                                        key={emi.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-slate-900/40"
                                    >
                                        <span
                                            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                                idx === 0
                                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                                    : "bg-slate-800 text-slate-400"
                                            }`}
                                        >
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{emi.title}</p>
                                            <p className="text-[11px] text-slate-400 font-mono">
                                                ₹{emi.emiAmount.toLocaleString()}/mo · {emi.interestRate}% interest ·{" "}
                                                {emi.remainingMonths} months left
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`text-xs font-bold font-mono ${
                                                    emi.pressureIndex > 60
                                                        ? "text-rose-400"
                                                        : emi.pressureIndex > 40
                                                          ? "text-amber-400"
                                                          : "text-emerald-400"
                                                }`}
                                            >
                                                Pressure {emi.pressureIndex}/100
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* TAB: STRATEGY */}
            {activeTab === "strategy" && (
                <div className="space-y-6">
                    {/* Interactive Prepayment Input */}
                    <Card className="glassmorphism border-indigo-500/30 bg-indigo-950/20 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Target className="h-4 w-4 text-indigo-400" />
                                    Extra Monthly Debt Prepayment Simulator
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Simulate how extra prepayments accelerate your debt-free milestone.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs text-slate-300 whitespace-nowrap">Extra (₹/mo):</Label>
                                <Input
                                    type="number"
                                    placeholder="2000"
                                    value={extraPayment || ""}
                                    onChange={(e) => setExtraPayment(Number(e.target.value))}
                                    className="w-28 h-8 text-xs font-mono font-bold bg-slate-900 border-white/10 text-white"
                                />
                            </div>
                        </div>
                    </Card>

                    {activeEmis.length >= 2 ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Avalanche Card */}
                                <Card className="glassmorphism border-blue-500/30 p-5">
                                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1">
                                        <Flame className="h-4 w-4" /> Avalanche Method (Highest Interest First)
                                    </div>
                                    <p className="text-xs text-slate-400 mb-4">
                                        Mathematically optimal — saves the maximum interest money.
                                    </p>

                                    <div className="space-y-2 border-t border-white/[0.06] pt-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Total Interest Payable</span>
                                            <span className="font-mono font-bold text-white">
                                                ₹{avalanche.totalInterestPaid.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Months to Zero Debt</span>
                                            <span className="font-mono font-bold text-emerald-400">
                                                {avalanche.totalMonths} Months
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                            Payoff Priority Sequence
                                        </span>
                                        {avalanche.payoffOrder.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-300">
                                                    {i + 1}. {p.title}
                                                </span>
                                                <span className="text-indigo-400 font-mono font-semibold">
                                                    Cleared in Month {p.paidOffMonth}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Snowball Card */}
                                <Card className="glassmorphism border-violet-500/30 p-5">
                                    <div className="flex items-center gap-2 text-violet-400 font-bold text-sm mb-1">
                                        <Heart className="h-4 w-4" /> Snowball Method (Smallest Balance First)
                                    </div>
                                    <p className="text-xs text-slate-400 mb-4">
                                        Psychological wins — eliminates loans quickly for momentum.
                                    </p>

                                    <div className="space-y-2 border-t border-white/[0.06] pt-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Total Interest Payable</span>
                                            <span className="font-mono font-bold text-white">
                                                ₹{snowball.totalInterestPaid.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Months to Zero Debt</span>
                                            <span className="font-mono font-bold text-violet-300">
                                                {snowball.totalMonths} Months
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                            Payoff Priority Sequence
                                        </span>
                                        {snowball.payoffOrder.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-300">
                                                    {i + 1}. {p.title}
                                                </span>
                                                <span className="text-violet-400 font-mono font-semibold">
                                                    Cleared in Month {p.paidOffMonth}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Strategy Paydown Chart */}
                            {mounted && (
                                <Card className="glassmorphism border-white/[0.08] p-5">
                                    <CardHeader className="p-0 pb-4">
                                        <CardTitle className="text-base font-bold text-white">
                                            Debt Paydown Trajectory Comparison
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-400">
                                            Comparing total debt balance curve between Avalanche and Snowball
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={strategyChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
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
                                                    formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Balance"]}
                                                />
                                                <Legend verticalAlign="bottom" height={36} />
                                                <Line
                                                    name="Avalanche Method"
                                                    type="monotone"
                                                    dataKey="avalanche"
                                                    stroke="#38bdf8"
                                                    strokeWidth={2.5}
                                                    dot={false}
                                                />
                                                <Line
                                                    name="Snowball Method"
                                                    type="monotone"
                                                    dataKey="snowball"
                                                    stroke="#a855f7"
                                                    strokeWidth={2.5}
                                                    dot={false}
                                                    strokeDasharray="5 5"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="glassmorphism p-10 text-center text-slate-500 text-xs">
                            Add at least 2 active loans in EMI Manager to compare payoff strategies.
                        </Card>
                    )}
                </div>
            )}

            {/* TAB: FORECAST */}
            {activeTab === "forecast" && (
                <div className="space-y-6">
                    {mounted && forecast.length > 0 && salary > 0 ? (
                        <Card className="glassmorphism border-white/[0.08] p-5">
                            <CardHeader className="p-0 pb-4">
                                <CardTitle className="text-base font-bold text-white">
                                    12-Month Financial Horizon Simulation
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Projected savings growth vs outstanding debt amortization
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecast}>
                                        <defs>
                                            <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
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
                                            formatter={(v: any) => [`₹${Number(v).toLocaleString()}`]}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                        <Area
                                            name="Cumulative Savings"
                                            type="monotone"
                                            dataKey="savings"
                                            stroke="#10b981"
                                            fill="url(#savGrad)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            name="Remaining Debt"
                                            type="monotone"
                                            dataKey="debt"
                                            stroke="#f43f5e"
                                            fill="url(#debtGrad)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="glassmorphism p-10 text-center text-slate-500 text-xs">
                            Add your salary to visualize 12-month projections.
                        </Card>
                    )}
                </div>
            )}

            {/* TAB: WARNINGS */}
            {activeTab === "warnings" && (
                <div className="space-y-4">
                    {warnings.length > 0 ? (
                        warnings.map((w) => (
                            <div
                                key={w.id}
                                className={`rounded-2xl border p-4 flex items-start gap-3.5 ${
                                    w.severity === "Critical"
                                        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                                        : w.severity === "High"
                                          ? "border-orange-500/30 bg-orange-500/10 text-orange-200"
                                          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                                }`}
                            >
                                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm text-white">{w.title}</h4>
                                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{w.message}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl glassmorphism">
                            <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-emerald-400" />
                            <p className="text-sm font-semibold text-slate-300">No Critical Warnings Detected</p>
                            <p className="text-xs text-slate-500 mt-1">Your debt-to-income and cash flow ratios are healthy.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

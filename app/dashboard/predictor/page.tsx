"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
    LineChart,
    Line,
} from "recharts";
import {
    Brain,
    TrendingDown,
    Sparkles,
    AlertTriangle,
    ShieldCheck,
    Lightbulb,
    Calendar,
    IndianRupee,
    Target,
    Zap,
    Heart,
    Clock,
    Flame,
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
    type HealthScoreBreakdown,
    type SurvivalAnalysis,
    type StrategyResult,
    type EMIPressure,
    type FinancialWarning,
    type AIInsight,
} from "@/lib/engines/recovery-engine";
import { AIAnalysisCard } from "@/components/ai-analysis-card";

export default function PredictorPage() {
    const { emis, expenses, user, goals } = useStore();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<
        "overview" | "strategy" | "forecast" | "warnings"
    >("overview");

    useEffect(() => {
        setMounted(true);
    }, []);

    const salary = user?.salary || 0;
    const activeEmis = emis.filter((e) => e.status === "Active");
    const totalMonthlyEmi = activeEmis.reduce((s, e) => s + e.emi_amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const avgMonthlyExpenses =
        expenses.length > 0
            ? totalExpenses /
              Math.max(
                  1,
                  new Set(expenses.map((e) => e.date.substring(0, 7))).size,
              )
            : 0;
    const totalDebt = activeEmis.reduce(
        (s, e) => s + e.emi_amount * e.remaining_months,
        0,
    );
    const maxMonths =
        activeEmis.length > 0
            ? Math.max(...activeEmis.map((e) => e.remaining_months))
            : 0;
    const monthlySavings = salary - totalMonthlyEmi - avgMonthlyExpenses;

    // Computed data
    const riskLevel = useMemo(
        () => calculateRiskLevel(totalMonthlyEmi, salary),
        [totalMonthlyEmi, salary],
    );
    const survival = useMemo(
        () => calculateSurvival(salary, totalMonthlyEmi, expenses),
        [salary, totalMonthlyEmi, expenses],
    );
    const healthScore = useMemo(
        () =>
            calculateHealthScore(
                salary,
                totalMonthlyEmi,
                avgMonthlyExpenses,
                totalDebt,
                goals,
            ),
        [salary, totalMonthlyEmi, avgMonthlyExpenses, totalDebt, goals],
    );
    const snowball = useMemo(() => calculateSnowball(emis), [emis]);
    const avalanche = useMemo(() => calculateAvalanche(emis), [emis]);

    // Merge strategy data into single dataset for chart
    const strategyChartData = useMemo(() => {
        const maxMonth = Math.max(
            avalanche.totalMonths,
            snowball.totalMonths,
            1,
        );
        const data: { month: number; avalanche: number; snowball: number }[] =
            [];
        for (let m = 0; m <= maxMonth; m++) {
            const aPoint = avalanche.monthlyData.find((d) => d.month === m);
            const sPoint = snowball.monthlyData.find((d) => d.month === m);
            const aVal = aPoint
                ? aPoint.totalDebt
                : (avalanche.monthlyData.filter((d) => d.month <= m).pop()
                      ?.totalDebt ?? 0);
            const sVal = sPoint
                ? sPoint.totalDebt
                : (snowball.monthlyData.filter((d) => d.month <= m).pop()
                      ?.totalDebt ?? 0);
            if (
                m % Math.max(1, Math.ceil(maxMonth / 24)) === 0 ||
                m === maxMonth
            ) {
                data.push({ month: m, avalanche: aVal, snowball: sVal });
            }
        }
        return data;
    }, [avalanche, snowball]);

    const emiPressure = useMemo(
        () => calculateEMIPressure(emis, salary),
        [emis, salary],
    );
    const warnings = useMemo(
        () => generateWarnings(salary, totalMonthlyEmi, expenses, emis),
        [salary, totalMonthlyEmi, expenses, emis],
    );
    const insights = useMemo(
        () =>
            generateAIInsights(
                salary,
                totalMonthlyEmi,
                avgMonthlyExpenses,
                emis,
                maxMonths,
            ),
        [salary, totalMonthlyEmi, avgMonthlyExpenses, emis, maxMonths],
    );
    const forecast = useMemo(
        () =>
            generate12MonthForecast(
                salary,
                totalMonthlyEmi,
                avgMonthlyExpenses,
                emis,
            ),
        [salary, totalMonthlyEmi, avgMonthlyExpenses, emis],
    );

    const riskColors: Record<RiskLevel, string> = {
        Safe: "text-emerald-500",
        Moderate: "text-amber-500",
        "High Risk": "text-orange-500",
        Critical: "text-red-500",
    };
    const riskBg: Record<RiskLevel, string> = {
        Safe: "bg-emerald-500/10",
        Moderate: "bg-amber-500/10",
        "High Risk": "bg-orange-500/10",
        Critical: "bg-red-500/10",
    };

    const tabs = [
        { id: "overview" as const, label: "Overview", icon: Brain },
        { id: "strategy" as const, label: "Strategy", icon: Target },
        { id: "forecast" as const, label: "Forecast", icon: TrendingDown },
        {
            id: "warnings" as const,
            label: `Warnings${warnings.length > 0 ? ` (${warnings.length})` : ""}`,
            icon: AlertTriangle,
        },
    ];

    const debtFreeDate =
        maxMonths > 0
            ? (() => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + maxMonths);
                  return d;
              })()
            : null;
    const debtPaidPercent =
        activeEmis.length > 0
            ? Math.round(
                  (activeEmis.reduce(
                      (s, e) =>
                          s +
                          (e.total_months - e.remaining_months) /
                              e.total_months,
                      0,
                  ) /
                      activeEmis.length) *
                      100,
              )
            : 100;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        AI Recovery Engine
                    </h2>
                    <p className="text-muted-foreground">
                        AI-powered debt recovery, predictions & financial
                        intelligence.
                    </p>
                </div>
                <div
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${riskBg[riskLevel]} ${riskColors[riskLevel]}`}
                >
                    {riskLevel}
                </div>
            </div>

            {/* Emergency Banner */}
            {survival.isEmergency && (
                <div className="rounded-xl border-2 border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
                    <Zap className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-red-500 text-sm">
                            🚨 Emergency Mode Active
                        </h3>
                        <p className="text-xs text-red-400 mt-1">
                            Your EMI exceeds salary or balance is negative. Cut
                            all non-essential spending immediately.
                        </p>
                    </div>
                </div>
            )}

            {/* Top Stats */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                <Card className="glassmorphism py-4">
                    <CardContent className="p-0 px-4">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Total Debt
                        </p>
                        <p className="text-lg font-bold text-red-500">
                            ₹{totalDebt.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glassmorphism py-4">
                    <CardContent className="p-0 px-4">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Debt-Free In
                        </p>
                        <p className="text-lg font-bold text-emerald-500">
                            {maxMonths > 0 ? `${maxMonths} mo` : "Now!"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glassmorphism py-4">
                    <CardContent className="p-0 px-4">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Health Score
                        </p>
                        <p
                            className={`text-lg font-bold ${healthScore.total >= 60 ? "text-emerald-500" : healthScore.total >= 40 ? "text-amber-500" : "text-red-500"}`}
                        >
                            {healthScore.total}/100
                        </p>
                    </CardContent>
                </Card>
                <Card className="glassmorphism py-4">
                    <CardContent className="p-0 px-4">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Daily Limit
                        </p>
                        <p className="text-lg font-bold text-blue-500">
                            ₹{survival.dailyLimit.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glassmorphism py-4 col-span-2 lg:col-span-1">
                    <CardContent className="p-0 px-4">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Survival
                        </p>
                        <p
                            className={`text-lg font-bold ${survival.survivalScore > 50 ? "text-emerald-500" : "text-red-500"}`}
                        >
                            {survival.survivalScore}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    {/* AI Deep Analysis */}
                    <AIAnalysisCard
                        title="AI Recovery Plan"
                        description="Get a personalized debt recovery strategy from AI based on your real data"
                        buttonLabel="Generate My Recovery Plan"
                        cacheKey="recovery-plan"
                        autoGenerate
                        prompt="Analyze my complete financial situation and create a detailed, step-by-step debt recovery plan. Include: 1) Which specific loan to attack first and why, 2) Exactly how much extra I should pay monthly, 3) My realistic debt-free timeline, 4) Top 3 spending cuts with rupee amounts, 5) An emergency fund target. Be specific with my actual numbers and end with an encouraging note."
                    />

                    {/* AI Insights */}
                    <Card className="glassmorphism">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-violet-500" />
                                <CardTitle>AI Financial Insights</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {insights.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {insights.map((tip, i) => (
                                        <div
                                            key={i}
                                            className={`rounded-lg border p-3 ${tip.type === "success" ? "border-emerald-500/20 bg-emerald-500/5" : tip.type === "danger" ? "border-red-500/20 bg-red-500/5" : tip.type === "warning" ? "border-amber-500/20 bg-amber-500/5" : "border-blue-500/20 bg-blue-500/5"}`}
                                        >
                                            <h4 className="text-xs font-bold mb-1">
                                                {tip.title}
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                {tip.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    Add salary and EMIs to get AI insights.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Health Score Breakdown */}
                    <Card className="glassmorphism">
                        <CardHeader>
                            <CardTitle>Financial Health Breakdown</CardTitle>
                            <CardDescription>
                                {healthScore.category} — Score:{" "}
                                {healthScore.total}/100
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    {
                                        label: "Savings Ratio",
                                        score: healthScore.savingsRatio.score,
                                        max: 25,
                                        value: `${healthScore.savingsRatio.value}%`,
                                    },
                                    {
                                        label: "EMI Burden",
                                        score: healthScore.emiRatio.score,
                                        max: 25,
                                        value: `${healthScore.emiRatio.value}%`,
                                    },
                                    {
                                        label: "Expense Control",
                                        score: healthScore.expenseStability
                                            .score,
                                        max: 20,
                                        value: `${healthScore.expenseStability.value}%`,
                                    },
                                    {
                                        label: "Debt Level",
                                        score: healthScore.debtLevel.score,
                                        max: 15,
                                        value: `${healthScore.debtLevel.value}%`,
                                    },
                                    {
                                        label: "Emergency Fund",
                                        score: healthScore.emergencyFund.score,
                                        max: 15,
                                        value: `${healthScore.emergencyFund.value}%`,
                                    },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-xs text-muted-foreground w-28 shrink-0">
                                            {item.label}
                                        </span>
                                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                                                style={{
                                                    width: `${(item.score / item.max) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono w-12 text-right">
                                            {item.score}/{item.max}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* EMI Pressure Ranking */}
                    {emiPressure.length > 0 && (
                        <Card className="glassmorphism">
                            <CardHeader>
                                <CardTitle>EMI Pressure Ranking</CardTitle>
                                <CardDescription>
                                    Loans ranked by financial strain
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {emiPressure.map((emi, i) => (
                                        <div
                                            key={emi.id}
                                            className="flex items-center gap-3 p-2.5 rounded-lg border bg-card/50"
                                        >
                                            <span
                                                className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground"}`}
                                            >
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {emi.title}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    ₹
                                                    {emi.emiAmount.toLocaleString()}
                                                    /mo · {emi.interestRate}% ·{" "}
                                                    {emi.remainingMonths}mo left
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className={`text-xs font-bold ${emi.pressureIndex > 60 ? "text-red-500" : emi.pressureIndex > 40 ? "text-amber-500" : "text-emerald-500"}`}
                                                >
                                                    {emi.pressureIndex}/100
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* STRATEGY TAB */}
            {activeTab === "strategy" && (
                <div className="space-y-6">
                    {/* AI Strategy Advisor */}
                    <AIAnalysisCard
                        title="AI Strategy Advisor"
                        description="Get AI guidance on the best repayment strategy for your loans"
                        buttonLabel="Get Strategy Advice"
                        cacheKey="strategy-advisor"
                        autoGenerate
                        prompt="Compare the Snowball and Avalanche debt repayment strategies for MY specific loans. Tell me: 1) Which strategy is best for my situation and exactly why, 2) The exact order I should pay off my loans, 3) How much total interest I'll save with the better method, 4) A realistic monthly extra payment I can afford, 5) Whether psychological motivation (Snowball) or pure savings (Avalanche) matters more for me. Use my actual loan names, amounts, and interest rates."
                    />
                    {activeEmis.length >= 2 ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Card className="glassmorphism border-blue-500/20">
                                    <CardHeader>
                                        <CardTitle className="text-blue-500 flex items-center gap-2">
                                            <Flame className="h-4 w-4" />{" "}
                                            Avalanche Method
                                        </CardTitle>
                                        <CardDescription>
                                            Pay highest interest first — saves
                                            most money
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Total Interest
                                            </span>
                                            <span className="font-bold">
                                                ₹
                                                {avalanche.totalInterestPaid.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Months to Freedom
                                            </span>
                                            <span className="font-bold">
                                                {avalanche.totalMonths}
                                            </span>
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            {avalanche.payoffOrder.map(
                                                (p, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 text-xs"
                                                    >
                                                        <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {p.title}
                                                        </span>
                                                        <span className="ml-auto font-mono">
                                                            Mo {p.paidOffMonth}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="glassmorphism border-violet-500/20">
                                    <CardHeader>
                                        <CardTitle className="text-violet-500 flex items-center gap-2">
                                            <Heart className="h-4 w-4" />{" "}
                                            Snowball Method
                                        </CardTitle>
                                        <CardDescription>
                                            Pay smallest balance first — builds
                                            momentum
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Total Interest
                                            </span>
                                            <span className="font-bold">
                                                ₹
                                                {snowball.totalInterestPaid.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Months to Freedom
                                            </span>
                                            <span className="font-bold">
                                                {snowball.totalMonths}
                                            </span>
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            {snowball.payoffOrder.map(
                                                (p, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 text-xs"
                                                    >
                                                        <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center text-[10px] font-bold">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {p.title}
                                                        </span>
                                                        <span className="ml-auto font-mono">
                                                            Mo {p.paidOffMonth}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            {/* Recommendation */}
                            <Card className="glassmorphism border-emerald-500/20 bg-emerald-500/5">
                                <CardContent className="py-4 flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            Recommended:{" "}
                                            {avalanche.totalInterestPaid <=
                                            snowball.totalInterestPaid
                                                ? "Avalanche"
                                                : "Snowball"}{" "}
                                            Method
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Saves ₹
                                            {Math.abs(
                                                avalanche.totalInterestPaid -
                                                    snowball.totalInterestPaid,
                                            ).toLocaleString()}{" "}
                                            in interest
                                            {avalanche.totalMonths !==
                                                snowball.totalMonths &&
                                                ` and ${Math.abs(avalanche.totalMonths - snowball.totalMonths)} months`}
                                            .
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Strategy Chart */}
                            {mounted && (
                                <Card className="glassmorphism">
                                    <CardHeader>
                                        <CardTitle>
                                            Strategy Comparison Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] min-h-[300px]">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <LineChart
                                                data={strategyChartData}
                                                margin={{
                                                    top: 10,
                                                    right: 10,
                                                    bottom: 10,
                                                    left: 0,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    stroke="hsl(var(--muted))"
                                                />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    label={{
                                                        value: "Months",
                                                        position: "bottom",
                                                        fontSize: 10,
                                                    }}
                                                />
                                                <YAxis
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(v) =>
                                                        `₹${(v / 1000).toFixed(0)}k`
                                                    }
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor:
                                                            "hsl(var(--card))",
                                                        border: "1px solid hsl(var(--border))",
                                                        borderRadius: "8px",
                                                    }}
                                                    formatter={(v: any) =>
                                                        `₹${Number(v).toLocaleString()}`
                                                    }
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                />
                                                <Line
                                                    name="Avalanche"
                                                    type="monotone"
                                                    dataKey="avalanche"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2.5}
                                                    dot={false}
                                                />
                                                <Line
                                                    name="Snowball"
                                                    type="monotone"
                                                    dataKey="snowball"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2.5}
                                                    dot={false}
                                                    strokeDasharray="6 4"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="glassmorphism">
                            <CardContent className="py-12 text-center text-muted-foreground text-sm">
                                Add at least 2 active EMIs to compare repayment
                                strategies.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* FORECAST TAB */}
            {activeTab === "forecast" && (
                <div className="space-y-6">
                    {/* AI Forecast Analyst */}
                    <AIAnalysisCard
                        title="AI Forecast Analyst"
                        description="AI predicts your financial future and flags risks ahead"
                        buttonLabel="Analyze My Future"
                        cacheKey="forecast-analyst"
                        autoGenerate
                        prompt="Based on my current finances, forecast my financial situation over the next 12 months. Tell me: 1) What my savings will look like in 6 and 12 months if nothing changes, 2) Which month my finances improve significantly (when an EMI ends), 3) Any month where I might face a cash crunch, 4) My projected net worth growth, 5) Two specific actions to improve my 12-month outlook. Use my actual numbers and be realistic."
                    />
                    {mounted && forecast.length > 0 && salary > 0 ? (
                        <>
                            <Card className="glassmorphism">
                                <CardHeader>
                                    <CardTitle>
                                        12-Month Financial Forecast
                                    </CardTitle>
                                    <CardDescription>
                                        Projected balance, savings growth, and
                                        debt reduction
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="h-[350px] min-h-[350px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <AreaChart
                                            data={forecast}
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                bottom: 10,
                                                left: 0,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="savGrad"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="#10b981"
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="#10b981"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                                <linearGradient
                                                    id="debtGrad"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="#ef4444"
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="#ef4444"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="hsl(var(--muted))"
                                            />
                                            <XAxis
                                                dataKey="month"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) =>
                                                    `₹${(v / 1000).toFixed(0)}k`
                                                }
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        "hsl(var(--card))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "8px",
                                                }}
                                                formatter={(v: any) =>
                                                    `₹${Number(v).toLocaleString()}`
                                                }
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                            />
                                            <Area
                                                name="Cumulative Savings"
                                                type="monotone"
                                                dataKey="savings"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                fill="url(#savGrad)"
                                            />
                                            <Area
                                                name="Remaining Debt"
                                                type="monotone"
                                                dataKey="debt"
                                                stroke="#ef4444"
                                                strokeWidth={2}
                                                fill="url(#debtGrad)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="glassmorphism">
                                <CardHeader>
                                    <CardTitle>
                                        Monthly Net Balance Forecast
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] min-h-[250px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={forecast}
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                bottom: 10,
                                                left: 0,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="hsl(var(--muted))"
                                            />
                                            <XAxis
                                                dataKey="month"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) =>
                                                    `₹${(v / 1000).toFixed(0)}k`
                                                }
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        "hsl(var(--card))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "8px",
                                                }}
                                                formatter={(v: any) =>
                                                    `₹${Number(v).toLocaleString()}`
                                                }
                                            />
                                            <Bar
                                                name="Monthly Balance"
                                                dataKey="balance"
                                                fill="#6366f1"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="glassmorphism">
                            <CardContent className="py-12 text-center text-muted-foreground text-sm">
                                Set your salary in Settings to see 12-month
                                forecasts.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* WARNINGS TAB */}
            {activeTab === "warnings" && (
                <div className="space-y-4">
                    {/* AI Risk Prevention Coach */}
                    <AIAnalysisCard
                        title="AI Risk Prevention Coach"
                        description="AI predicts upcoming financial risks and how to prevent them"
                        buttonLabel="Predict My Risks"
                        cacheKey="risk-prevention"
                        autoGenerate
                        prompt="Act as my early-warning financial risk coach. Analyze my data and predict: 1) Any EMI I might struggle to pay in the next 30 days and why, 2) Whether I'm at risk of running out of cash before month-end, 3) Signs of financial burnout or overspending in my patterns, 4) My single biggest financial danger right now, 5) Three specific preventive actions to take THIS WEEK. Be direct and protective, using my actual numbers."
                    />
                    {warnings.length > 0 ? (
                        warnings.map((w) => (
                            <Card
                                key={w.id}
                                className={`glassmorphism ${w.severity === "Critical" ? "border-red-500/30" : w.severity === "High" ? "border-orange-500/20" : "border-amber-500/20"}`}
                            >
                                <CardContent className="py-4 flex items-start gap-3">
                                    <div
                                        className={`p-2 rounded-lg shrink-0 ${w.severity === "Critical" ? "bg-red-500/10 text-red-500" : w.severity === "High" ? "bg-orange-500/10 text-orange-500" : "bg-amber-500/10 text-amber-500"}`}
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold">
                                                {w.title}
                                            </h4>
                                            <span
                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${w.severity === "Critical" ? "bg-red-500/20 text-red-500" : w.severity === "High" ? "bg-orange-500/20 text-orange-500" : "bg-amber-500/20 text-amber-500"}`}
                                            >
                                                {w.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {w.message}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="glassmorphism border-emerald-500/20">
                            <CardContent className="py-12 text-center">
                                <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-emerald-500/50" />
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    All Clear!
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    No financial warnings detected. Keep it up!
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

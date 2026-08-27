"use client";

import { useMemo } from "react";
import { useStore } from "@/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Lightbulb,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    ShieldCheck,
    Brain,
    Zap,
    Repeat,
    Sparkles,
} from "lucide-react";
import { AIAnalysisCard } from "@/components/ai-analysis-card";

export default function InsightsPage() {
    const { emis, user, expenses, goals } = useStore();

    const salary = user?.salary || 0;
    const activeEmis = useMemo(() => emis.filter((e) => e.status === "Active" && e.remaining_months > 0), [emis]);
    const totalEMI = activeEmis.reduce((sum, emi) => sum + emi.emi_amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlySavings = salary - totalEMI - totalExpenses;

    const insights = useMemo(() => {
        const tips: {
            id: number;
            type: string;
            title: string;
            description: string;
            icon: any;
            color: string;
            bg: string;
        }[] = [];
        let id = 0;

        const emiRatio = salary > 0 ? Math.round((totalEMI / salary) * 100) : 0;
        if (emiRatio > 50) {
            tips.push({
                id: ++id,
                type: "critical",
                title: "Critical EMI Burden",
                description: `Your EMI burden is ${emiRatio}% of monthly salary. Avoid taking new loans and consider prepayments.`,
                icon: AlertTriangle,
                color: "text-rose-400",
                bg: "bg-rose-500/15 border-rose-500/30",
            });
        } else if (emiRatio > 35) {
            tips.push({
                id: ++id,
                type: "warning",
                title: "High EMI Commitment",
                description: `EMIs consume ${emiRatio}% of your salary. Aim to keep obligations under 35% for safety.`,
                icon: AlertTriangle,
                color: "text-amber-400",
                bg: "bg-amber-500/15 border-amber-500/30",
            });
        } else if (emiRatio > 0) {
            tips.push({
                id: ++id,
                type: "positive",
                title: "Healthy EMI Ratio",
                description: `Your EMI burden is ${emiRatio}% — well within safe limits. You have healthy capacity for investments.`,
                icon: ShieldCheck,
                color: "text-emerald-400",
                bg: "bg-emerald-500/15 border-emerald-500/30",
            });
        }

        const savingsRate = salary > 0 ? Math.round((monthlySavings / salary) * 100) : 0;
        if (savingsRate >= 20) {
            tips.push({
                id: ++id,
                type: "positive",
                title: "Strong Capital Accumulation",
                description: `Saving ${savingsRate}% of income (₹${monthlySavings.toLocaleString()}/mo). Consider SIPs or fixed instruments.`,
                icon: TrendingUp,
                color: "text-emerald-400",
                bg: "bg-emerald-500/15 border-emerald-500/30",
            });
        } else if (savingsRate > 0) {
            tips.push({
                id: ++id,
                type: "info",
                title: "Savings Boost Potential",
                description: `Saving ${savingsRate}% is below the ideal 20%. Trimming ₹${Math.round(salary * 0.2 - monthlySavings).toLocaleString()}/mo from expenses reaches the benchmark.`,
                icon: Lightbulb,
                color: "text-cyan-400",
                bg: "bg-cyan-500/15 border-cyan-500/30",
            });
        }

        if (activeEmis.length > 0) {
            const soonest = [...activeEmis].sort((a, b) => a.remaining_months - b.remaining_months)[0];
            tips.push({
                id: ++id,
                type: "positive",
                title: "Upcoming Cash Flow Relief",
                description: `"${soonest.title}" concludes in ${soonest.remaining_months} months, freeing ₹${soonest.emi_amount.toLocaleString()}/mo for your disposable ledger.`,
                icon: TrendingDown,
                color: "text-indigo-400",
                bg: "bg-indigo-500/15 border-indigo-500/30",
            });
        }

        return tips;
    }, [activeEmis, salary, totalEMI, totalExpenses, monthlySavings]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-indigo-400" />
                    AI Intelligence & Deep Analysis
                </h2>
                <p className="text-sm text-slate-400">
                    Dual-language AI financial advisor analyzing your live transactions and debts in depth.
                </p>
            </div>

            {/* AI Deep Analysis Cards */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-violet-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Targeted AI Audits
                    </h3>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <AIAnalysisCard
                        title="Spending Optimizer"
                        description="Audit expense categories, identify hidden leaks, and trim unnecessary recurring items"
                        buttonLabel="Analyze My Spending"
                        cacheKey="spending-optimizer"
                        autoGenerate
                        prompt="Analyze my expense categories in detail. Identify: 1) Top spending leaks with exact rupee amounts, 2) Any recurring expenses to audit, 3) Realistically achievable monthly savings cuts. Give exact numbers."
                    />
                    <AIAnalysisCard
                        title="Savings Booster"
                        description="Personalized wealth strategy tailored to your exact net earnings"
                        buttonLabel="Boost My Savings"
                        cacheKey="savings-booster"
                        autoGenerate
                        prompt="Create a personalized savings strategy for me. Include: 1) Ideal monthly savings target, 2) Simple 50/30/20 budget split in rupee numbers, 3) 3 practical actions for this month."
                    />
                    <AIAnalysisCard
                        title="Risk & Vulnerability Assessment"
                        description="Identify financial risks and stress-test your monthly cash flow"
                        buttonLabel="Assess My Risks"
                        cacheKey="risk-assessment"
                        autoGenerate
                        prompt="Assess my financial risks. Identify: 1) Biggest vulnerability right now, 2) What happens if income pauses for 30 days, 3) Is my EMI load sustainable. Give constructive advice."
                    />
                    <AIAnalysisCard
                        title="Goal Acceleration Roadmap"
                        description="Actionable milestones to achieve your financial targets faster"
                        buttonLabel="Accelerate Goals"
                        cacheKey="goal-planner"
                        autoGenerate
                        prompt="Analyze my financial goals and tell me: 1) Are they realistic at my current savings rate, 2) Suggested monthly contribution per goal, 3) How to speed up deadlines."
                    />
                </div>
            </div>

            {/* Rule-based Instant Insights */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Real-Time Ledger Insights
                    </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {insights.map((insight) => (
                        <Card key={insight.id} className="glassmorphism border-white/[0.08] p-4">
                            <div className="flex items-start gap-3.5">
                                <div className={`p-2.5 rounded-xl border ${insight.bg} shrink-0`}>
                                    <insight.icon className={`h-5 w-5 ${insight.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-bold text-white">
                                        {insight.title}
                                    </CardTitle>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {insight.description}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

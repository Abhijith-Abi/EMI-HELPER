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
} from "lucide-react";
import { AIAnalysisCard } from "@/components/ai-analysis-card";

export default function InsightsPage() {
    const { emis, user, expenses, goals } = useStore();

    const salary = user?.salary || 0;
    const totalEMI = emis
        .filter((e) => e.status === "Active")
        .reduce((sum, emi) => sum + emi.emi_amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlySavings = salary - totalEMI - totalExpenses;

    // Smart insights generated from actual data
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

        // EMI burden
        const emiRatio = salary > 0 ? Math.round((totalEMI / salary) * 100) : 0;
        if (emiRatio > 50) {
            tips.push({
                id: ++id,
                type: "critical",
                title: "Critical EMI Burden",
                description: `Your EMI burden is ${emiRatio}% of salary. This is dangerously high. Avoid new loans and consider debt consolidation.`,
                icon: AlertTriangle,
                color: "text-red-500",
                bg: "bg-red-500/10",
            });
        } else if (emiRatio > 35) {
            tips.push({
                id: ++id,
                type: "warning",
                title: "High EMI Load",
                description: `EMIs consume ${emiRatio}% of your salary. Keep it below 35% for financial safety.`,
                icon: AlertTriangle,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
            });
        } else if (emiRatio > 0) {
            tips.push({
                id: ++id,
                type: "positive",
                title: "Healthy EMI Ratio",
                description: `Your EMI burden is only ${emiRatio}% — well within safe limits. You have room for investments.`,
                icon: ShieldCheck,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
            });
        }

        // Savings insight
        const savingsRate =
            salary > 0 ? Math.round((monthlySavings / salary) * 100) : 0;
        if (savingsRate >= 20) {
            tips.push({
                id: ++id,
                type: "positive",
                title: "Strong Savings",
                description: `You're saving ${savingsRate}% of income (₹${monthlySavings.toLocaleString()}/mo). Consider SIPs or FDs for wealth growth.`,
                icon: TrendingUp,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
            });
        } else if (savingsRate > 0) {
            tips.push({
                id: ++id,
                type: "info",
                title: "Improve Savings",
                description: `Saving ${savingsRate}% is below the ideal 20%. Cut ₹${Math.round(salary * 0.2 - monthlySavings).toLocaleString()}/mo from expenses to hit the target.`,
                icon: Lightbulb,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
            });
        } else {
            tips.push({
                id: ++id,
                type: "critical",
                title: "Zero Savings",
                description: `You're spending more than you earn. This is unsustainable. Enter emergency budget mode immediately.`,
                icon: Zap,
                color: "text-red-500",
                bg: "bg-red-500/10",
            });
        }

        // Debt reduction timeline
        const activeEmis = emis.filter((e) => e.status === "Active");
        if (activeEmis.length > 0) {
            const soonest = [...activeEmis].sort(
                (a, b) => a.remaining_months - b.remaining_months,
            )[0];
            tips.push({
                id: ++id,
                type: "positive",
                title: "Upcoming Relief",
                description: `"${soonest.title}" completes in ${soonest.remaining_months} months, freeing ₹${soonest.emi_amount.toLocaleString()}/month for savings or other goals.`,
                icon: TrendingDown,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
            });
        }

        // Expense category analysis
        const categoryTotals = expenses.reduce(
            (acc: Record<string, number>, e) => {
                acc[e.category] = (acc[e.category] || 0) + e.amount;
                return acc;
            },
            {},
        );
        const topCategory = Object.entries(categoryTotals).sort(
            (a, b) => b[1] - a[1],
        )[0];
        if (topCategory && salary > 0) {
            const pct = Math.round((topCategory[1] / salary) * 100);
            if (pct > 20) {
                tips.push({
                    id: ++id,
                    type: "warning",
                    title: `High ${topCategory[0]} Spending`,
                    description: `${topCategory[0]} expenses are ${pct}% of salary (₹${topCategory[1].toLocaleString()}). Set a strict budget for this category.`,
                    icon: AlertTriangle,
                    color: "text-amber-500",
                    bg: "bg-amber-500/10",
                });
            }
        }

        // Recurring expense detection
        const titleCounts = expenses.reduce(
            (acc: Record<string, number>, e) => {
                acc[e.title.toLowerCase()] =
                    (acc[e.title.toLowerCase()] || 0) + 1;
                return acc;
            },
            {},
        );
        const recurring = Object.entries(titleCounts).filter(
            ([, count]) => count >= 3,
        );
        if (recurring.length > 0) {
            tips.push({
                id: ++id,
                type: "info",
                title: "Recurring Expenses Detected",
                description: `Found ${recurring.length} recurring expense${recurring.length > 1 ? "s" : ""}: ${recurring
                    .slice(0, 3)
                    .map(([t]) => t)
                    .join(", ")}. Review if all are necessary.`,
                icon: Repeat,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
            });
        }

        // Goal feasibility
        if (goals.length > 0 && monthlySavings > 0) {
            const totalGoalGap = goals.reduce(
                (s, g) => s + (g.target_amount - g.saved_amount),
                0,
            );
            const monthsToGoals = Math.ceil(totalGoalGap / monthlySavings);
            tips.push({
                id: ++id,
                type: "info",
                title: "Goal Timeline",
                description: `At current savings rate, you'll reach all goals in ~${monthsToGoals} months. Increase savings by 10% to accelerate by ${Math.round(monthsToGoals * 0.1)} months.`,
                icon: Brain,
                color: "text-violet-500",
                bg: "bg-violet-500/10",
            });
        }

        return tips;
    }, [
        emis,
        expenses,
        salary,
        totalEMI,
        totalExpenses,
        monthlySavings,
        goals,
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    Smart Insights Engine
                </h2>
                <p className="text-muted-foreground">
                    AI-generated financial insights based on your real data.
                </p>
            </div>

            {/* AI Deep Analysis Section — TOP */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-5 w-5 text-violet-500" />
                    <h3 className="text-lg font-bold tracking-tight">
                        AI Deep Analysis
                    </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Let AI analyze specific areas of your finances in depth — in
                    English or മലയാളം.
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                    <AIAnalysisCard
                        title="Spending Optimizer"
                        description="Find hidden money leaks and waste in your expenses"
                        buttonLabel="Analyze My Spending"
                        cacheKey="spending-optimizer"
                        autoGenerate
                        prompt="Analyze my expense categories in detail. Identify: 1) My top 3 spending leaks with exact amounts, 2) Any recurring or subscription-like expenses I should review, 3) Specific categories where I'm overspending compared to ideal budgets, 4) How much I could realistically save per month by cutting waste. Give exact rupee amounts and be specific."
                    />
                    <AIAnalysisCard
                        title="Savings Booster"
                        description="A personalized plan to maximize your monthly savings"
                        buttonLabel="Boost My Savings"
                        cacheKey="savings-booster"
                        autoGenerate
                        prompt="Create a personalized savings strategy for me. Include: 1) My ideal monthly savings target based on my income, 2) A simple budget split (needs/wants/savings) with rupee amounts, 3) 3 specific actions to increase savings this month, 4) Where to park my savings (emergency fund, investments). Use my actual numbers and keep it practical."
                    />
                    <AIAnalysisCard
                        title="Risk Assessment"
                        description="Identify financial risks before they become problems"
                        buttonLabel="Assess My Risks"
                        cacheKey="risk-assessment"
                        autoGenerate
                        prompt="Assess my financial risks. Identify: 1) My biggest financial vulnerability right now, 2) What happens if I lose income for a month, 3) Whether my EMI burden is sustainable, 4) Early warning signs I should watch for, 5) 3 protective actions to take. Be honest but constructive with my actual data."
                    />
                    <AIAnalysisCard
                        title="Goal Planner"
                        description="A roadmap to achieve your financial goals faster"
                        buttonLabel="Plan My Goals"
                        cacheKey="goal-planner"
                        autoGenerate
                        prompt="Help me achieve my financial goals faster. Analyze my goals and: 1) Tell me if each goal is realistic with my current savings rate, 2) Suggest a monthly contribution for each goal, 3) Recommend which goal to prioritize, 4) Show how cutting expenses could speed up my goals. If I have no goals, suggest 3 important financial goals I should set. Use my actual numbers."
                    />
                </div>
            </div>

            {/* Quick rule-based insights */}
            <div>
                <h3 className="text-lg font-bold tracking-tight mb-1">
                    Quick Insights
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Instant analysis based on your numbers.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                    {insights.map((insight) => (
                        <Card key={insight.id} className="glassmorphism">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div
                                    className={`p-3 rounded-full ${insight.bg}`}
                                >
                                    <insight.icon
                                        className={`h-5 w-5 ${insight.color}`}
                                    />
                                </div>
                                <div>
                                    <CardTitle className="text-base">
                                        {insight.title}
                                    </CardTitle>
                                    <CardDescription className="text-[10px] uppercase tracking-wider mt-0.5">
                                        {insight.type}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {insight.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                    {insights.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">
                                Add your salary, EMIs, and expenses to generate
                                smart insights.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

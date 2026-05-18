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

            <div className="grid gap-4 md:grid-cols-2">
                {insights.map((insight) => (
                    <Card key={insight.id} className="glassmorphism">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className={`p-3 rounded-full ${insight.bg}`}>
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
    );
}

import { EMI, Expense, User, Goal } from "@/store";

export type RiskLevel = "Safe" | "Moderate" | "High Risk" | "Critical";
export type HealthCategory = "Excellent" | "Stable" | "Warning" | "Dangerous";

export interface StrategyResult {
    totalInterestPaid: number;
    totalMonths: number;
    payoffOrder: { title: string; paidOffMonth: number }[];
    monthlyData: { month: number; totalDebt: number }[];
}

export interface SurvivalAnalysis {
    daysRemaining: number;
    dailyLimit: number;
    weeklyLimit: number;
    survivalScore: number;
    salaryExhaustionDate: string;
    isEmergency: boolean;
}

export interface HealthScoreBreakdown {
    total: number;
    category: HealthCategory;
    savingsRatio: { score: number; value: number };
    emiRatio: { score: number; value: number };
    expenseStability: { score: number; value: number };
    debtLevel: { score: number; value: number };
    emergencyFund: { score: number; value: number };
}

export interface FinancialWarning {
    id: string;
    type: "overspending" | "emi_failure" | "cash_shortage" | "burnout";
    severity: "Low" | "Medium" | "High" | "Critical";
    title: string;
    message: string;
    amount?: number;
}

export interface AIInsight {
    type: "success" | "warning" | "info" | "danger";
    title: string;
    text: string;
}

export interface EMIPressure {
    id: string;
    title: string;
    emiAmount: number;
    interestRate: number;
    remainingMonths: number;
    pressureIndex: number;
}

// ============ RISK LEVEL ============
export function calculateRiskLevel(
    totalEmi: number,
    salary: number,
): RiskLevel {
    if (salary <= 0) return "Critical";
    const ratio = (totalEmi / salary) * 100;
    if (ratio < 30) return "Safe";
    if (ratio < 45) return "Moderate";
    if (ratio < 60) return "High Risk";
    return "Critical";
}

// ============ SURVIVAL ANALYSIS ============
export function calculateSurvival(
    salary: number,
    totalEmi: number,
    expenses: Expense[],
): SurvivalAnalysis {
    const now = new Date();
    const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
    ).getDate();
    const daysPassed = now.getDate();
    const daysLeft = daysInMonth - daysPassed;

    const currentMonthExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
        );
    });
    const spentSoFar = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
    const availableAfterEmi = salary - totalEmi;
    const remainingBudget = availableAfterEmi - spentSoFar;
    const dailyLimit =
        daysLeft > 0 ? Math.max(0, remainingBudget / daysLeft) : 0;
    const weeklyLimit = dailyLimit * 7;
    const avgDailySpend = daysPassed > 0 ? spentSoFar / daysPassed : 0;
    const daysRemaining =
        avgDailySpend > 0
            ? Math.floor(remainingBudget / avgDailySpend)
            : daysLeft;
    const survivalScore =
        availableAfterEmi > 0
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      Math.round((remainingBudget / availableAfterEmi) * 100),
                  ),
              )
            : 0;

    const exhaustDate = new Date();
    exhaustDate.setDate(exhaustDate.getDate() + Math.max(0, daysRemaining));

    return {
        daysRemaining: Math.max(0, daysRemaining),
        dailyLimit: Math.round(dailyLimit),
        weeklyLimit: Math.round(weeklyLimit),
        survivalScore,
        salaryExhaustionDate: exhaustDate.toISOString().split("T")[0],
        isEmergency: totalEmi > salary || remainingBudget < 0,
    };
}

// ============ HEALTH SCORE ============
export function calculateHealthScore(
    salary: number,
    totalEmi: number,
    totalExpenses: number,
    totalDebt: number,
    goals: Goal[],
): HealthScoreBreakdown {
    const monthlySavings = salary - totalEmi - totalExpenses;
    const savingsRatioValue = salary > 0 ? (monthlySavings / salary) * 100 : 0;
    const emiRatioValue = salary > 0 ? (totalEmi / salary) * 100 : 0;
    const expenseRatioValue = salary > 0 ? (totalExpenses / salary) * 100 : 0;
    const annualSalary = salary * 12;
    const debtRatio = annualSalary > 0 ? (totalDebt / annualSalary) * 100 : 100;

    const savingsScore = Math.min(25, Math.max(0, savingsRatioValue * 1.25));
    const emiScore = Math.min(25, Math.max(0, (100 - emiRatioValue) * 0.25));
    const expenseScore = Math.min(
        20,
        Math.max(0, (100 - expenseRatioValue) * 0.2),
    );
    const debtScore = Math.min(15, Math.max(0, (100 - debtRatio) * 0.15));

    const emergencyGoals = goals.filter(
        (g) =>
            g.title.toLowerCase().includes("emergency") ||
            g.title.toLowerCase().includes("fund"),
    );
    const emergencyProgress =
        emergencyGoals.length > 0
            ? emergencyGoals.reduce(
                  (s, g) => s + g.saved_amount / g.target_amount,
                  0,
              ) / emergencyGoals.length
            : monthlySavings > 0
              ? 0.3
              : 0;
    const emergencyScore = Math.min(15, emergencyProgress * 15);

    const total = Math.round(
        savingsScore + emiScore + expenseScore + debtScore + emergencyScore,
    );
    let category: HealthCategory = "Dangerous";
    if (total >= 80) category = "Excellent";
    else if (total >= 60) category = "Stable";
    else if (total >= 40) category = "Warning";

    return {
        total,
        category,
        savingsRatio: {
            score: Math.round(savingsScore),
            value: Math.round(savingsRatioValue),
        },
        emiRatio: {
            score: Math.round(emiScore),
            value: Math.round(emiRatioValue),
        },
        expenseStability: {
            score: Math.round(expenseScore),
            value: Math.round(expenseRatioValue),
        },
        debtLevel: {
            score: Math.round(debtScore),
            value: Math.round(debtRatio),
        },
        emergencyFund: {
            score: Math.round(emergencyScore),
            value: Math.round(emergencyProgress * 100),
        },
    };
}

// ============ SNOWBALL VS AVALANCHE ============
// Snowball: pay off smallest BALANCE first
export function calculateSnowball(
    emis: EMI[],
    extraPayment: number = 0,
): StrategyResult {
    const active = emis.filter((e) => e.status === "Active");
    if (active.length === 0)
        return {
            totalInterestPaid: 0,
            totalMonths: 0,
            payoffOrder: [],
            monthlyData: [],
        };

    // Sort by remaining balance (smallest first)
    const sorted = [...active].sort((a, b) => {
        const balA = a.emi_amount * a.remaining_months;
        const balB = b.emi_amount * b.remaining_months;
        return balA - balB;
    });
    return simulatePayoff(sorted, extraPayment);
}

// Avalanche: pay off highest INTEREST RATE first
export function calculateAvalanche(
    emis: EMI[],
    extraPayment: number = 0,
): StrategyResult {
    const active = emis.filter((e) => e.status === "Active");
    if (active.length === 0)
        return {
            totalInterestPaid: 0,
            totalMonths: 0,
            payoffOrder: [],
            monthlyData: [],
        };

    // Sort by interest rate (highest first)
    const sorted = [...active].sort(
        (a, b) => b.interest_rate - a.interest_rate,
    );
    return simulatePayoff(sorted, extraPayment);
}

function simulatePayoff(
    sortedEmis: EMI[],
    extraPayment: number,
): StrategyResult {
    // Each loan has remaining_months of payments at emi_amount.
    // The outstanding principal can be approximated. For simplicity and correctness,
    // we simulate month-by-month: each loan reduces by (payment - interest) per month.
    // Since EMI already includes interest, we track remaining_months as the baseline.

    const loans = sortedEmis.map((e) => ({
        title: e.title,
        remainingMonths: e.remaining_months,
        minPayment: e.emi_amount,
        interestRate: e.interest_rate,
        // Calculate actual outstanding principal using annuity formula
        balance:
            e.interest_rate > 0
                ? (e.emi_amount *
                      (1 -
                          Math.pow(
                              1 + e.interest_rate / 100 / 12,
                              -e.remaining_months,
                          ))) /
                  (e.interest_rate / 100 / 12)
                : e.emi_amount * e.remaining_months,
        monthlyRate: e.interest_rate / 100 / 12,
        paid: false,
    }));

    let month = 0;
    let totalInterest = 0;
    const payoffOrder: { title: string; paidOffMonth: number }[] = [];
    const monthlyData: { month: number; totalDebt: number }[] = [
        {
            month: 0,
            totalDebt: Math.round(loans.reduce((s, l) => s + l.balance, 0)),
        },
    ];
    let extraFromPaidOff = 0;

    while (loans.some((l) => !l.paid && l.balance > 0) && month < 600) {
        month++;

        // Find the first unpaid loan in priority order (target for extra payments)
        const targetIdx = loans.findIndex((l) => !l.paid && l.balance > 0);

        for (let i = 0; i < loans.length; i++) {
            if (loans[i].paid || loans[i].balance <= 0) continue;

            // Calculate interest for this month
            const interest = loans[i].balance * loans[i].monthlyRate;
            totalInterest += interest;
            loans[i].balance += interest;

            // Apply payment: minimum EMI for all, extra goes to target
            let payment = loans[i].minPayment;
            if (i === targetIdx) {
                payment += extraPayment + extraFromPaidOff;
            }

            loans[i].balance -= payment;

            // Check if paid off
            if (loans[i].balance <= 0) {
                loans[i].balance = 0;
                loans[i].paid = true;
                payoffOrder.push({
                    title: loans[i].title,
                    paidOffMonth: month,
                });
                extraFromPaidOff += loans[i].minPayment;
            }
        }

        // Record data for chart
        const totalDebt = loans.reduce((s, l) => s + Math.max(0, l.balance), 0);
        monthlyData.push({ month, totalDebt: Math.round(totalDebt) });

        if (totalDebt <= 0) break;
    }

    return {
        totalInterestPaid: Math.round(totalInterest),
        totalMonths: month,
        payoffOrder,
        monthlyData,
    };
}

// ============ EMI PRESSURE ============
export function calculateEMIPressure(
    emis: EMI[],
    salary: number,
): EMIPressure[] {
    return emis
        .filter((e) => e.status === "Active")
        .map((emi) => {
            const pressureIndex =
                salary > 0
                    ? Math.round(
                          (emi.emi_amount / salary) * 50 +
                              (emi.interest_rate / 20) * 30 +
                              (emi.remaining_months / 60) * 20,
                      )
                    : 100;
            return {
                id: emi.id,
                title: emi.title,
                emiAmount: emi.emi_amount,
                interestRate: emi.interest_rate,
                remainingMonths: emi.remaining_months,
                pressureIndex: Math.min(100, pressureIndex),
            };
        })
        .sort((a, b) => b.pressureIndex - a.pressureIndex);
}

// ============ PREDICTIVE WARNINGS ============
export function generateWarnings(
    salary: number,
    totalEmi: number,
    expenses: Expense[],
    emis: EMI[],
): FinancialWarning[] {
    const warnings: FinancialWarning[] = [];
    const now = new Date();
    const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
    ).getDate();
    const daysPassed = now.getDate();
    const daysLeft = daysInMonth - daysPassed;

    const currentMonthExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
        );
    });
    const spentSoFar = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
    const avgDaily = daysPassed > 0 ? spentSoFar / daysPassed : 0;
    const projectedTotal = avgDaily * daysInMonth;
    const available = salary - totalEmi;

    if (projectedTotal > available && available > 0) {
        const shortfall = Math.round(projectedTotal - available);
        warnings.push({
            id: "overspend-" + now.getMonth(),
            type: "overspending",
            severity: shortfall > available * 0.3 ? "High" : "Medium",
            title: "Overspending Projected",
            message: `At current rate, you'll overspend by ₹${shortfall.toLocaleString()} this month.`,
            amount: shortfall,
        });
    }

    emis.filter((e) => e.status === "Active").forEach((emi) => {
        const dueDate = new Date(emi.due_date);
        const daysUntilDue = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntilDue > 0 && daysUntilDue <= 7) {
            const projectedBalance =
                available - spentSoFar - avgDaily * daysUntilDue;
            if (projectedBalance < emi.emi_amount) {
                warnings.push({
                    id: `emi-fail-${emi.id}`,
                    type: "emi_failure",
                    severity: "Critical",
                    title: `EMI at Risk: ${emi.title}`,
                    message: `₹${emi.emi_amount.toLocaleString()} due in ${daysUntilDue} days but projected balance is ₹${Math.max(0, Math.round(projectedBalance)).toLocaleString()}.`,
                    amount: emi.emi_amount,
                });
            }
        }
    });

    const remainingBudget = available - spentSoFar;
    if (remainingBudget < avgDaily * daysLeft && daysLeft > 5 && avgDaily > 0) {
        warnings.push({
            id: "cash-short-" + now.getMonth(),
            type: "cash_shortage",
            severity: remainingBudget < 0 ? "Critical" : "High",
            title: "Cash Shortage Warning",
            message: `Only ₹${Math.max(0, Math.round(remainingBudget)).toLocaleString()} left for ${daysLeft} days.`,
            amount: Math.round(remainingBudget),
        });
    }

    return warnings.sort((a, b) => {
        const sev = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (sev[b.severity] || 0) - (sev[a.severity] || 0);
    });
}

// ============ AI INSIGHTS ============
export function generateAIInsights(
    salary: number,
    totalEmi: number,
    totalExpenses: number,
    emis: EMI[],
    maxRemainingMonths: number,
): AIInsight[] {
    const insights: AIInsight[] = [];
    const monthlySavings = salary - totalEmi - totalExpenses;
    const activeEmis = emis.filter((e) => e.status === "Active");

    if (maxRemainingMonths > 0) {
        const debtFreeDate = new Date();
        debtFreeDate.setMonth(debtFreeDate.getMonth() + maxRemainingMonths);
        insights.push({
            type: "info",
            title: "Debt-Free Prediction",
            text: `You will become debt-free in ${maxRemainingMonths} months (${debtFreeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}).`,
        });
    }

    if (activeEmis.length > 0) {
        const soonest = [...activeEmis].sort(
            (a, b) => a.remaining_months - b.remaining_months,
        )[0];
        if (soonest) {
            insights.push({
                type: "success",
                title: "Pressure Relief Coming",
                text: `Financial pressure reduces after Month ${soonest.remaining_months} when "${soonest.title}" is paid off, freeing ₹${soonest.emi_amount.toLocaleString()}/month.`,
            });
        }
    }

    if (monthlySavings > 3000 && activeEmis.length > 0) {
        const extraAmount = Math.round(monthlySavings * 0.3);
        insights.push({
            type: "info",
            title: "Accelerate Recovery",
            text: `Adding ₹${extraAmount.toLocaleString()}/month extra toward debt can significantly shorten your payoff timeline.`,
        });
    }

    const riskLevel = calculateRiskLevel(totalEmi, salary);
    if (riskLevel === "Critical" || riskLevel === "High Risk") {
        insights.push({
            type: "danger",
            title: "High Risk Alert",
            text: `EMI ratio is ${Math.round((totalEmi / (salary || 1)) * 100)}% of salary. Avoid new loans and focus on highest-interest debt.`,
        });
    }

    return insights;
}

// ============ 12-MONTH FORECAST ============
export function generate12MonthForecast(
    salary: number,
    totalEmi: number,
    avgMonthlyExpenses: number,
    emis: EMI[],
): { month: string; balance: number; savings: number; debt: number }[] {
    if (salary <= 0) return [];

    const data: {
        month: string;
        balance: number;
        savings: number;
        debt: number;
    }[] = [];
    let cumulativeSavings = 0;

    // Track each EMI's remaining months individually
    const emiTrackers = emis
        .filter((e) => e.status === "Active")
        .map((e) => ({
            amount: e.emi_amount,
            monthsLeft: e.remaining_months,
        }));

    // Calculate initial total debt
    let totalDebt = emiTrackers.reduce(
        (s, e) => s + e.amount * e.monthsLeft,
        0,
    );

    for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const label = date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
        });

        // Calculate current month's EMI total (only EMIs still active)
        let currentMonthEmi = 0;
        emiTrackers.forEach((emi) => {
            if (emi.monthsLeft > 0) {
                currentMonthEmi += emi.amount;
                emi.monthsLeft--;
            }
        });

        // Reduce total debt by this month's EMI payments
        totalDebt = Math.max(0, totalDebt - currentMonthEmi);

        // Monthly net balance
        const monthlyNet = salary - currentMonthEmi - avgMonthlyExpenses;
        cumulativeSavings += Math.max(0, monthlyNet);

        data.push({
            month: label,
            balance: Math.round(monthlyNet),
            savings: Math.round(cumulativeSavings),
            debt: Math.round(totalDebt),
        });
    }

    return data;
}

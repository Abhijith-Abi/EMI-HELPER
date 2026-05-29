import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

interface FinancialContext {
    salary: number;
    emis: any[];
    expenses: any[];
    goals: any[];
}

function buildSystemPrompt(ctx: FinancialContext): string {
    const totalEmi = ctx.emis
        .filter((e: any) => e.status === "Active")
        .reduce((s: number, e: any) => s + e.emi_amount, 0);
    const totalExpenses = ctx.expenses.reduce(
        (s: number, e: any) => s + e.amount,
        0,
    );
    const savings = ctx.salary - totalEmi - totalExpenses;
    const totalDebt = ctx.emis
        .filter((e: any) => e.status === "Active")
        .reduce(
            (s: number, e: any) => s + e.emi_amount * e.remaining_months,
            0,
        );

    const emiList =
        ctx.emis
            .filter((e: any) => e.status === "Active")
            .map(
                (e: any) =>
                    `- ${e.title}: ₹${e.emi_amount}/mo, ${e.interest_rate}% interest, ${e.remaining_months} months left, due ${e.due_date}`,
            )
            .join("\n") || "None";

    const expenseSummary = (() => {
        const byCat: Record<string, number> = {};
        ctx.expenses.forEach((e: any) => {
            byCat[e.category] = (byCat[e.category] || 0) + e.amount;
        });
        return (
            Object.entries(byCat)
                .map(([c, a]) => `- ${c}: ₹${a}`)
                .join("\n") || "None"
        );
    })();

    const goalList =
        ctx.goals
            .map(
                (g: any) =>
                    `- ${g.title}: ₹${g.saved_amount}/₹${g.target_amount} saved, deadline ${g.deadline}`,
            )
            .join("\n") || "None";

    return `You are an expert personal financial advisor and debt recovery coach for an Indian user. You give practical, specific, actionable advice in Indian Rupees (₹). Be warm, encouraging but honest. Keep responses concise (under 200 words unless asked for detail). Use simple language. Focus on real recovery, saving money, and reducing debt stress.

USER'S CURRENT FINANCIAL DATA:
Monthly Salary: ₹${ctx.salary.toLocaleString()}
Total Monthly EMI: ₹${totalEmi.toLocaleString()} (${ctx.salary > 0 ? Math.round((totalEmi / ctx.salary) * 100) : 0}% of salary)
Total Monthly Expenses: ₹${totalExpenses.toLocaleString()}
Monthly Savings: ₹${savings.toLocaleString()}
Total Outstanding Debt: ₹${totalDebt.toLocaleString()}

ACTIVE LOANS:
${emiList}

EXPENSES BY CATEGORY:
${expenseSummary}

SAVINGS GOALS:
${goalList}

When giving advice, reference the user's ACTUAL numbers. Suggest specific amounts to save, which loans to prioritize, and where to cut spending. Use the Avalanche method (highest interest first) for debt advice. Format with short paragraphs or bullet points. Always end with one encouraging sentence.`;
}

function languageInstruction(lang: string): string {
    if (lang === "english") {
        return "\n\nIMPORTANT: Respond in clear, simple English.";
    }
    return "\n\nVERY IMPORTANT: Respond ENTIRELY in SIMPLE, everyday Malayalam (മലയാളം) using Malayalam script. Use easy, common words that ordinary people use in daily conversation — avoid difficult or literary Malayalam. Keep the currency symbol ₹ and all numbers in digits. Common financial/technical terms (EMI, salary, loan, etc.) may stay in English where that is how people normally say them. Write everything else in warm, simple, conversational Malayalam that anyone can easily understand.";
}

export async function POST(request: Request) {
    try {
        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured" },
                { status: 500 },
            );
        }

        const { messages, context, language } = await request.json();

        const systemPrompt =
            buildSystemPrompt(
                context || { salary: 0, emis: [], expenses: [], goals: [] },
            ) + languageInstruction(language || "malayalam");

        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages,
                ],
                temperature: 0.7,
                max_tokens: 800,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("[Groq API Error]", errText);
            return NextResponse.json(
                { error: "AI request failed" },
                { status: 502 },
            );
        }

        const data = await response.json();
        const reply =
            data.choices?.[0]?.message?.content ||
            "I couldn't generate a response. Please try again.";

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("[AI Route Error]", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}

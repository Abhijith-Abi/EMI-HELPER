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
        .filter((e: any) => e.status === "Active" && e.remaining_months > 0)
        .reduce((s: number, e: any) => s + e.emi_amount, 0);
    const totalExpenses = ctx.expenses.reduce(
        (s: number, e: any) => s + e.amount,
        0,
    );
    const savings = ctx.salary - totalEmi - totalExpenses;
    const totalDebt = ctx.emis
        .filter((e: any) => e.status === "Active" && e.remaining_months > 0)
        .reduce(
            (s: number, e: any) => s + e.emi_amount * e.remaining_months,
            0,
        );

    const emiList =
        ctx.emis
            .filter((e: any) => e.status === "Active" && e.remaining_months > 0)
            .map(
                (e: any) =>
                    `- ${e.title}: ₹${e.emi_amount.toLocaleString()}/mo, ${e.interest_rate}% interest, ${e.remaining_months} months left, due ${e.due_date}`,
            )
            .join("\n") || "None";

    const expenseSummary = (() => {
        const byCat: Record<string, number> = {};
        ctx.expenses.forEach((e: any) => {
            byCat[e.category] = (byCat[e.category] || 0) + e.amount;
        });
        return (
            Object.entries(byCat)
                .map(([c, a]) => `- ${c}: ₹${a.toLocaleString()}`)
                .join("\n") || "None"
        );
    })();

    const goalList =
        ctx.goals
            .map(
                (g: any) =>
                    `- ${g.title}: ₹${g.saved_amount.toLocaleString()}/₹${g.target_amount.toLocaleString()} saved, deadline ${g.deadline}`,
            )
            .join("\n") || "None";

    return `You are Cash ERP's expert personal financial advisor and debt recovery coach for an Indian user. You give practical, specific, actionable advice in Indian Rupees (₹). Be warm, encouraging and analytical. Keep responses concise (under 200 words unless asked for detail).

USER'S CURRENT FINANCIAL DATA:
Monthly Salary: ₹${ctx.salary.toLocaleString()}
Total Monthly EMI: ₹${totalEmi.toLocaleString()} (${ctx.salary > 0 ? Math.round((totalEmi / ctx.salary) * 100) : 0}% of salary)
Total Monthly Expenses: ₹${totalExpenses.toLocaleString()}
Monthly Surplus / Savings: ₹${savings.toLocaleString()}
Total Outstanding Debt Liability: ₹${totalDebt.toLocaleString()}

ACTIVE LOANS:
${emiList}

EXPENSES BY CATEGORY:
${expenseSummary}

SAVINGS GOALS:
${goalList}

Reference the user's EXACT rupee numbers. Suggest specific amounts to save, which loans to prioritize (Avalanche method), and where to cut spending. Format with clean bullet points.`;
}

function languageInstruction(lang: string): string {
    if (lang === "english") {
        return "\n\nIMPORTANT: Respond in clear, simple English.";
    }
    return "\n\nVERY IMPORTANT: Respond ENTIRELY in NATURAL, CONVERSATIONAL MALAYALAM (മലയാളം) using Malayalam script. Use warm, simple, everyday conversational words (ലളിതമായ മലയാളം). Keep ₹ and digit numbers clear. Make it actionable and encouraging.";
}

// Deep, authentic Malayalam & English financial advice fallback generator
function generateIntelligentFallback(
    userPrompt: string,
    ctx: FinancialContext,
    language: "english" | "malayalam",
): string {
    const salary = ctx.salary || 0;
    const activeEmis = (ctx.emis || []).filter((e: any) => e.status === "Active" && e.remaining_months > 0);
    const totalEmi = activeEmis.reduce((s: number, e: any) => s + e.emi_amount, 0);
    const totalExp = (ctx.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
    const surplus = salary - totalEmi - totalExp;
    const totalDebt = activeEmis.reduce((s: number, e: any) => s + e.emi_amount * e.remaining_months, 0);
    const emiRatio = salary > 0 ? Math.round((totalEmi / salary) * 100) : 0;

    const sortedByInterest = [...activeEmis].sort((a: any, b: any) => b.interest_rate - a.interest_rate);
    const topLoan = sortedByInterest[0] || null;

    const catTotals: Record<string, number> = {};
    (ctx.expenses || []).forEach((e: any) => {
        catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    const pLower = userPrompt.toLowerCase();

    // 1. DAILY BRIEFING / പ്രഭാത സാമ്പത്തിക വിവരണം
    if (pLower.includes("daily") || pLower.includes("briefing") || pLower.includes("morning") || pLower.includes("ഇന്നത്തെ") || pLower.includes("പ്രഭാത")) {
        if (language === "malayalam") {
            return `🌅 **ഇന്നത്തെ AI സാമ്പത്തിക വിവരണം:**
• **വരുമാനവും ബാധ്യതയും:** മാസ ശമ്പളം ₹${salary.toLocaleString()} ൽ ₹${totalEmi.toLocaleString()} (${emiRatio}%) ലോൺ തിരിച്ചടവിലേക്ക് പോകുന്നു.
• **പ്രധാന മുൻഗണന:** ${topLoan ? `ഏറ്റവും കൂടുതൽ പലിശയുള്ള "${topLoan.title}" (${topLoan.interest_rate}% പലിശ) ലോൺ ആദ്യം തീർക്കാൻ ശ്രദ്ധിക്കുക.` : "പുതിയ ലോണുകൾ ഒഴിവാക്കി നിലവിലെ സേവിംഗ്സ് വർദ്ധിപ്പിക്കുക."}
• **മാസ മിച്ചം:** എല്ലാ ചെലവുകൾക്കും ശേഷം ബാക്കി ലഭിക്കുന്നത് ₹${Math.max(0, surplus).toLocaleString()}.
• **ദിവസേനയുള്ള പരിധി:** ദിവസം ₹${Math.max(0, Math.round(surplus / 30)).toLocaleString()} ൽ താഴെ മാത്രം ചെലവാക്കാൻ ശ്രദ്ധിക്കുക.`;
        }
        return `📊 **Today's Financial Summary:**
• **Cash Flow Health:** Monthly earnings ₹${salary.toLocaleString()} with active EMI obligations of ₹${totalEmi.toLocaleString()} (${emiRatio}% of salary).
• **Core Focus:** ${topLoan ? `Target "${topLoan.title}" (${topLoan.interest_rate}% interest) as top payoff priority.` : "Control discretionary daily spends to build capital."}
• **Daily Safe Limit:** You have ₹${Math.max(0, surplus).toLocaleString()} surplus. Keep daily discretionary spend under ₹${Math.max(0, Math.round(surplus / 30)).toLocaleString()}.`;
    }

    // 2. WHICH LOAN TO PAY FIRST / ഏത് ലോൺ ആദ്യം അടക്കണം?
    if (pLower.includes("first") || pLower.includes("which loan") || pLower.includes("ആദ്യം") || pLower.includes("തീർക്കണം")) {
        if (language === "malayalam") {
            if (activeEmis.length === 0) {
                return `🎉 **അഭിനന്ദനങ്ങൾ!** നിങ്ങൾക്ക് നിലവിൽ സജീവമായ ലോണുകളോ ബാധ്യതകളോ ഇല്ല. ഈ അവസരം ഉപയോഗിച്ച് ഒരു എമർജൻസി ഫണ്ട് നിർമ്മിക്കുക.`;
            }
            return `🎯 **ആദ്യം അടച്ചുതീർക്കേണ്ട ലോൺ (Avalanche Method):**
1. **ഒന്നാം മുൻഗണന:** **"${topLoan.title}"** (പലിശ: **${topLoan.interest_rate}%**, മാസ EMI: ₹${topLoan.emi_amount.toLocaleString()})
   • **കാരണം:** ഏറ്റവും ഉയർന്ന പലിശയുള്ള ലോൺ ആദ്യം തീർക്കുമ്പോഴാണ് ഏറ്റവും കൂടുതൽ പണം പലിശയിനത്തിൽ ലാഭിക്കാൻ കഴിയുന്നത്.
2. **തുടർന്ന് അടക്കേണ്ട ക്രമം:**
${sortedByInterest.map((l, i) => `   ${i + 1}. ${l.title} (${l.interest_rate}% പലിശ, ബാക്കി: ${l.remaining_months} മാസങ്ങൾ)`).join("\n")}
3. **തന്ത്രം:** എല്ലാ ലോണുകൾക്കും മിനിമം EMI കൃത്യമായി അടയ്ക്കുക, ബാക്കി ലഭിക്കുന്ന അധിക തുക "${topLoan.title}" ലേക്ക് പ്രീപെയ്‌മെന്റായി നൽകുക.`;
        }
        return `🎯 **Optimal Loan Payoff Priority (Avalanche Method):**
1. **Top Target:** **"${topLoan?.title}"** (${topLoan?.interest_rate}% interest, ₹${topLoan?.emi_amount.toLocaleString()}/mo).
   • **Rationale:** Paying off highest-interest debt first saves you the maximum money on compounding interest.
2. **Follow-up Sequence:**
${sortedByInterest.map((l, i) => `   ${i + 1}. ${l.title} (${l.interest_rate}% interest, ${l.remaining_months} months left)`).join("\n")}
3. **Action:** Pay minimum on all active loans, and channel surplus prepayments directly into "${topLoan?.title}".`;
    }

    // 3. HOW TO BECOME DEBT-FREE FASTER / എങ്ങനെ വേഗം കടം തീർക്കാം?
    if (pLower.includes("faster") || pLower.includes("debt-free") || pLower.includes("വേഗം") || pLower.includes("കടം തീർക്കാം") || pLower.includes("റിക്കവറി")) {
        if (language === "malayalam") {
            return `🚀 **വേഗത്തിൽ കടം തീർക്കാനുള്ള 4 വഴികൾ:**
1. **അധിക തുക തിരിച്ചടവ്:** മാസം ₹${Math.round(salary * 0.08 || 2000).toLocaleString()} അധികമായി ${topLoan ? `"${topLoan.title}"` : "ലോണുകളിൽ"} അടച്ചാൽ നിങ്ങളുടെ ലോൺ കാലാവധി 4 മുതൽ 6 മാസം വരെ കുറയ്ക്കാം.
2. **അനാവശ്യ ചെലവുകൾ കുറയ്ക്കുക:** ${topCat ? `${topCat[0]} വിഭാഗത്തിലെ ചെലവുകളിൽ ₹${Math.round(topCat[1] * 0.25).toLocaleString()} കുറച്ച്` : "ചെലവുകൾ കുറച്ച്"} ആ തുക ലോണിലേക്ക് മാറ്റുക.
3. **സ്നോബോൾ / അവലാഞ്ച് തന്ത്രം:** ഉയർന്ന പലിശയുള്ള ലോണുകൾ ഓരോന്നായി അടച്ചുതീർത്ത് വരുന്ന തുക അടുത്ത ലോണിലേക്ക് ചേർക്കുക.
4. **പുതിയ കടങ്ങൾ ഒഴിവാക്കുക:** ക്രെഡിറ്റ് കാർഡ് EMI കളും പേഴ്സണൽ ലോണുകളും പൂർണ്ണമായും ഒഴിവാക്കുക.`;
        }
        return `🚀 **4-Step Accelerated Debt Elimination Plan:**
1. **Extra Prepayment Boost:** Allocating an extra ₹${Math.round(salary * 0.08 || 2000).toLocaleString()}/month toward ${topLoan ? `"${topLoan.title}"` : "your highest-rate loan"} shaves months off your payoff horizon.
2. **Trim Leak Categories:** ${topCat ? `Cut 25% from ${topCat[0]} (saving ~₹${Math.round(topCat[1] * 0.25).toLocaleString()}/mo)` : "Reduce discretionary purchases"} and redirect funds straight to debt reduction.
3. **Avalanche Paydown:** Clear high-interest loans sequentially to minimize interest drain.
4. **Debt Freeze:** Strictly avoid new credit card EMIs until liabilities are cleared.`;
    }

    // 4. SPENDING LEAKS / എവിടെയാണ് പണം പാഴാകുന്നത്?
    if (pLower.includes("spend") || pLower.includes("leak") || pLower.includes("waste") || pLower.includes("പാഴാ") || pLower.includes("ചെലവ്")) {
        if (language === "malayalam") {
            return `💡 **പണം ചോരുന്ന വഴികളും പരിഹാരങ്ങളും:**
1. **ഏറ്റവും വലിയ ചെലവ് വിഭാഗം:** ${topCat ? `**${topCat[0]}** (ആകെ ₹${topCat[1].toLocaleString()} ചെലവഴിച്ചു). ഇതിൽ ചെറിയ ശ്രദ്ധ പുലർത്തിയാൽ മാസം ₹${Math.round(topCat[1] * 0.2).toLocaleString()} എളുപ്പത്തിൽ ലാഭിക്കാം.` : "പുറത്തുനിന്നുള്ള ഭക്ഷണവും പലചരക്ക് ചെലവുകളും."}
2. **EMI ബാധ്യത:** മാസവരുമാനത്തിന്റെ ${emiRatio}% (₹${totalEmi.toLocaleString()}) ലോണുകളിലേക്ക് പോകുന്നു.
3. **നിർദ്ദേശം:** ഒരു മാസത്തെ ചെലവ് ബജറ്റ് നിശ്ചയിച്ച് ദിവസേനയുള്ള അനാവശ്യ ചെലവുകൾ ഒഴിവാക്കുക.`;
        }
        return `💡 **Spending Leaks & Optimization:**
1. **Highest Spending Sector:** ${topCat ? `**${topCat[0]}** (₹${topCat[1].toLocaleString()}). Trimming 20% saves ₹${Math.round(topCat[1] * 0.2).toLocaleString()}/month.` : "Dining out and impulse online orders."}
2. **Fixed EMI Drain:** EMIs consume ${emiRatio}% of your net earnings (₹${totalEmi.toLocaleString()}).
3. **Recommendation:** Establish category limits and track daily spends to avoid month-end deficits.`;
    }

    // 5. SAVINGS TARGET / എത്ര രൂപ സേവ് ചെയ്യണം?
    if (pLower.includes("saving") || pLower.includes("save") || pLower.includes("സേവ്") || pLower.includes("സമ്പാദ്യം") || pLower.includes("നിക്ഷേപം")) {
        if (language === "malayalam") {
            return `💰 **നിങ്ങളുടെ അനുയോജ്യമായ സമ്പാദ്യ പ്ലാൻ (50/30/20 Budget):**
1. **മാസ സേവിംഗ്സ് ലക്ഷ്യം:** വരുമാനത്തിന്റെ 20% (₹${Math.round(salary * 0.2).toLocaleString()})
2. **ബജറ്റ് കണക്കുകൂട്ടൽ:**
   • അത്യാവശ്യങ്ങൾ & EMI: ₹${Math.round(salary * 0.55).toLocaleString()}
   • ആഗ്രഹങ്ങൾ & വിനോദം: ₹${Math.round(salary * 0.25).toLocaleString()}
   • സമ്പാദ്യം / സേവിംഗ്സ്: ₹${Math.round(salary * 0.2).toLocaleString()}
3. **നിലവിലെ മാസ മിച്ചം:** നിങ്ങൾക്ക് ഇപ്പോൾ ₹${Math.max(0, surplus).toLocaleString()} മിച്ചമുണ്ട്. ഇത് എമർജൻസി ഫണ്ടിലേക്കോ ഗോൾ ടാർഗെറ്റുകളിലേക്കോ നിക്ഷേപിക്കുക.`;
        }
        return `💰 **Personalized 50/30/20 Savings Strategy:**
1. **Recommended Monthly Savings Target:** ₹${Math.round(salary * 0.2).toLocaleString()} (20% of net income).
2. **Budget Allocation:**
   • Essential Living & EMIs (50-55%): ₹${Math.round(salary * 0.55).toLocaleString()}
   • Discretionary Wants (25%): ₹${Math.round(salary * 0.25).toLocaleString()}
   • Savings & Prepayment (20%): ₹${Math.round(salary * 0.2).toLocaleString()}
3. **Current Available Surplus:** You generate ₹${Math.max(0, surplus).toLocaleString()}/month after active commitments.`;
    }

    // 6. DEFAULT / ALL OTHER QUESTIONS
    if (language === "malayalam") {
        return `📊 **നിങ്ങളുടെ സാമ്പത്തിക സ്ഥിതിവിവരക്കണക്ക്:**
• **മാസ വരുമാനം:** ₹${salary.toLocaleString()}
• **സജീവ EMI കൾ:** ₹${totalEmi.toLocaleString()} (${emiRatio}% ശമ്പള വിഹിതം)
• **ആകെ ബാക്കി കടം:** ₹${totalDebt.toLocaleString()}
• **മാസ മിച്ചം:** ₹${surplus.toLocaleString()}
${topLoan ? `• **ശ്രദ്ധിക്കേണ്ട ലോൺ:** "${topLoan.title}" (${topLoan.interest_rate}% പലിശ)` : ""}

നിങ്ങൾക്ക് കടം കുറയ്ക്കാനോ, ചെലവുകൾ നിയന്ത്രിക്കാനോ, പുതിയ ഗോൾ നിശ്ചയിക്കാനോ സംശയങ്ങൾ ഉണ്ടെങ്കിൽ ചോദിക്കൂ, സഹായിക്കാം!`;
    }

    return `📊 **Financial Snapshot & Advisor Guidance:**
• **Monthly Earnings:** ₹${salary.toLocaleString()}
• **Active Loan Obligations:** ₹${totalEmi.toLocaleString()} (${emiRatio}% of salary)
• **Total Outstanding Debt:** ₹${totalDebt.toLocaleString()}
• **Monthly Cash Surplus:** ₹${surplus.toLocaleString()}
${topLoan ? `• **Priority Payoff Loan:** "${topLoan.title}" (${topLoan.interest_rate}% interest)` : ""}

Feel free to ask any specific questions about debt elimination, budget optimization, or savings targets!`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messages, context, language } = body;
        const userMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
        const lang = language === "malayalam" ? "malayalam" : "english";
        const ctx: FinancialContext = context || { salary: 0, emis: [], expenses: [], goals: [] };

        // If Groq key is available, attempt remote LLM call with short timeout
        if (GROQ_API_KEY) {
            try {
                const systemPrompt = buildSystemPrompt(ctx) + languageInstruction(lang);
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
                    signal: AbortSignal.timeout(6000),
                });

                if (response.ok) {
                    const data = await response.json();
                    const reply = data.choices?.[0]?.message?.content;
                    if (reply) {
                        return NextResponse.json({ reply });
                    }
                }
            } catch (groqErr) {
                console.warn("[Groq LLM Request Failed - Falling back to intelligent engine]:", groqErr);
            }
        }

        // Fast & Reliable Intelligent Financial Engine fallback
        const fallbackReply = generateIntelligentFallback(userMessage, ctx, lang);
        return NextResponse.json({ reply: fallbackReply });
    } catch (error: any) {
        console.error("[AI Route Handler Error]", error);
        return NextResponse.json({
            reply: "AI Financial Engine is ready. Please configure your salary and loans in the dashboard to generate comprehensive insights.",
        });
    }
}

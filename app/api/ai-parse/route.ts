import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const CATEGORIES = [
    "Food",
    "Bills",
    "Fuel",
    "EMI / Loan",
    "Entertainment",
    "Travel",
    "Shopping",
    "Health",
    "Savings",
    "Others",
];

// Fallback intelligent NLP Parser supporting English & Malayalam
function parseExpenseNLP(text: string): { title: string; amount: number; category: string; date: string } {
    const raw = text.trim();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // 1. Extract Date (English & Malayalam)
    let date = today;
    if (/\byesterday\b|ഇന്നലെ/i.test(raw)) {
        date = yesterday;
    } else {
        const dateMatch = raw.match(/\b(20\d\d[-/]\d{1,2}[-/]\d{1,2})\b/);
        if (dateMatch) {
            date = dateMatch[1].replace(/\//g, "-");
        }
    }

    // 2. Extract Amount (Handles ₹, Rs, രൂപ, numbers, 1.5k, 5k)
    let amount = 0;
    const kMatch = raw.match(/(?:rs\.?|inr|₹|രൂപ)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
        amount = Math.round(parseFloat(kMatch[1]) * 1000);
    } else {
        const numMatches = Array.from(raw.matchAll(/(?:rs\.?|inr|₹|രൂപ)?\s*(\d[\d,]*(?:\.\d+)?)/gi));
        for (const match of numMatches) {
            const cleanStr = match[1].replace(/,/g, "");
            const val = parseFloat(cleanStr);
            if (val > 0 && !(val >= 2020 && val <= 2035 && !match[0].includes("₹") && !match[0].toLowerCase().includes("rs") && !match[0].includes("രൂപ"))) {
                amount = Math.round(val);
                break;
            }
        }
    }

    // 3. Classify Category based on English & Malayalam keywords
    const lower = raw.toLowerCase();
    let category = "Others";

    if (/petrol|diesel|fuel|gas|cng|bunk|shell|hp|ioc|പെട്രോൾ|ഡീസൽ|ഫ്യുവൽ|ഗ്യാസ്/i.test(lower)) {
        category = "Fuel";
    } else if (/food|dinner|lunch|breakfast|swiggy|zomato|restaurant|cafe|coffee|snacks|pizza|burger|grocer|milk|vegetable|fruit|tea|hotel|ഭക്ഷണം|ഫുഡ്|ഹോട്ടൽ|ചായ|പച്ചക്കറി|പാൽ|പലചരക്ക്|സൂപ്പർമാർക്കറ്റ്|ലഞ്ച്|ഡിന്നർ/i.test(lower)) {
        category = "Food";
    } else if (/electric|current|water|wifi|internet|broadband|recharge|mobile|rent|maintenance|eb bill|bill|കറണ്ട്|വെള്ളം|വൈഫൈ|റീചാർജ്|വാടക|ബിൽ|ഫോൺ/i.test(lower)) {
        category = "Bills";
    } else if (/emi|loan|installment|hdfc|sbi|icici|credit card|card bill|ഇ\.?എം\.?ഐ|ലോൺ|കടം|ഇഎംഐ/i.test(lower)) {
        category = "EMI / Loan";
    } else if (/movie|cinema|netflix|prime|hotstar|game|concert|outing|theatre|സിനിമ|തിയേറ്റർ|കളി/i.test(lower)) {
        category = "Entertainment";
    } else if (/train|flight|bus|auto|uber|ola|cab|taxi|toll|parking|metro|ബസ്സ്|ട്രെയിൻ|ഓട്ടോ|ടാക്സി|യാത്ര|ഫ്ലൈറ്റ്/i.test(lower)) {
        category = "Travel";
    } else if (/amazon|flipkart|myntra|cloth|dress|shirt|pant|shoe|mall|shopping|gadget|വസ്ത്രം|തുണി|ഷൂ|ഷോപ്പിംഗ്/i.test(lower)) {
        category = "Shopping";
    } else if (/medicine|pharmacy|hospital|doctor|clinic|medical|tablet|test|മരുന്ന്|ഡോക്ടർ|ഹോസ്പിറ്റൽ|മെഡിക്കൽ/i.test(lower)) {
        category = "Health";
    } else if (/gold|sip|mutual fund|rd|fd|invest|savings|സ്വർണ്ണം|നിക്ഷേപം|സേവിംഗ്സ്|സമ്പാദ്യം/i.test(lower)) {
        category = "Savings";
    }

    // 4. Clean Title
    let title = raw
        .replace(/(?:spent|paid|bought|for|on|rs\.?|inr|₹|രൂപ|\bk\b|\byesterday\b|\btoday\b|ഇന്നലെ|ഇന്ന്|ചെലവാക്കി|അടച്ചു|വാങ്ങി)/gi, " ")
        .replace(/\b\d[\d,]*(?:\.\d+)?\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!title || title.length < 2) {
        title = category !== "Others" ? category : "Expense";
    } else {
        title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    return {
        title,
        amount,
        category,
        date,
    };
}

export async function POST(request: Request) {
    try {
        const { text } = await request.json();
        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const today = new Date().toISOString().split("T")[0];

        // If Groq key is present, attempt remote structured parse
        if (GROQ_API_KEY) {
            try {
                const systemPrompt = `You are a multilingual expense parser (English and Malayalam / മലയാളം). Extract structured expense data from the user's natural language text. Today's date is ${today}.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{"title": "short description in English or transliterated Malayalam", "amount": number, "category": "one of: ${CATEGORIES.join(", ")}", "date": "YYYY-MM-DD"}

Rules:
- amount must be a plain number (no currency symbol)
- category must be EXACTLY one of: ${CATEGORIES.join(", ")}
- date: if user says "today" or "ഇന്ന്" use ${today}, "yesterday" or "ഇന്നലെ" use the day before, otherwise infer or default to ${today}
- title: a clean short label (e.g. "Groceries", "Petrol", "Electricity Bill", "Swiggy")`;

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
                            { role: "user", content: text },
                        ],
                        temperature: 0.1,
                        max_tokens: 150,
                        response_format: { type: "json_object" },
                    }),
                    signal: AbortSignal.timeout(5000),
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || "{}";
                    const parsed = JSON.parse(content);
                    if (parsed.amount && Number(parsed.amount) > 0) {
                        if (!CATEGORIES.includes(parsed.category)) parsed.category = "Others";
                        return NextResponse.json({ expense: parsed });
                    }
                }
            } catch (llmErr) {
                console.warn("[Groq Parse fallback]:", llmErr);
            }
        }

        // Fast & Reliable Multilingual NLP Parser
        const parsed = parseExpenseNLP(text);
        return NextResponse.json({ expense: parsed });
    } catch (error: any) {
        console.error("[AI Parse Error]", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}

import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const CATEGORIES = [
    "Food",
    "Bills",
    "Fuel",
    "Entertainment",
    "Travel",
    "Others",
];

export async function POST(request: Request) {
    try {
        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured" },
                { status: 500 },
            );
        }

        const { text } = await request.json();
        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 },
            );
        }

        const today = new Date().toISOString().split("T")[0];
        const systemPrompt = `You are an expense parser. Extract structured expense data from the user's natural language text. Today's date is ${today}.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{"title": "short description", "amount": number, "category": "one of: ${CATEGORIES.join(", ")}", "date": "YYYY-MM-DD"}

Rules:
- amount must be a plain number (no currency symbol)
- category must be EXACTLY one of: ${CATEGORIES.join(", ")}
- date: if user says "today" use ${today}, "yesterday" use the day before, otherwise infer or default to ${today}
- title: a clean short label (e.g. "Groceries", "Petrol", "Movie tickets")
- If you cannot extract an amount, set amount to 0`;

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
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "AI parse failed" },
                { status: 502 },
            );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            return NextResponse.json(
                { error: "Could not parse expense" },
                { status: 422 },
            );
        }

        // Validate category
        if (!CATEGORIES.includes(parsed.category)) parsed.category = "Others";

        return NextResponse.json({ expense: parsed });
    } catch (error: any) {
        console.error("[AI Parse Error]", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}

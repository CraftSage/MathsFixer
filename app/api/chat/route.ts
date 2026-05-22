import { NextRequest, NextResponse } from "next/server";

// ============================================================
// GROQ API KEY LOCATION
// ============================================================
// Set GROQ_API_KEY in your .env.local file (for local dev)
// OR in Vercel: Project Settings → Environment Variables
// ============================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not set. Add it to .env.local or Vercel environment variables." },
        { status: 500 }
      );
    }

    const { messages, pdfText, filters } = await req.json();

    const systemPrompt = `You are MathPDF Assistant, an expert at converting and fixing mathematical notation in documents.

${pdfText ? `The user has uploaded a PDF. Here is the extracted text:\n\n---PDF CONTENT---\n${pdfText.slice(0, 15000)}\n---END PDF---\n` : ""}

${filters ? `Active transformation filters: ${JSON.stringify(filters, null, 2)}` : ""}

Your capabilities:
1. Convert plain-text math (√x, 1/2, x^2, etc.) to proper LaTeX/formatted notation
2. Fix fractions: "a/b" → proper fraction \\frac{a}{b}
3. Fix square roots: "√x" or "sqrt(x)" → \\sqrt{x}
4. Fix superscripts: "x^2" → x²
5. Fix subscripts: "H_2O" → H₂O
6. Fix Greek letters: "alpha", "beta", "theta" → α, β, θ
7. Fix integrals, summations, limits
8. Fix matrices and vectors
9. Identify and correct OCR errors in math
10. Suggest better notation conventions

When showing math, use LaTeX notation wrapped in $...$ for inline or $$...$$ for display math.
Be helpful, precise, and explain what changes you make.`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.3,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Groq API error: ${err}` }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response";

    return NextResponse.json({ content });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

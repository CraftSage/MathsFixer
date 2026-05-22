import { NextRequest, NextResponse } from "next/server";

// ============================================================
// GROQ API KEY — set in Vercel Environment Variables
// ============================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(messages: unknown[], retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No response";
    }

    const err = await response.text();
    if (response.status === 429 && attempt < retries) {
      // Rate limited — wait and retry
      await new Promise(r => setTimeout(r, 15000 * attempt));
      continue;
    }
    throw new Error(`Groq error ${response.status}: ${err}`);
  }
  throw new Error("Max retries exceeded. Please wait a moment and try again.");
}

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not set in Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const { messages, pdfText, filters } = await req.json();

    const systemPrompt = `You are MathPDF Assistant, an expert at converting and fixing mathematical notation in documents.

${pdfText ? `The user has uploaded a PDF. Here is the extracted text:\n\n---PDF CONTENT---\n${pdfText.slice(0, 8000)}\n---END PDF---\n` : ""}

${filters ? `Active transformation filters: ${Object.entries(filters).filter(([,v])=>v).map(([k])=>k).join(", ")}` : ""}

You help users:
1. Convert plain-text math to proper notation (√, fractions, superscripts, Greek letters)
2. Explain what each filter does
3. Preview transformations from their document
4. Suggest which filters to use

When showing math use $...$ for inline or $$...$$ for display math. Be concise.`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const content = await callGroq(groqMessages);
    return NextResponse.json({ content });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";

// ============================================================
// GROQ API KEY LOCATION
// ============================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

async function processTextWithGroq(
  text: string,
  filters: Record<string, boolean>
): Promise<string> {
  if (!GROQ_API_KEY) return text;

  const activeFilters = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  const prompt = `Process the following mathematical text and apply these transformations: ${activeFilters}.
Apply all applicable conversions (√, fractions, superscripts, subscripts, greek letters, etc.)
Return ONLY the processed text, no explanations.

TEXT:
${text}`;

  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) return text;
  const data = await response.json();
  return data.choices?.[0]?.message?.content || text;
}

export async function POST(req: NextRequest) {
  try {
    const { pdfText, filters, filename, applyAI } = await req.json();

    if (!pdfText) {
      return NextResponse.json({ error: "No PDF text provided" }, { status: 400 });
    }

    let processedText = pdfText;
    if (applyAI && GROQ_API_KEY) {
      processedText = await processTextWithGroq(pdfText, filters);
    }

    // We return the processed text as JSON; the client uses browser print-to-PDF
    // This avoids heavy server-side PDF generation dependencies
    return NextResponse.json({ processedText, filename });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

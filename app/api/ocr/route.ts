import { NextRequest, NextResponse } from "next/server";

// ============================================================
// GROQ API KEY — same key as other routes (.env.local)
// ============================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }

    const { imageBase64, pageNum } = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${imageBase64}` },
              },
              {
                type: "text",
                text: `You are a precise OCR engine for a mathematics exam paper (page ${pageNum}).

Extract ALL text exactly as it appears. For mathematical notation:
- Write fractions as: numerator/denominator  e.g.  2/5  or  3/4
- Write square roots as: sqrt(expression)  e.g.  sqrt(2)  or  sqrt(x+1)
- Write powers/superscripts as: base^exponent  e.g.  x^2  or  a^3
- Write subscripts as: base_subscript  e.g.  x_1  or  S_11
- Write angles as: angle QPR = 50 degrees
- Write pi as: pi
- Write therefore symbol as: therefore
- Write implies arrow as: =>
- Keep all question numbers, section headers, marks (like 1/2 or 1 at right margin)
- Keep all MCQ choices: (A) (B) (C) (D)
- Preserve paragraph/question breaks with blank lines between questions
- Do NOT add LaTeX backslashes or dollar signs
- Do NOT add explanations or commentary
- Output ONLY the raw extracted text, nothing else`,
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.0,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Groq OCR error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text, pageNum });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

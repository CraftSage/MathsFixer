import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';   // Node.js runtime — not Edge
export const maxDuration = 60;     // Allow up to 60s for Groq API calls (Vercel Pro: 300s)

// ============================================================
// WHERE TO ADD YOUR GROQ API KEY:
//
// Option A (Vercel — recommended):
//   Vercel Dashboard → Your Project → Settings → Environment Variables
//   Add:  GROQ_API_KEY = gsk_xxxxxxxxxxxxxxxx
//
// Option B (hardcode for quick test — don't commit to public repos):
//   Replace 'YOUR_GROQ_API_KEY_HERE' below with your actual key.
//
// Option C (user enters key in the UI):
//   The chat UI has a "Set API Key" button — key is stored in localStorage
//   and sent with each request. This route accepts it automatically.
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, pdfText, systemInstructions, apiKey: clientApiKey } = body;

    // Priority: env var > client-supplied key > placeholder check
    const resolvedKey =
      process.env.GROQ_API_KEY ||
      clientApiKey ||
      'YOUR_GROQ_API_KEY_HERE';

    if (!resolvedKey || resolvedKey === 'YOUR_GROQ_API_KEY_HERE') {
      return NextResponse.json(
        {
          error:
            'No Groq API key found. Either:\n' +
            '• Add GROQ_API_KEY in Vercel environment variables, OR\n' +
            '• Click "Set API Key" in the chat tab and enter your key.',
        },
        { status: 400 }
      );
    }

    const client = new Groq({ apiKey: resolvedKey });

    const systemPrompt = `You are a mathematical document formatting assistant. Your job is to help users convert and fix mathematical notation in documents extracted from PDFs.

You have access to the following extracted PDF text:
---
${pdfText ? pdfText.slice(0, 8000) : 'No PDF text provided yet. Ask the user to upload a PDF first.'}
---

${systemInstructions || ''}

When asked to make changes:
1. Show BEFORE and AFTER for key changes
2. Explain what you changed and why
3. If asked to convert the whole document, output the complete converted text
4. Use proper mathematical notation:
   - Fractions: write as (numerator)/(denominator) or stacked notation
   - Square roots: use √ symbol  e.g. √(x+1)
   - Powers: use ^ notation  e.g. x^2 means x²
   - Greek letters: use actual symbols (α β γ δ ε θ λ μ π σ φ ω)
   - Inequalities: ≤ ≥ ≠ ≈
   - Plus-minus: ±
   - Multiplication: ×
   - Division: ÷
5. Preserve the document's original structure, headings, and meaning.`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 4096,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '';
    return NextResponse.json({ content });

  } catch (error: unknown) {
    console.error('Groq API error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `AI processing failed: ${message}` },
      { status: 500 }
    );
  }
}

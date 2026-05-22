import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

// ============================================================
// GROQ API KEY — set in .env.local or Vercel env vars
// GROQ_API_KEY=your_key_here
// ============================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

async function processWithGroq(text: string, filters: Record<string, boolean>): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set in environment variables");

  const activeFilters = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  const prompt = `You are a precise mathematical document formatter. Apply ONLY these transformations: ${activeFilters}.

Transformation rules:
- square_roots: √x or sqrt(x) → proper √ symbol. e.g. sqrt(x+1) → √(x+1)
- fractions: simple a/b inline fractions → keep with clear spacing; complex ones note them
- superscripts: x^2 → x², x^3 → x³, use unicode superscripts ⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ
- subscripts: H_2O → H₂O, x_n → xₙ, use unicode subscripts ₀₁₂₃₄₅₆₇₈₉
- cube_roots: cbrt(x) → ∛x
- greek_letters: alpha→α, beta→β, gamma→γ, delta→δ, epsilon→ε, theta→θ, lambda→λ, mu→μ, nu→ν, pi→π, rho→ρ, sigma→σ, tau→τ, phi→φ, psi→ψ, omega→ω, xi→ξ, zeta→ζ, eta→η, kappa→κ
- infinity: inf or infinity → ∞
- degrees: 90 deg or 90 degrees → 90°
- inequalities: >= → ≥, <= → ≤, != → ≠, ~= → ≈
- set_notation: "belongs to" → ∈, "not in" → ∉, "subset of" → ⊂, "union" → ∪, "intersection" → ∩, "empty set" → ∅
- arrows: -> → →, => → ⇒, <-> → ↔, <- → ←
- integrals: int( → ∫(
- summations: sum( → Σ(
- operator_spacing: ensure single space around +, -, =, ×, ÷
- units: normalize SI units (m/s², kg·m, kPa, etc.)
- cleanup: remove double spaces, fix broken words from OCR, clean artifacts
- number_formatting: numbers > 9999 get comma separators
- chemical_formulas: H2O → H₂O, CO2 → CO₂, O2 → O₂, N2 → N₂
- inequalities: already covered above

IMPORTANT: Return ONLY the processed text. No explanations, no markdown fences, no preamble. Preserve all original line breaks and paragraph structure exactly.

TEXT:
${text}`;

  const res = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.05,
      max_tokens: 8192,
    }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || text;
}

function buildDocx(text: string, filename: string): Document {
  const lines = text.split("\n");
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: filename.replace(/\.pdf$/i, ""), bold: true, size: 40, font: "Cambria", color: "1a1a2e" })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "6C63FF" } },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Converted by MathPDF Converter · ${new Date().toLocaleDateString("en-IN")}`, size: 18, italics: true, color: "888888", font: "Cambria" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
    })
  );

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      continue;
    }
    const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length > 4 && trimmed.length < 100 && !/[.!?,;]/.test(trimmed);
    if (isHeading) {
      children.push(new Paragraph({
        text: trimmed,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 160 },
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: line, size: 24, font: "Cambria" })],
        spacing: { after: 100, line: 288 },
        alignment: AlignmentType.JUSTIFIED,
      }));
    }
  }

  return new Document({
    creator: "MathPDF Converter",
    title: filename,
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 } } },
      children,
    }],
  });
}

export async function POST(req: NextRequest) {
  try {
    const { pdfText, filters, filename, applyAI } = (await req.json()) as {
      pdfText: string;
      filters: Record<string, boolean>;
      filename: string;
      applyAI: boolean;
    };

    if (!pdfText) return NextResponse.json({ error: "No PDF text provided" }, { status: 400 });

    let processed = pdfText;
    if (applyAI && GROQ_API_KEY) {
      processed = await processWithGroq(pdfText, filters);
    } else if (!applyAI) {
      // Basic local transforms (no AI)
      if (filters.superscripts) processed = processed.replace(/\^([0-9])/g, (_, d: string) => ({ "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" }[d] ?? d));
      if (filters.greek_letters) {
        const map: Record<string, string> = { alpha:"α",beta:"β",gamma:"γ",delta:"δ",epsilon:"ε",theta:"θ",lambda:"λ",mu:"μ",pi:"π",sigma:"σ",omega:"ω",phi:"φ" };
        for (const [k,v] of Object.entries(map)) processed = processed.replace(new RegExp(`\\b${k}\\b`, "gi"), v);
      }
      if (filters.infinity) processed = processed.replace(/\b(inf|infinity)\b/gi, "∞");
      if (filters.degrees) processed = processed.replace(/(\d+)\s*deg\b/gi, "$1°");
      if (filters.inequalities) processed = processed.replace(/>=/g,"≥").replace(/<=/g,"≤").replace(/!=/g,"≠");
      if (filters.square_roots) processed = processed.replace(/sqrt\(([^)]+)\)/gi, "√($1)");
      if (filters.chemical_formulas) {
        processed = processed.replace(/\bH2O\b/g,"H₂O").replace(/\bCO2\b/g,"CO₂").replace(/\bO2\b/g,"O₂").replace(/\bN2\b/g,"N₂");
      }
    }

    const doc = buildDocx(processed, filename || "document.pdf");
    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename.replace(/\.pdf$/i, "")}_converted.docx"`,
      },
    });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
# MathPDF Converter

**AI-powered web app** that takes a PDF with plain-text math notation and converts it to properly formatted symbols — then exports as a Word `.docx` or PDF.

---

## ✨ What it fixes

| Input (broken) | Output (fixed) |
|---|---|
| `sqrt(x+1)` | `√(x+1)` |
| `x^2 + y^2` | `x² + y²` |
| `H_2O` | `H₂O` |
| `alpha + beta` | `α + β` |
| `a/b` | proper fraction |
| `>= or !=` | `≥ or ≠` |
| `inf` | `∞` |
| `90 deg` | `90°` |
| `CO2` | `CO₂` |

---

## 🚀 Setup (5 minutes)

### 1. Get a Groq API Key

> 👉 Go to **https://console.groq.com/keys** → Create a key → Copy it

### 2. Add your key

Create a file called `.env.local` in the project root:

```
GROQ_API_KEY=gsk_your_actual_key_here
```

> **That's the only thing you need to change.** The key location is clearly marked in all route files too.

### 3. Run locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## ☁️ Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to **vercel.com** → Import that repo
3. In Vercel project → **Settings → Environment Variables**
4. Add: `GROQ_API_KEY` = `gsk_your_actual_key_here`
5. Deploy → Done!

---

## 🗂️ App Tabs

| Tab | Purpose |
|---|---|
| **Upload** | Drop your PDF here — text is extracted in-browser |
| **Chat** | Ask the AI about your document, preview changes, get suggestions |
| **Filters** | Tick exactly which transformations to apply (24 options across 4 groups) |
| **Preview** | Side-by-side original vs processed text |

---

## 📤 Export Options

- **Word (.docx)** — AI processes the text then generates a formatted Word document
- **PDF** — AI processes the text, then opens browser print dialog (Save as PDF)
- **Use AI toggle** — Turn off to use fast local-only transforms (no API call)

---

## 🔧 Where to find the API key in code

- `app/api/chat/route.ts` — line 10: `const GROQ_API_KEY = process.env.GROQ_API_KEY;`
- `app/api/export-word/route.ts` — line 14: same
- `app/api/export-pdf/route.ts` — line 4: same

All three read from the same environment variable.

---

## 📦 Tech Stack

- **Next.js 14** (App Router)
- **Groq API** with `llama-3.3-70b-versatile`
- **pdf.js** for in-browser PDF text extraction
- **docx** npm package for Word generation
- **KaTeX** for math rendering in chat
- **Tailwind CSS**

---

## 💡 Tips

- PDFs with **selectable text** work best (not scanned images)
- For scanned PDFs, try an OCR tool first (e.g. Adobe, ilovepdf.com)
- The **Chat tab** is great for asking "which filters should I use?" before exporting
- The AI model (Groq Llama 3.3 70B) is very fast — typically under 3 seconds

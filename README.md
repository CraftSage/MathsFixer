# MathPDF Converter

A web app to convert PDFs with plain-text math notation (like `√` and `1/2`) into properly formatted mathematical symbols. Export as Word (.docx) or PDF.

## Features

- 📄 **PDF Upload** — drag & drop or click to upload
- 🔢 **15 Conversion Options** — fractions, roots, superscripts, subscripts, Greek letters, operators, and more
- 👁️ **Live Preview** — see converted text before downloading, with side-by-side original vs converted
- 🤖 **AI Chat** (Groq) — ask the AI to make custom edits to your document
- 📥 **Download** — export as Word (.docx) or PDF

## Deployment on Vercel

### Step 1: Get your Groq API Key

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to **API Keys** and click **Create API Key**
4. Copy the key (starts with `gsk_...`)

### Step 2: Deploy to Vercel

**Option A — Import from GitHub (Recommended):**
1. Push this code to a GitHub repository
2. Go to [https://vercel.com](https://vercel.com) and click **Add New Project**
3. Import your GitHub repo
4. In the **Environment Variables** section, add:
   - Name: `GROQ_API_KEY`
   - Value: `gsk_your_actual_key_here`
5. Click **Deploy**

**Option B — Vercel CLI:**
```bash
npm install -g vercel
cd mathpdf-app
npm install
vercel --prod
# When prompted for env vars, add GROQ_API_KEY
```

### Step 3: Add API Key Directly in Code (Alternative)

If you don't want to use environment variables, open:
```
app/api/process/route.ts
```

Find this line:
```typescript
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
```

Replace `YOUR_GROQ_API_KEY_HERE` with your actual key:
```typescript
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'gsk_xxxxxxxxxxxx';
```

> ⚠️ **Note:** If you hardcode the key, make sure not to push it to a public GitHub repo.

## Local Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your GROQ_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Conversion Options

| Option | Example |
|--------|---------|
| Proper Fractions | `1/2` → `½`, `(x+1)/(2a)` |
| Square Roots | `sqrt(x)` → `√(x)` |
| Cube/Nth Roots | `cbrt(x)` → `∛(x)` |
| Superscripts | `x^2` → `x²` |
| Subscripts | `x_1` → `x₁` |
| Greek Letters | `alpha` → `α`, `theta` → `θ` |
| Pi Symbol | `pi` → `π` |
| Infinity | `infinity` → `∞` |
| Operators | `+-` → `±`, `div` → `÷` |
| Multiplication | `3 * 4` → `3 × 4` |
| Inequalities | `<=` → `≤`, `>=` → `≥` |
| Arrows | `->` → `→`, `=>` → `⇒` |
| Fix Spacing | `x  =  2` → `x = 2` |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + Lucide Icons
- **PDF Parsing:** PDF.js (client-side)
- **Word Export:** docx
- **PDF Export:** jsPDF
- **AI:** Groq (llama-3.3-70b-versatile)
- **Deployment:** Vercel

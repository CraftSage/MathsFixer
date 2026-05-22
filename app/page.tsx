"use client";

import { useState, useRef, useEffect, useCallback, DragEvent, ChangeEvent } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FilterGroup {
  label: string;
  color: string;
  items: { key: string; label: string; description: string }[];
}

// ─── Filter definitions ───────────────────────────────────────────────────────
const FILTER_GROUPS: FilterGroup[] = [
  {
    label: "Math Notation",
    color: "#6c63ff",
    items: [
      { key: "square_roots", label: "Square Roots", description: "√x or sqrt(x) → proper √ symbol" },
      { key: "fractions", label: "Fractions", description: "a/b → proper fraction formatting" },
      { key: "superscripts", label: "Superscripts / Powers", description: "x^2 → x², x^n → xⁿ" },
      { key: "subscripts", label: "Subscripts", description: "H_2O → H₂O, x_n → xₙ" },
      { key: "cube_roots", label: "Cube Roots", description: "cbrt(x) → ∛x symbol" },
      { key: "nth_roots", label: "Nth Roots", description: "root(n,x) → ⁿ√x notation" },
    ],
  },
  {
    label: "Symbols & Letters",
    color: "#ff6584",
    items: [
      { key: "greek_letters", label: "Greek Letters", description: "alpha→α, beta→β, theta→θ, pi→π …" },
      { key: "infinity", label: "Infinity", description: "inf or infinity → ∞" },
      { key: "degrees", label: "Degrees", description: "90 deg → 90°" },
      { key: "inequalities", label: "Inequalities", description: ">= → ≥, <= → ≤, != → ≠" },
      { key: "set_notation", label: "Set Notation", description: "belongs to → ∈, subset → ⊂, union → ∪" },
      { key: "arrows", label: "Arrows", description: "-> → →, => → ⇒, <-> → ↔" },
    ],
  },
  {
    label: "Calculus & Advanced",
    color: "#43e97b",
    items: [
      { key: "integrals", label: "Integrals", description: "int( ) → ∫ notation" },
      { key: "summations", label: "Summations", description: "sum( ) or Σ formatting" },
      { key: "limits", label: "Limits", description: "lim formatting with proper arrows" },
      { key: "derivatives", label: "Derivatives", description: "dy/dx notation cleanup" },
      { key: "partial_derivatives", label: "Partial Derivatives", description: "∂f/∂x notation" },
      { key: "vectors", label: "Vectors", description: "Bold vector notation, arrow notation" },
    ],
  },
  {
    label: "Text & Formatting",
    color: "#f7971e",
    items: [
      { key: "operator_spacing", label: "Operator Spacing", description: "Fix spaces around +, −, ×, ÷, =" },
      { key: "units", label: "Units & Measurements", description: "Normalize cm, kg, m/s², kPa etc." },
      { key: "cleanup", label: "General Cleanup", description: "Remove double spaces, fix OCR artifacts" },
      { key: "number_formatting", label: "Number Formatting", description: "1000000 → 1,000,000 or 1×10⁶" },
      { key: "chemical_formulas", label: "Chemical Formulas", description: "H2O → H₂O, CO2 → CO₂" },
      { key: "matrix_notation", label: "Matrix Notation", description: "Detect and format matrix/vector brackets" },
    ],
  },
];

const allKeys = FILTER_GROUPS.flatMap((g) => g.items.map((i) => i.key));

// ─── MathText renderer ────────────────────────────────────────────────────────
function MathText({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const div = ref.current;
    const render = async () => {
      try {
        const katex = (await import("katex")).default;
        
        let html = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        html = html.replace(/\$\$([^$]+)\$\$/g, (_,m) => {
          try { return `<div class="katex-display">${katex.renderToString(m,{throwOnError:false,displayMode:true})}</div>`; }
          catch { return `<code>$$${m}$$</code>`; }
        });
        html = html.replace(/\$([^$\n]+)\$/g, (_,m) => {
          try { return katex.renderToString(m,{throwOnError:false}); }
          catch { return `<code>$${m}$</code>`; }
        });
        html = html.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
        html = html.replace(/\n/g,"<br>");
        div.innerHTML = html;
      } catch { div.textContent = text; }
    };
    render();
  }, [text]);
  return <div ref={ref} className="ai-prose leading-relaxed" />;
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-2 h-2 rounded-full bg-purple-400 dot-1" />
      <div className="w-2 h-2 rounded-full bg-purple-400 dot-2" />
      <div className="w-2 h-2 rounded-full bg-purple-400 dot-3" />
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange }: { filters: Record<string,boolean>; onChange:(k:string,v:boolean)=>void }) {
  const allChecked = allKeys.every(k => filters[k]);
  const toggleAll = () => { const v=!allChecked; allKeys.forEach(k=>onChange(k,v)); };
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto" style={{maxHeight:"calc(100vh - 200px)"}}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Transformation Filters</h2>
          <p className="text-xs mt-0.5" style={{color:"var(--muted)"}}>Choose what to fix when processing your PDF</p>
        </div>
        <button onClick={toggleAll} className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{background:allChecked?"rgba(108,99,255,0.2)":"var(--accent)",color:allChecked?"var(--accent)":"white",border:"1px solid var(--accent)"}}>
          {allChecked?"Deselect All":"Select All"}
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
        style={{background:"rgba(108,99,255,0.1)",border:"1px solid rgba(108,99,255,0.3)"}}>
        <span style={{color:"var(--accent)"}}>●</span>
        <span style={{color:"var(--text)"}}><strong>{activeCount}</strong> of <strong>{allKeys.length}</strong> transformations active</span>
      </div>

      {FILTER_GROUPS.map(group => (
        <div key={group.label} className="rounded-xl p-4" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{background:group.color}} />
            <h3 className="font-bold text-white text-sm">{group.label}</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{background:"var(--surface2)",color:"var(--muted)"}}>
              {group.items.filter(i=>filters[i.key]).length}/{group.items.length}
            </span>
          </div>
          <div className="grid gap-2">
            {group.items.map(item => (
              <label key={item.key} className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg transition-all"
                style={{background:filters[item.key]?`${group.color}12`:"transparent",border:`1px solid ${filters[item.key]?`${group.color}40`:"transparent"}`}}>
                <input type="checkbox" className="custom-check mt-0.5"
                  style={filters[item.key]?{background:group.color,borderColor:group.color}:{}}
                  checked={!!filters[item.key]} onChange={e=>onChange(item.key,e.target.checked)} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">{item.label}</div>
                  <div className="text-xs mt-0.5" style={{color:"var(--muted)"}}>{item.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab({ pdfText, filters, filename }: { pdfText:string; filters:Record<string,boolean>; filename:string }) {
  const [messages, setMessages] = useState<Message[]>([{
    role:"assistant",
    content: pdfText
      ? `I've loaded **${filename||"your PDF"}** — ${pdfText.length.toLocaleString()} characters extracted.\n\nI can help you:\n- Preview how math notation will be converted\n- Explain what each filter does\n- Suggest filters for your document type\n- Show before/after examples from your PDF\n\nWhat would you like to know?`
      : "Upload a PDF and I can help you understand and preview all the math notation changes. You can also ask me general questions!",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages,loading]);
  useEffect(() => {
    if (pdfText) setMessages([{role:"assistant",content:`Loaded **${filename||"your PDF"}**. Ready to help! Ask me anything about the math notation in your document.`}]);
  }, [pdfText, filename]);

  const send = async () => {
    if (!input.trim()||loading) return;
    const userMsg:Message = {role:"user",content:input.trim()};
    setMessages(prev=>[...prev,userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:[...messages,userMsg],pdfText,filters}),
      });
      const data = await res.json();
      setMessages(prev=>[...prev,{role:"assistant",content:data.error?`Error: ${data.error}`:data.content}]);
    } catch(e) { setMessages(prev=>[...prev,{role:"assistant",content:`Error: ${String(e)}`}]); }
    setLoading(false);
  };

  const quickPrompts = [
    "Preview math conversions from my PDF",
    "Which filters for a physics textbook?",
    "Show me before/after examples",
    "List all Greek letters detected",
  ];

  return (
    <div className="flex flex-col" style={{height:"calc(100vh - 200px)"}}>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((m,i) => (
          <div key={i} className={`max-w-[85%] px-4 py-3 text-sm animate-fade-in ${m.role==="user"?"msg-user self-end text-white":"msg-ai self-start"}`}>
            {m.role==="assistant" ? <MathText text={m.content} /> : <span>{m.content}</span>}
          </div>
        ))}
        {loading && <div className="msg-ai self-start animate-fade-in"><LoadingDots /></div>}
        <div ref={bottomRef} />
      </div>

      {messages.length<=2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickPrompts.map(q => (
            <button key={q} onClick={()=>{setInput(q);textareaRef.current?.focus();}}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)"}}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t" style={{borderColor:"var(--border)"}}>
        <div className="flex items-end gap-2 rounded-xl p-3" style={{background:"var(--surface2)",border:"1px solid var(--border)"}}>
          <textarea ref={textareaRef} rows={1} value={input}
            onChange={(e:ChangeEvent<HTMLTextAreaElement>)=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Ask about your PDF math… (Enter to send)"
            className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed"
            style={{color:"var(--text)",maxHeight:100}} />
          <button onClick={send} disabled={!input.trim()||loading}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{background:"var(--accent)"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{color:"var(--muted)"}}>Powered by Groq · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ─── Preview Tab ─────────────────────────────────────────────────────────────
function PreviewTab({ pdfText, processedText }: { pdfText:string; processedText:string }) {
  const [view, setView] = useState<"split"|"original"|"processed">("split");
  if (!pdfText) return (
    <div className="flex flex-col items-center justify-center h-48 gap-3" style={{color:"var(--muted)"}}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      </svg>
      <p className="text-sm">Upload a PDF to see preview</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto" style={{maxHeight:"calc(100vh - 200px)"}}>
      <div className="flex gap-2">
        {(["split","original","processed"] as const).map(v => (
          <button key={v} onClick={()=>setView(v)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
            style={{background:view===v?"var(--accent)":"var(--surface2)",color:view===v?"white":"var(--muted)",border:`1px solid ${view===v?"var(--accent)":"var(--border)"}`}}>
            {v==="split"?"Side by Side":v==="original"?"Original":"Processed"}
          </button>
        ))}
      </div>
      <div className={`grid gap-4 ${view==="split"?"grid-cols-2":"grid-cols-1"}`}>
        {(view==="original"||view==="split") && (
          <div>
            <div className="text-xs font-semibold mb-2" style={{color:"var(--muted)"}}>ORIGINAL</div>
            <pre className="rounded-xl p-4 text-xs leading-relaxed overflow-auto" style={{background:"var(--surface)",border:"1px solid var(--border)",maxHeight:460,whiteSpace:"pre-wrap",fontFamily:"Space Mono,monospace",color:"var(--text)"}}>
              {pdfText}
            </pre>
          </div>
        )}
        {(view==="processed"||view==="split") && (
          <div>
            <div className="text-xs font-semibold mb-2" style={{color:"var(--accent)"}}>PROCESSED</div>
            <pre className="rounded-xl p-4 text-xs leading-relaxed overflow-auto" style={{background:"var(--surface)",border:`1px solid var(--accent)40`,maxHeight:460,whiteSpace:"pre-wrap",fontFamily:"Space Mono,monospace",color:"var(--text)"}}>
              {processedText||"Click Export to generate processed version…"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState<"upload"|"chat"|"filters"|"preview">("upload");
  const [pdfText, setPdfText] = useState("");
  const [filename, setFilename] = useState("");
  const [processedText, setProcessedText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [exportStatus, setExportStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<Record<string,boolean>>(
    Object.fromEntries(allKeys.map(k=>[k,true]))
  );
  const updateFilter = (k:string,v:boolean) => setFilters(prev=>({...prev,[k]:v}));

  const extractPDFText = useCallback(async (file:File):Promise<{text:string; isImageBased:boolean}> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js`;
    const pdf = await pdfjsLib.getDocument({data:arrayBuffer}).promise;
    let fullText = "";
    let totalChars = 0;

    for (let i=1;i<=pdf.numPages;i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it:unknown)=>{const x=it as {str?:string};return x.str||"";}).join(" ").trim();
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      totalChars += pageText.length;
    }

    // If less than 50 chars per page on average → image-based PDF
    const avgCharsPerPage = totalChars / pdf.numPages;
    return { text: fullText.trim(), isImageBased: avgCharsPerPage < 50 };
  }, []);

  const ocrPDFWithVision = useCallback(async (file:File, onProgress:(msg:string)=>void):Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js`;
    const pdf = await pdfjsLib.getDocument({data:arrayBuffer}).promise;
    const totalPages = pdf.numPages;
    const allText: string[] = [];

    for (let i=1;i<=totalPages;i++) {
      onProgress(`OCR scanning page ${i} of ${totalPages}…`);
      const page = await pdf.getPage(i);
      // Render page to canvas at 2x scale for better OCR quality
      const viewport = page.getViewport({scale:2.0});
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({canvasContext:ctx, viewport}).promise;

      // Convert to base64 PNG
      const base64 = canvas.toDataURL("image/png").split(",")[1];

      // Send to Groq vision OCR
      const res = await fetch("/api/ocr", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({imageBase64:base64, pageNum:i}),
      });
      const data = await res.json();
      if (data.error) throw new Error(`Page ${i}: ${data.error}`);
      allText.push(`--- Page ${i} ---\n${data.text}`);
    }
    return allText.join("\n\n");
  }, []);

  const handleFile = async (file:File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) { alert("Please upload a PDF file."); return; }
    setFilename(file.name);
    setUploading(true);
    setExportStatus("Checking PDF type…");
    try {
      const { text, isImageBased } = await extractPDFText(file);

      if (!isImageBased) {
        // Normal text PDF
        setPdfText(text);
        setExportStatus("");
        setTab("chat");
      } else {
        // Image-based PDF — use Groq Vision OCR
        setExportStatus("Image-based PDF detected — using AI OCR (this takes ~10s per page)…");
        const ocrText = await ocrPDFWithVision(file, (msg)=>setExportStatus(msg));
        setPdfText(ocrText);
        setExportStatus("✓ OCR complete! Text extracted from all pages.");
        setTimeout(()=>setExportStatus(""),4000);
        setTab("chat");
      }
    } catch(e) {
      setExportStatus(`Error: ${String(e)}`);
    }
    setUploading(false);
    setProcessedText("");
  };

  const onDrop = (e:DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0]; if(file) handleFile(file);
  };

  const exportWord = async () => {
    if (!pdfText) return;
    setExporting(true); setExportStatus("Sending to AI…");
    try {
      const res = await fetch("/api/export-word",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({pdfText,filters,filename,applyAI:useAI}),
      });
      if (!res.ok) { const err=await res.json(); throw new Error(err.error); }
      setExportStatus("Downloading…");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href=url; a.download=`${filename.replace(".pdf","")}_converted.docx`; a.click();
      URL.revokeObjectURL(url);
      setExportStatus("✓ Downloaded!");
      setTimeout(()=>setExportStatus(""),3000);
    } catch(e) { setExportStatus(`Error: ${String(e)}`); }
    setExporting(false);
  };

  const exportPDF = async () => {
    if (!pdfText) return;
    setExporting(true); setExportStatus("Processing…");
    try {
      const res = await fetch("/api/export-pdf",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({pdfText,filters,filename,applyAI:useAI}),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProcessedText(data.processedText);
      setTab("preview");

      // Open print dialog
      const printWin = window.open("","_blank");
      if (printWin) {
        printWin.document.write(`<!DOCTYPE html><html><head>
          <title>${filename||"Converted"}</title>
          <style>body{font-family:Cambria,Georgia,serif;padding:40px 60px;line-height:1.8;font-size:12pt;color:#111;}
          pre{font-family:inherit;white-space:pre-wrap;}h1{border-bottom:2px solid #6c63ff;padding-bottom:8px;}</style>
          </head><body><h1>${filename?.replace(".pdf","")||"Converted Document"}</h1>
          <pre>${data.processedText.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
          <script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
        printWin.document.close();
      }
      setExportStatus("✓ Print dialog opened!");
      setTimeout(()=>setExportStatus(""),3000);
    } catch(e) { setExportStatus(`Error: ${String(e)}`); }
    setExporting(false);
  };

  const TABS = [
    { id:"upload", label:"Upload", icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
    { id:"chat",   label:"Chat",   icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id:"filters",label:"Filters",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> },
    { id:"preview",label:"Preview",icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
  ] as const;

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen" style={{background:"var(--bg)"}}>
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b" style={{borderColor:"var(--border)",background:"var(--surface)"}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shimmer-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/><circle cx="5" cy="12" r="2"/><line x1="7" y1="12" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">MathPDF Converter</h1>
            <p className="text-xs" style={{color:"var(--muted)"}}>AI-powered math notation fixer</p>
          </div>
        </div>

        {pdfText && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-lg text-xs" style={{background:"rgba(67,233,123,0.1)",border:"1px solid rgba(67,233,123,0.3)",color:"#43e97b"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="truncate max-w-32">{filename}</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* AI toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs" style={{color:"var(--muted)"}}>Use AI</span>
            <div className="relative w-10 h-5" onClick={()=>setUseAI(v=>!v)}>
              <div className="w-10 h-5 rounded-full transition-all" style={{background:useAI?"var(--accent)":"var(--border)"}} />
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{left:useAI?"22px":"2px"}} />
            </div>
          </label>

          {/* Export buttons */}
          {pdfText && (
            <div className="flex items-center gap-2">
              <button onClick={exportWord} disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{background:"var(--accent)",color:"white"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {exporting?"…":"Word"}
              </button>
              <button onClick={exportPDF} disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{background:"var(--accent2)",color:"white"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {exporting?"…":"PDF"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Status bar */}
      {exportStatus && (
        <div className="px-6 py-2 text-sm font-medium animate-fade-in"
          style={{background:exportStatus.startsWith("✓")?"rgba(67,233,123,0.1)":"rgba(108,99,255,0.1)",
                  color:exportStatus.startsWith("✓")?"#43e97b":exportStatus.startsWith("Error")?"#ff6584":"var(--accent)",
                  borderBottom:"1px solid var(--border)"}}>
          {exportStatus}
        </div>
      )}

      {/* Layout */}
      <div className="flex" style={{height:"calc(100vh - 65px)"}}>
        {/* Sidebar tabs */}
        <nav className="flex flex-col gap-1 p-3 border-r" style={{background:"var(--surface)",borderColor:"var(--border)",width:100,flexShrink:0}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-semibold transition-all relative"
              style={{background:tab===t.id?"var(--accent)":"transparent",color:tab===t.id?"white":"var(--muted)"}}>
              {t.icon}
              {t.label}
              {t.id==="filters" && activeCount<allKeys.length && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{background:"var(--accent2)",fontSize:"9px"}}>{activeCount}</span>
              )}
              {t.id==="chat" && pdfText && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{background:"#43e97b"}} />
              )}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {/* Upload Tab */}
          {tab==="upload" && (
            <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white mb-3">Upload Your PDF</h2>
                <p className="text-sm" style={{color:"var(--muted)"}}>Drop a PDF with messy math notation — we'll fix √, fractions, superscripts, and more</p>
              </div>

              <div className={`drop-zone w-full max-w-xl rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver?"drag-over":""}`}
                style={{background:"var(--surface)"}}
                onClick={()=>fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}>
                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin-slow" style={{borderColor:"var(--accent)",borderTopColor:"transparent"}} />
                    <p className="text-sm font-semibold" style={{color:"var(--accent)"}}>{exportStatus||"Reading PDF…"}</p>
                    <p className="text-xs" style={{color:"var(--muted)"}}>Image-based PDFs use AI OCR — takes ~10s per page</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:"rgba(108,99,255,0.15)",border:"1px solid rgba(108,99,255,0.3)"}}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg mb-1">Drop PDF here</p>
                      <p className="text-sm" style={{color:"var(--muted)"}}>or click to browse</p>
                    </div>
                    <div className="text-xs px-3 py-1 rounded-full" style={{background:"var(--surface2)",color:"var(--muted)"}}>
                      Supports any PDF with extractable text
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(f)handleFile(f);}} />
              </div>

              {/* Feature preview */}
              <div className="grid grid-cols-4 gap-4 w-full max-w-2xl">
                {[
                  {icon:"√", label:"Square Roots", desc:"√x, sqrt(x)"},
                  {icon:"½", label:"Fractions", desc:"a/b format"},
                  {icon:"x²", label:"Powers", desc:"x^2 → x²"},
                  {icon:"αβγ", label:"Greek Letters", desc:"alpha → α"},
                ].map(f=>(
                  <div key={f.label} className="rounded-xl p-4 text-center" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-xs font-bold text-white">{f.label}</div>
                    <div className="text-xs mt-0.5" style={{color:"var(--muted)"}}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {tab==="chat" && <ChatTab pdfText={pdfText} filters={filters} filename={filename} />}

          {/* Filters Tab */}
          {tab==="filters" && <FilterPanel filters={filters} onChange={updateFilter} />}

          {/* Preview Tab */}
          {tab==="preview" && <PreviewTab pdfText={pdfText} processedText={processedText} />}
        </main>
      </div>
    </div>
  );
}

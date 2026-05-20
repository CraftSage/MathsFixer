'use client';

import { useState, useEffect, useCallback } from 'react';
import PDFUploader from '@/components/PDFUploader';
import ChatTab from '@/components/ChatTab';
import FiltersTab from '@/components/FiltersTab';
import { ConversionOptions, defaultOptions, getUnicode } from '@/lib/mathConverter';
import {
  MessageSquare, SlidersHorizontal, FileText, Eye, EyeOff,
  Sparkles, ChevronDown, ChevronUp, ArrowLeftRight, Info
} from 'lucide-react';

type ActiveTab = 'chat' | 'filters';

export default function Home() {
  const [pdfText, setPdfText] = useState('');
  const [fileName, setFileName] = useState('');
  const [options, setOptions] = useState<ConversionOptions>(defaultOptions);
  const [activeTab, setActiveTab] = useState<ActiveTab>('filters');
  const [previewText, setPreviewText] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  // Load API key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('groq_api_key');
    if (saved) setApiKey(saved);
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    if (key) localStorage.setItem('groq_api_key', key);
    else localStorage.removeItem('groq_api_key');
  };

  const handleTextExtracted = useCallback((text: string, name: string) => {
    setPdfText(text);
    setFileName(name);
    setPreviewText(getUnicode(text, options));
  }, [options]);

  // Update preview when options change
  useEffect(() => {
    if (pdfText) {
      setPreviewText(getUnicode(pdfText, options));
    }
  }, [pdfText, options]);

  const handleConvert = async (type: 'docx' | 'pdf') => {
    if (!pdfText) return;
    setIsConverting(true);
    setConvertError(null);
    setConvertSuccess(null);

    try {
      const docTitle = fileName.replace(/\.pdf$/i, '') || 'Converted Document';
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pdfText,
          options,
          outputType: type,
          title: docTitle,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = fileName.replace(/\.pdf$/i, '');
      a.download = `${baseName}_converted.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setConvertSuccess(`✅ Successfully downloaded as ${type.toUpperCase()}`);
      setTimeout(() => setConvertSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Conversion failed';
      setConvertError(msg);
    } finally {
      setIsConverting(false);
    }
  };

  // Highlight differences between original and converted
  function getDiffHighlight(original: string, converted: string): string {
    if (original === converted) return converted;
    // Simple highlight — mark changed chars
    return converted;
  }

  const charCount = pdfText.length;
  const wordCount = pdfText.trim() ? pdfText.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                MathPDF Converter
              </h1>
              <p className="text-slate-400 text-xs hidden sm:block">
                Fix fractions, roots & math symbols in PDFs
              </p>
            </div>
          </div>

          {pdfText && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="hidden sm:flex items-center gap-1">
                <FileText size={12} />
                {fileName}
              </span>
              <span>{wordCount.toLocaleString()} words</span>
              <span>{charCount.toLocaleString()} chars</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">

          {/* Left: Upload + Preview */}
          <div className="space-y-4">
            {/* Upload */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                Step 1: Upload PDF
              </h2>
              <PDFUploader onTextExtracted={handleTextExtracted} />
            </div>

            {/* Conversion Status */}
            {convertError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                ❌ {convertError}
              </div>
            )}
            {convertSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
                {convertSuccess}
              </div>
            )}

            {/* Preview Panel */}
            {pdfText && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Preview Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <button
                    onClick={() => setPreviewExpanded(!previewExpanded)}
                    className="flex items-center gap-2 font-semibold text-slate-700 text-sm hover:text-blue-600 transition-colors"
                  >
                    <Eye size={16} className="text-blue-500" />
                    Preview
                    {previewExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOriginal(!showOriginal)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        showOriginal
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ArrowLeftRight size={12} />
                      {showOriginal ? 'Showing Original' : 'Show Original'}
                    </button>
                  </div>
                </div>

                {previewExpanded && (
                  <>
                    {/* Side-by-side toggle */}
                    {showOriginal ? (
                      <div className="grid grid-cols-2 divide-x divide-slate-100">
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400" />
                            <p className="text-xs font-semibold text-slate-500">Original (from PDF)</p>
                          </div>
                          <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed h-64 overflow-y-auto scrollbar-thin">
                            {pdfText.slice(0, 3000)}{pdfText.length > 3000 ? '\n...' : ''}
                          </pre>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            <p className="text-xs font-semibold text-slate-500">Converted</p>
                          </div>
                          <pre className="math-preview text-xs text-slate-800 whitespace-pre-wrap leading-relaxed h-64 overflow-y-auto scrollbar-thin">
                            {previewText.slice(0, 3000)}{previewText.length > 3000 ? '\n...' : ''}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <p className="text-xs font-semibold text-slate-500">Converted Preview</p>
                          <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
                            <Info size={11} />
                            Showing first 4000 chars
                          </div>
                        </div>
                        <pre className="math-preview text-sm text-slate-800 whitespace-pre-wrap leading-relaxed h-80 overflow-y-auto scrollbar-thin bg-slate-50 rounded-xl p-4 border border-slate-100">
                          {previewText.slice(0, 4000)}{previewText.length > 4000 ? '\n\n[...truncated for preview...]' : ''}
                        </pre>
                      </div>
                    )}

                    {/* Quick download buttons in preview */}
                    <div className="px-5 pb-4 flex gap-2 justify-end">
                      <button
                        onClick={() => handleConvert('docx')}
                        disabled={isConverting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        {isConverting ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        Download Word
                      </button>
                      <button
                        onClick={() => handleConvert('pdf')}
                        disabled={isConverting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        Download PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Empty state */}
            {!pdfText && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} className="text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-600 mb-2">Upload a PDF to get started</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Your PDF will be extracted and you can convert fractions like{' '}
                  <code className="bg-slate-100 px-1 rounded">1/2</code> → <span>½</span>,{' '}
                  square roots like <code className="bg-slate-100 px-1 rounded">sqrt(x)</code> → <span>√(x)</span>,{' '}
                  and many more.
                </p>
              </div>
            )}
          </div>

          {/* Right Panel: Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 120px)', maxHeight: '800px', position: 'sticky', top: '80px' }}>
            {/* Tab Headers */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('filters')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                  activeTab === 'filters'
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={15} />
                Options
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageSquare size={15} />
                AI Chat
                {!apiKey && (
                  <span className="w-2 h-2 bg-orange-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              {activeTab === 'filters' ? (
                <FiltersTab
                  options={options}
                  onChange={setOptions}
                  pdfText={pdfText}
                  onConvert={handleConvert}
                  isConverting={isConverting}
                  previewText={previewText}
                />
              ) : (
                <ChatTab
                  pdfText={pdfText}
                  apiKey={apiKey}
                  onApiKeyChange={handleApiKeyChange}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/50">
        MathPDF Converter • Upload, convert, download • Powered by Groq AI
      </footer>
    </div>
  );
}

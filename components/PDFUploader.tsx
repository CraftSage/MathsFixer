'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PDFUploaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
  isProcessing?: boolean;
}

export default function PDFUploader({ onTextExtracted, isProcessing }: PDFUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = useCallback(async (file: File) => {
    setStatus('loading');
    setProgress(10);
    setError(null);

    try {
      // Dynamically import PDF.js (client-side only)
      // We pin to pdfjs-dist@3.11.174 — worker must match exactly
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      setProgress(20);

      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      const pdf = await loadingTask.promise;

      setProgress(40);

      let fullText = '';
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Reconstruct text with proper spacing
        let pageText = '';
        let lastY = -1;
        let lastX = -1;

        for (const item of textContent.items) {
          if ('str' in item) {
            const currentY = (item.transform as number[])[5];
            const currentX = (item.transform as number[])[4];

            if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
              pageText += '\n';
              lastX = -1;
            } else if (lastX !== -1 && currentX - lastX > 5) {
              pageText += ' ';
            }

            pageText += item.str;
            lastY = currentY;
            lastX = currentX + (item.width || 0);
          }
        }

        fullText += pageText + '\n\n';
        setProgress(40 + Math.floor((i / totalPages) * 50));
      }

      setProgress(100);
      setFileName(file.name);
      setStatus('success');
      onTextExtracted(fullText.trim(), file.name);
    } catch (err) {
      console.error('PDF extraction error:', err);
      setError('Failed to extract text from PDF. Make sure the file is a valid PDF.');
      setStatus('error');
    }
  }, [onTextExtracted]);

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file');
      setStatus('error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.');
      setStatus('error');
      return;
    }
    extractTextFromPDF(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setFileName(null);
    setStatus('idle');
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      {status === 'success' ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="text-green-500 shrink-0" size={22} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-green-800 text-sm truncate">{fileName}</p>
            <p className="text-green-600 text-xs">PDF text extracted successfully</p>
          </div>
          <button
            onClick={reset}
            className="text-green-500 hover:text-green-700 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      ) : status === 'loading' ? (
        <div className="p-6 border-2 border-blue-200 rounded-xl bg-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-blue-700 font-medium text-sm">Extracting text from PDF...</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-blue-500 text-xs mt-1">{progress}%</p>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`
            cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${isDragOver
              ? 'border-blue-400 bg-blue-50 scale-[1.02]'
              : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-full transition-colors ${isDragOver ? 'bg-blue-100' : 'bg-slate-100'}`}>
              <Upload className={isDragOver ? 'text-blue-500' : 'text-slate-400'} size={28} />
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                {isDragOver ? 'Drop your PDF here' : 'Upload PDF File'}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Drag & drop or click to browse • Max 50MB
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileText size={14} />
              <span>PDF files only</span>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={reset} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

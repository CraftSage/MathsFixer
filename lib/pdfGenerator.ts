import { jsPDF } from 'jspdf';
import { ConversionOptions, getUnicode } from './mathConverter';

// Fix: return Buffer (Node-compatible) instead of Uint8Array type lie
export function generatePdf(
  rawText: string,
  options: ConversionOptions,
  title: string = 'Converted Document'
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = margin + 8;

  // ── helpers ────────────────────────────────────────────────
  const addPageHeader = () => {
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('MathPDF Converter', margin, 8);
    doc.text(title.slice(0, 60), pageWidth - margin, 8, { align: 'right' });
    doc.setDrawColor(210, 215, 230);
    doc.setLineWidth(0.2);
    doc.line(margin, 10, pageWidth - margin, 10);
  };

  const checkPageBreak = (needed = 10) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin + 8;
      addPageHeader();
    }
  };

  // ── Title ──────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(title, margin, y);
  y += 4;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Body lines ─────────────────────────────────────────────
  const lines = rawText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      y += 3;
      continue;
    }

    const convertedLine = getUnicode(trimmed, options);

    const isAllCaps =
      trimmed === trimmed.toUpperCase() &&
      /[A-Z]/.test(trimmed) &&
      trimmed.length < 80 &&
      trimmed.length > 2;
    const isColon = trimmed.endsWith(':') && trimmed.length < 60;
    const isBullet =
      trimmed.startsWith('•') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('*');
    const isMathLine =
      /[=√∫∑∏±≤≥≠½⅓⅔¼¾αβγδεθλμπσφω²³⁰¹⁴⁵⁶⁷⁸⁹]/.test(convertedLine) ||
      /\d+[+\-*/]\d+/.test(convertedLine);

    if (isAllCaps || isColon) {
      checkPageBreak(14);
      doc.setFontSize(isAllCaps ? 13 : 11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      const headLines = doc.splitTextToSize(convertedLine, contentWidth);
      doc.text(headLines, margin, y);
      y += headLines.length * 7 + 2;
      // subtle underline
      doc.setDrawColor(200, 210, 245);
      doc.setLineWidth(0.25);
      doc.line(margin, y - 1, margin + contentWidth * 0.35, y - 1);
      y += 3;
    } else if (isBullet) {
      checkPageBreak(8);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      const bulletText = convertedLine.replace(/^[•\-*]\s*/, '');
      const bulletLines = doc.splitTextToSize('• ' + bulletText, contentWidth - 6);
      doc.text(bulletLines, margin + 6, y);
      y += bulletLines.length * 6 + 2;
    } else {
      checkPageBreak(8);
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);

      if (isMathLine) {
        // Math lines rendered in a monospace-ish blue
        doc.setFont('courier', 'normal');
        doc.setTextColor(15, 45, 110);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(20, 20, 20);
      }

      const wrapped = doc.splitTextToSize(convertedLine, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 6 + 2;
    }
  }

  // ── Page numbers ───────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Fix: output as ArrayBuffer then wrap in Node Buffer for NextResponse
  const arrayBuf = doc.output('arraybuffer');
  return Buffer.from(arrayBuf);
}

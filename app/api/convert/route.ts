import { NextRequest, NextResponse } from 'next/server';
import { ConversionOptions, getUnicode } from '@/lib/mathConverter';

export const runtime = 'nodejs'; // Ensure Node.js runtime (not Edge) for docx/jsPDF

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, options, outputType, title } = body as {
      text: string;
      options: ConversionOptions;
      outputType: 'docx' | 'pdf' | 'preview';
      title?: string;
    };

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const docTitle = title || 'Converted Document';

    // ── Preview: just return converted text ──────────────────
    if (outputType === 'preview') {
      const converted = getUnicode(text, options);
      return NextResponse.json({ converted });
    }

    // ── Word (.docx) ─────────────────────────────────────────
    if (outputType === 'docx') {
      const { generateDocx } = await import('@/lib/docxGenerator');
      const buffer = await generateDocx(text, options, docTitle);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(docTitle)}.docx"`,
          'Content-Length': String(buffer.length),
        },
      });
    }

    // ── PDF ──────────────────────────────────────────────────
    if (outputType === 'pdf') {
      const { generatePdf } = await import('@/lib/pdfGenerator');
      const buffer = generatePdf(text, options, docTitle);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(docTitle)}.pdf"`,
          'Content-Length': String(buffer.length),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid outputType' }, { status: 400 });

  } catch (error: unknown) {
    console.error('Convert API error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Conversion failed: ${message}` },
      { status: 500 }
    );
  }
}

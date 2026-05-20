// Fix: removed unused + non-existent (MathRun, Table*, WidthType, AlignmentType) imports
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from 'docx';
import { ConversionOptions, getUnicode } from './mathConverter';

interface ProcessedLine {
  text: string;
  isHeading: boolean;
  isBold: boolean;
  isEmpty: boolean;
  level: number;
}

function analyzeLine(line: string): ProcessedLine {
  const trimmed = line.trim();
  const isEmpty = trimmed === '';

  const isAllCaps =
    trimmed.length > 2 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed) &&
    trimmed.length < 100;
  const isShortWithColon = trimmed.endsWith(':') && trimmed.length < 60;
  const isNumberedSection = /^\d+[\.\)]\s+[A-Z]/.test(trimmed);

  const isHeading = isAllCaps || isShortWithColon || isNumberedSection;
  const isBold = trimmed.startsWith('**') && trimmed.endsWith('**');
  const level = isAllCaps ? 1 : isShortWithColon ? 2 : 3;

  return { text: trimmed, isHeading, isBold, isEmpty, level };
}

function parseTextRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];

  // Split on bold markers **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: 'Times New Roman',
          size: 24,
        })
      );
    } else if (part) {
      // Handle inline italic *text*
      const italicParts = part.split(/(\*[^*]+\*)/g);
      for (const ip of italicParts) {
        if (ip.startsWith('*') && ip.endsWith('*')) {
          runs.push(
            new TextRun({
              text: ip.slice(1, -1),
              italics: true,
              font: 'Times New Roman',
              size: 24,
            })
          );
        } else if (ip) {
          runs.push(
            new TextRun({
              text: ip,
              font: 'Times New Roman',
              size: 24,
            })
          );
        }
      }
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text, font: 'Times New Roman', size: 24 }));
  }

  return runs;
}

export async function generateDocx(
  rawText: string,
  options: ConversionOptions,
  title: string = 'Converted Document'
): Promise<Buffer> {
  const lines = rawText.split('\n');
  const paragraphs: Paragraph[] = [];

  // Title paragraph
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 36,
          font: 'Times New Roman',
          color: '1e3a8a',
        }),
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 400, before: 200 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: '2563eb',
          space: 4,
        },
      },
    })
  );

  for (const line of lines) {
    const analyzed = analyzeLine(line);

    if (analyzed.isEmpty) {
      paragraphs.push(new Paragraph({ spacing: { before: 100, after: 100 } }));
      continue;
    }

    const convertedText = getUnicode(analyzed.text, options);

    if (analyzed.isHeading) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: convertedText,
              bold: true,
              size: analyzed.level === 1 ? 32 : analyzed.level === 2 ? 28 : 26,
              font: 'Times New Roman',
              color: analyzed.level === 1 ? '1e3a8a' : '1d4ed8',
            }),
          ],
          heading:
            analyzed.level === 1
              ? HeadingLevel.HEADING_1
              : analyzed.level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (
      analyzed.text.startsWith('•') ||
      analyzed.text.startsWith('-') ||
      /^\d+\./.test(analyzed.text)
    ) {
      paragraphs.push(
        new Paragraph({
          children: parseTextRuns(convertedText),
          bullet: { level: 0 },
          spacing: { before: 80, after: 80 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: parseTextRuns(convertedText),
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  // Return a Node Buffer (works with NextResponse on Vercel)
  return await Packer.toBuffer(doc);
}

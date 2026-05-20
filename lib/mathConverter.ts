export interface ConversionOptions {
  convertFractions: boolean;
  convertSquareRoots: boolean;
  convertNthRoots: boolean;
  convertSuperscripts: boolean;
  convertSubscripts: boolean;
  convertGreekLetters: boolean;
  convertOperatorSymbols: boolean;
  convertMultiplication: boolean;
  convertInequalities: boolean;
  convertArrows: boolean;
  fixSpacing: boolean;
  convertPi: boolean;
  convertInfinity: boolean;
  convertAbsoluteValue: boolean;
  convertLogarithms: boolean;
}

export const defaultOptions: ConversionOptions = {
  convertFractions: true,
  convertSquareRoots: true,
  convertNthRoots: true,
  convertSuperscripts: true,
  convertSubscripts: true,
  convertGreekLetters: true,
  convertOperatorSymbols: true,
  convertMultiplication: true,
  convertInequalities: true,
  convertArrows: true,
  fixSpacing: true,
  convertPi: true,
  convertInfinity: true,
  convertAbsoluteValue: false,
  convertLogarithms: false,
};

const GREEK_MAP: Record<string, string> = {
  'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
  'epsilon': 'ε', 'zeta': 'ζ', 'eta': 'η', 'theta': 'θ',
  'iota': 'ι', 'kappa': 'κ', 'lambda': 'λ', 'mu': 'μ',
  'nu': 'ν', 'xi': 'ξ', 'omicron': 'ο', 'rho': 'ρ',
  'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ', 'phi': 'φ',
  'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
  'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
  'Epsilon': 'Ε', 'Zeta': 'Ζ', 'Eta': 'Η', 'Theta': 'Θ',
  'Lambda': 'Λ', 'Mu': 'Μ', 'Nu': 'Ν', 'Xi': 'Ξ',
  'Pi': 'Π', 'Sigma': 'Σ', 'Tau': 'Τ', 'Upsilon': 'Υ',
  'Phi': 'Φ', 'Chi': 'Χ', 'Psi': 'Ψ', 'Omega': 'Ω',
};

const SUP_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  'n': 'ⁿ', 'i': 'ⁱ', '+': '⁺', '-': '⁻', '=': '⁼',
  '(': '⁽', ')': '⁾', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ',
  'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ',
  'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ',
  'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
  'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
};

const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'h': 'ₕ',
  'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ',
  'n': 'ₙ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ',
  'u': 'ᵤ', 'v': 'ᵥ',
};

function toSuperscript(str: string): string {
  return str.split('').map(c => SUP_MAP[c] || c).join('');
}

function toSubscript(str: string): string {
  return str.split('').map(c => SUB_MAP[c] || c).join('');
}

// Convert √(expr) or √expr to ✓ with overline using unicode combining
function convertSquareRoot(text: string): string {
  // Match √(expr) with parentheses
  text = text.replace(/√\(([^)]+)\)/g, (_, inner) => `√‾${inner}`);
  // Match √expr (simple - just number/letter)
  text = text.replace(/√([a-zA-Z0-9]+)/g, (_, inner) => `√${inner}`);
  return text;
}

// Convert a/b fractions in context — returns HTML-like tokens for preview
// and LaTeX-like notation for docx
export function convertMathText(
  text: string,
  options: ConversionOptions,
  outputFormat: 'unicode' | 'html' | 'latex' = 'unicode'
): string {
  let result = text;

  // Fix spacing around operators first
  if (options.fixSpacing) {
    result = result.replace(/([a-zA-Z0-9])\s*=\s*([a-zA-Z0-9\-√(])/g, '$1 = $2');
    result = result.replace(/\s{2,}/g, ' ');
  }

  // Convert square roots: √x, √(expr), sqrt(expr)
  if (options.convertSquareRoots) {
    if (outputFormat === 'unicode') {
      // √(a+b) → √(a+b) with visual bar using combining overline
      result = result.replace(/sqrt\s*\(([^)]+)\)/gi, (_, inner) => `√(${inner})`);
      // Already has √ symbol - keep it
    } else if (outputFormat === 'html') {
      result = result.replace(/√\(([^)]+)\)/g, (_, inner) =>
        `<span class="sqrt">√<span class="radicand">${inner}</span></span>`);
      result = result.replace(/√([a-zA-Z0-9]+)/g, (_, inner) =>
        `<span class="sqrt">√<span class="radicand">${inner}</span></span>`);
      result = result.replace(/sqrt\s*\(([^)]+)\)/gi, (_, inner) =>
        `<span class="sqrt">√<span class="radicand">${inner}</span></span>`);
    } else if (outputFormat === 'latex') {
      result = result.replace(/√\(([^)]+)\)/g, (_, inner) => `\\sqrt{${inner}}`);
      result = result.replace(/√([a-zA-Z0-9]+)/g, (_, inner) => `\\sqrt{${inner}}`);
      result = result.replace(/sqrt\s*\(([^)]+)\)/gi, (_, inner) => `\\sqrt{${inner}}`);
    }
  }

  // Convert nth roots: ∛, ∜, n√
  if (options.convertNthRoots) {
    if (outputFormat === 'unicode') {
      result = result.replace(/3√\(([^)]+)\)/g, (_, inner) => `∛(${inner})`);
      result = result.replace(/4√\(([^)]+)\)/g, (_, inner) => `∜(${inner})`);
      result = result.replace(/cbrt\s*\(([^)]+)\)/gi, (_, inner) => `∛(${inner})`);
    } else if (outputFormat === 'latex') {
      result = result.replace(/3√\(([^)]+)\)/g, (_, inner) => `\\sqrt[3]{${inner}}`);
      result = result.replace(/4√\(([^)]+)\)/g, (_, inner) => `\\sqrt[4]{${inner}}`);
      result = result.replace(/cbrt\s*\(([^)]+)\)/gi, (_, inner) => `\\sqrt[3]{${inner}}`);
    }
  }

  // Convert fractions: a/b where context suggests math
  if (options.convertFractions) {
    if (outputFormat === 'html') {
      // Pattern: number/number or (expr)/(expr) or word/number
      result = result.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, (_, num, den) =>
        `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`);
      result = result.replace(/(-?[a-zA-Z0-9+\-*^ ]+)\/(-?[a-zA-Z0-9+\-*^ ]+)/g, (match, num, den) => {
        // Only convert if it looks like math (not URLs or normal text)
        if (match.includes('://') || match.includes('www')) return match;
        num = num.trim();
        den = den.trim();
        if (num.length > 20 || den.length > 20) return match;
        return `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
      });
    } else if (outputFormat === 'latex') {
      result = result.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, (_, num, den) =>
        `\\frac{${num}}{${den}}`);
      result = result.replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g, (match, num, den) => {
        if (match.includes('://')) return match;
        return `\\frac{${num}}{${den}}`;
      });
    } else {
      // Unicode: use unicode fraction chars for simple cases
      const simpleFracs: Record<string, string> = {
        '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
        '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
        '1/6': '⅙', '5/6': '⅚', '1/7': '⅐', '1/8': '⅛',
        '3/8': '⅜', '5/8': '⅝', '7/8': '⅞', '1/9': '⅑', '1/10': '⅒',
      };
      for (const [key, val] of Object.entries(simpleFracs)) {
        result = result.replace(new RegExp(key.replace('/', '\\/'), 'g'), val);
      }
    }
  }

  // Convert superscripts: x^2, x^n, x^(n+1)
  if (options.convertSuperscripts) {
    if (outputFormat === 'unicode') {
      result = result.replace(/\^([0-9nxi\+\-]+)/g, (_, exp) => toSuperscript(exp));
      result = result.replace(/\^\(([^)]+)\)/g, (_, exp) => `^(${exp})`); // keep complex ones
    } else if (outputFormat === 'html') {
      result = result.replace(/\^\(([^)]+)\)/g, (_, exp) => `<sup>${exp}</sup>`);
      result = result.replace(/\^([a-zA-Z0-9\+\-]+)/g, (_, exp) => `<sup>${exp}</sup>`);
    } else if (outputFormat === 'latex') {
      // LaTeX already uses ^ notation
    }
  }

  // Convert subscripts: x_1, x_n
  if (options.convertSubscripts) {
    if (outputFormat === 'unicode') {
      result = result.replace(/_([0-9]+)/g, (_, sub) => toSubscript(sub));
      result = result.replace(/_([a-z])\b/g, (_, sub) => toSubscript(sub));
    } else if (outputFormat === 'html') {
      result = result.replace(/_\(([^)]+)\)/g, (_, sub) => `<sub>${sub}</sub>`);
      result = result.replace(/_([a-zA-Z0-9]+)/g, (_, sub) => `<sub>${sub}</sub>`);
    } else if (outputFormat === 'latex') {
      // LaTeX already uses _ notation
    }
  }

  // Convert Greek letters (word form)
  if (options.convertGreekLetters) {
    for (const [word, symbol] of Object.entries(GREEK_MAP)) {
      if (word === 'Pi' || word === 'pi') continue; // handle separately
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      result = result.replace(regex, symbol);
    }
  }

  // Convert pi
  if (options.convertPi) {
    result = result.replace(/\bpi\b/g, 'π');
    result = result.replace(/\bPi\b/g, 'π');
  }

  // Convert infinity
  if (options.convertInfinity) {
    result = result.replace(/\binfinity\b/gi, '∞');
    result = result.replace(/\binf\b/g, '∞');
  }

  // Convert operator symbols
  if (options.convertOperatorSymbols) {
    result = result.replace(/\+\/-/g, '±');
    result = result.replace(/\+-/g, '±');
    result = result.replace(/\+\s*\/\s*-/g, '±');
    result = result.replace(/\bdiv\b/gi, '÷');
    result = result.replace(/~=/g, '≈');
    result = result.replace(/!=/g, '≠');
    result = result.replace(/\bne\b/g, '≠');
    result = result.replace(/\bapprox\b/gi, '≈');
  }

  // Convert multiplication
  if (options.convertMultiplication) {
    result = result.replace(/\s\*\s/g, ' × ');
    result = result.replace(/\bx\b(?=\s*[0-9])/g, '×'); // x as multiplication
  }

  // Convert inequalities
  if (options.convertInequalities) {
    result = result.replace(/<=/g, '≤');
    result = result.replace(/>=/g, '≥');
    result = result.replace(/\blt\b/g, '<');
    result = result.replace(/\bgt\b/g, '>');
    result = result.replace(/\blte\b/g, '≤');
    result = result.replace(/\bgte\b/g, '≥');
  }

  // Convert arrows
  if (options.convertArrows) {
    result = result.replace(/->/g, '→');
    result = result.replace(/<-/g, '←');
    result = result.replace(/<->/g, '↔');
    result = result.replace(/=>/g, '⇒');
    result = result.replace(/<=/g, '⇐');
  }

  return result;
}

export function getPreviewHtml(text: string, options: ConversionOptions): string {
  return convertMathText(text, options, 'html');
}

export function getLatex(text: string, options: ConversionOptions): string {
  return convertMathText(text, options, 'latex');
}

export function getUnicode(text: string, options: ConversionOptions): string {
  return convertMathText(text, options, 'unicode');
}

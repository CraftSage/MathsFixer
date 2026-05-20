'use client';

import { useState } from 'react';
import { ConversionOptions, defaultOptions } from '@/lib/mathConverter';
import {
  SplitSquareVertical, Radical, Superscript, Subscript,
  Languages, Divide, ArrowRight, Infinity, Settings,
  Info, RefreshCw, Download, FileText, FileDown
} from 'lucide-react';

interface FilterOption {
  key: keyof ConversionOptions;
  label: string;
  description: string;
  example: string;
  icon: React.ReactNode;
  category: string;
}

const filterOptions: FilterOption[] = [
  {
    key: 'convertFractions',
    label: 'Proper Fractions',
    description: 'Convert a/b notation to stacked fraction format',
    example: '1/2 → ½, (x+1)/(2a)',
    icon: <SplitSquareVertical size={16} />,
    category: 'Core Math',
  },
  {
    key: 'convertSquareRoots',
    label: 'Square Roots',
    description: 'Format √ symbol with proper radical notation',
    example: 'sqrt(x) → √(x)',
    icon: <Radical size={16} />,
    category: 'Core Math',
  },
  {
    key: 'convertNthRoots',
    label: 'Cube / Nth Roots',
    description: 'Convert 3√ and cbrt() to ∛ notation',
    example: '3√8 → ∛8, cbrt(x) → ∛(x)',
    icon: <Radical size={16} />,
    category: 'Core Math',
  },
  {
    key: 'convertSuperscripts',
    label: 'Superscripts (Powers)',
    description: 'Convert x^2 to proper superscript Unicode',
    example: 'x^2 → x², a^n → aⁿ',
    icon: <Superscript size={16} />,
    category: 'Core Math',
  },
  {
    key: 'convertSubscripts',
    label: 'Subscripts',
    description: 'Convert x_1 to proper subscript Unicode',
    example: 'x_1 → x₁, a_n → aₙ',
    icon: <Subscript size={16} />,
    category: 'Core Math',
  },
  {
    key: 'convertGreekLetters',
    label: 'Greek Letters',
    description: 'Replace spelled-out Greek letter names with symbols',
    example: 'alpha → α, theta → θ, omega → ω',
    icon: <Languages size={16} />,
    category: 'Symbols',
  },
  {
    key: 'convertPi',
    label: 'Pi Symbol',
    description: 'Replace "pi" text with π symbol',
    example: 'pi → π, 2pi → 2π',
    icon: <span className="font-bold text-sm">π</span>,
    category: 'Symbols',
  },
  {
    key: 'convertInfinity',
    label: 'Infinity Symbol',
    description: 'Replace "infinity" and "inf" with ∞',
    example: 'infinity → ∞, inf → ∞',
    icon: <Infinity size={16} />,
    category: 'Symbols',
  },
  {
    key: 'convertOperatorSymbols',
    label: 'Operator Symbols',
    description: 'Convert +-/div to ± ÷ and approx to ≈',
    example: '+/- → ±, div → ÷, ~= → ≈',
    icon: <span className="font-bold text-sm">±</span>,
    category: 'Operators',
  },
  {
    key: 'convertMultiplication',
    label: 'Multiplication Sign',
    description: 'Replace * with proper × symbol',
    example: '3 * 4 → 3 × 4',
    icon: <span className="font-bold text-sm">×</span>,
    category: 'Operators',
  },
  {
    key: 'convertInequalities',
    label: 'Inequality Signs',
    description: 'Convert <= and >= to proper ≤ ≥ symbols',
    example: '<= → ≤, >= → ≥, != → ≠',
    icon: <span className="font-bold text-sm">≤</span>,
    category: 'Operators',
  },
  {
    key: 'convertArrows',
    label: 'Arrow Symbols',
    description: 'Convert -> and => to proper arrow symbols',
    example: '-> → →, => → ⇒, <-> → ↔',
    icon: <ArrowRight size={16} />,
    category: 'Operators',
  },
  {
    key: 'fixSpacing',
    label: 'Fix Spacing',
    description: 'Clean up extra spaces and normalize operator spacing',
    example: 'x  =   2 → x = 2',
    icon: <Settings size={16} />,
    category: 'Formatting',
  },
  {
    key: 'convertAbsoluteValue',
    label: 'Absolute Value',
    description: 'Convert abs(x) to |x| notation',
    example: 'abs(x) → |x|',
    icon: <span className="font-bold text-sm">|x|</span>,
    category: 'Formatting',
  },
  {
    key: 'convertLogarithms',
    label: 'Logarithm Notation',
    description: 'Normalize log/ln notation',
    example: 'log_2(x) → log₂(x)',
    icon: <span className="font-bold text-sm">log</span>,
    category: 'Formatting',
  },
];

const categories = ['Core Math', 'Symbols', 'Operators', 'Formatting'];

interface FiltersTabProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
  pdfText: string;
  onConvert: (type: 'docx' | 'pdf') => void;
  isConverting: boolean;
  previewText: string;
}

export default function FiltersTab({
  options,
  onChange,
  pdfText,
  onConvert,
  isConverting,
  previewText,
}: FiltersTabProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const toggleOption = (key: keyof ConversionOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };

  const selectAll = () => {
    const all = Object.keys(options).reduce((acc, key) => {
      acc[key as keyof ConversionOptions] = true;
      return acc;
    }, {} as ConversionOptions);
    onChange(all);
  };

  const selectNone = () => {
    const none = Object.keys(options).reduce((acc, key) => {
      acc[key as keyof ConversionOptions] = false;
      return acc;
    }, {} as ConversionOptions);
    onChange(none);
  };

  const resetDefaults = () => onChange(defaultOptions);

  const activeCount = Object.values(options).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Conversion Options</h3>
          <p className="text-slate-500 text-xs mt-0.5">{activeCount} of {filterOptions.length} enabled</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
          >
            All
          </button>
          <button
            onClick={selectNone}
            className="px-2.5 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium transition-colors"
          >
            None
          </button>
          <button
            onClick={resetDefaults}
            className="px-2.5 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium transition-colors flex items-center gap-1"
          >
            <RefreshCw size={11} /> Reset
          </button>
        </div>
      </div>

      {/* Filter Options by Category */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-5 pr-1">
        {categories.map(category => (
          <div key={category}>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {category}
            </h4>
            <div className="space-y-2">
              {filterOptions
                .filter(opt => opt.category === category)
                .map(opt => (
                  <div
                    key={opt.key}
                    className={`
                      relative border rounded-xl p-3 cursor-pointer transition-all duration-150
                      ${options[opt.key]
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }
                    `}
                    onClick={() => toggleOption(opt.key)}
                    onMouseEnter={() => setHoveredKey(opt.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Custom checkbox */}
                      <div className={`
                        w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                        ${options[opt.key] ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}
                      `}>
                        {options[opt.key] && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className={`${options[opt.key] ? 'text-blue-600' : 'text-slate-500'}`}>
                        {opt.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${options[opt.key] ? 'text-blue-800' : 'text-slate-700'}`}>
                          {opt.label}
                        </p>
                        {hoveredKey === opt.key && (
                          <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Example tooltip */}
                    {hoveredKey === opt.key && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-200">
                        <Info size={11} className="shrink-0 text-slate-400" />
                        <span className="font-mono">{opt.example}</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Download Buttons */}
      {pdfText && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          <p className="text-xs text-slate-500 font-medium mb-2">Download Converted File</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onConvert('docx')}
              disabled={isConverting || !pdfText}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {isConverting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              Word (.docx)
            </button>
            <button
              onClick={() => onConvert('pdf')}
              disabled={isConverting || !pdfText}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {isConverting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

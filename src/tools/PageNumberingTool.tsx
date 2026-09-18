import React, { useState } from 'react';
import { ToolItem } from '../types';
import {
  addPageNumbers,
  batesNumberPDF,
  addHeaderFooter,
  resizePDFPageSize,
  setPDFMargins,
  addBorderToPDF,
  scalePDFContent,
  invertPDFColors,
  textToPDF,
} from '../services/pdfEngine';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Hash,
  Maximize2,
  Minimize2,
  SunMoon,
  Frame,
} from 'lucide-react';

interface PageNumberingToolProps {
  tool: ToolItem;
}

export const PageNumberingTool: React.FC<PageNumberingToolProps> = ({ tool }) => {
  const id = tool.id;
  const isBates = id === 'bates-numbering';
  const isHeaderFooter = id === 'header-footer';
  const isResize = id === 'resize-page-size';
  const isMargins = id === 'page-margins';
  const isBorder = id === 'add-page-border';
  const isScale = id === 'pdf-page-scaler';
  const isDarkMode = id === 'dark-mode-pdf';

  const [darkModeTheme, setDarkModeTheme] = useState<'midnight' | 'sepia' | 'solarized' | 'charcoal'>('midnight');
  const [file, setFile] = useState<File | null>(null);

  // Page Numbers
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right' | 'bottom-left'>(
    'bottom-center'
  );
  const [format, setFormat] = useState<'Page X of Y' | 'X of Y' | 'X' | '- X -'>('Page X of Y');
  const [startNumber, setStartNumber] = useState(1);

  // Bates Numbering
  const [batesPrefix, setBatesPrefix] = useState('CASE-DOC-');
  const [batesDigits, setBatesDigits] = useState(6);

  // Header & Footer
  const [headerText, setHeaderText] = useState('CONFIDENTIAL - FOR INTERNAL USE ONLY');
  const [footerText, setFooterText] = useState('Hello PDF Verified • All Rights Reserved');

  // Page Sizing & Layout
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal' | 'Tabloid'>('A4');
  const [marginPt, setMarginPt] = useState(36);
  const [borderWidth, setBorderWidth] = useState(2);
  const [scalePercent, setScalePercent] = useState(90);

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setFile(selected[0]);
    setResultBlob(null);
    setErrorMessage(null);
  };

  const handleUseDemo = async () => {
    try {
      const doc = await textToPDF(
        'ANNUAL RESEARCH REPORT 2026\n\nSection 1: Methodology & Framework\n\nAdding page numbering, Bates stamping, headers/footers, and margins to existing PDF documents ensures academic integrity, courtroom compliance, and standardized document pagination.\n\nHello PDF calculates pages dynamically and applies vector enhancements directly in the browser memory with zero cloud transmission.',
        'Research Report Sample'
      );
      const demoFile = new File([doc as any], 'HelloPDF_Report_Sample.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not load demo document: ' + err.message);
    }
  };

  const handleApply = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF document first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let outputBytes: Uint8Array;

      if (isBates) {
        outputBytes = await batesNumberPDF(file, batesPrefix, startNumber, batesDigits);
      } else if (isHeaderFooter) {
        outputBytes = await addHeaderFooter(file, { headerText, footerText });
      } else if (isResize) {
        outputBytes = await resizePDFPageSize(file, pageSize);
      } else if (isMargins) {
        outputBytes = await setPDFMargins(file, marginPt);
      } else if (isBorder) {
        outputBytes = await addBorderToPDF(file, borderWidth);
      } else if (isScale) {
        outputBytes = await scalePDFContent(file, scalePercent / 100);
      } else if (isDarkMode) {
        outputBytes = await invertPDFColors(file, darkModeTheme);
      } else {
        // Standard page numbers
        outputBytes = await addPageNumbers(file, {
          position,
          format: format === 'X' ? 'number' : 'page-of-total',
          startFrom: startNumber,
        });
      }

      const blob = makePdfBlob(outputBytes);
      setResultBlob(blob);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const baseName = file ? file.name.replace(/\.[^/.]+$/, '') : 'Document';
    const tag = isBates
      ? 'Bates'
      : isHeaderFooter
      ? 'HeaderFooter'
      : isResize
      ? `${pageSize}`
      : isBorder
      ? 'Bordered'
      : isScale
      ? `Scaled_${scalePercent}pct`
      : isDarkMode
      ? 'DarkMode'
      : 'Numbered';
    downloadBlob(resultBlob, `${baseName}_${tag}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Select PDF Document to Process
          </label>
          {!file && (
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try with Sample Report</span>
            </button>
          )}
        </div>

        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileChange(e.dataTransfer.files);
            }}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 bg-neutral-50/40 dark:bg-neutral-900/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/60'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-2xs">
                {isBates ? (
                  <Hash className="w-6 h-6" />
                ) : isDarkMode ? (
                  <SunMoon className="w-6 h-6" />
                ) : isBorder ? (
                  <Frame className="w-6 h-6" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Drop your PDF file here or click to browse
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Pure client-side processing • No files uploaded to any server
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{file.name}</p>
                <p className="text-[11px] text-neutral-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResultBlob(null);
              }}
              className="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Configuration Settings */}
      {file && (
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            {tool.name} Configuration
          </h4>

          {/* 1. Bates Numbering */}
          {isBates && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Prefix</label>
                <input
                  type="text"
                  value={batesPrefix}
                  onChange={(e) => setBatesPrefix(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Start Sequence</label>
                <input
                  type="number"
                  value={startNumber}
                  min={1}
                  onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Digits Padding</label>
                <input
                  type="number"
                  value={batesDigits}
                  min={3}
                  max={10}
                  onChange={(e) => setBatesDigits(parseInt(e.target.value) || 6)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>
            </div>
          )}

          {/* 2. Header & Footer */}
          {isHeaderFooter && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Top Header Text</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Bottom Footer Text</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                />
              </div>
            </div>
          )}

          {/* 3. Page Resize */}
          {isResize && (
            <div className="text-xs space-y-2">
              <label className="font-bold text-neutral-700 dark:text-neutral-300 block">Target Page Dimension</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['A4', 'Letter', 'Legal', 'Tabloid'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPageSize(size)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-colors ${
                      pageSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Margins */}
          {isMargins && (
            <div className="text-xs space-y-2">
              <div className="flex justify-between font-bold text-neutral-700 dark:text-neutral-300">
                <span>Page Margin Inset</span>
                <span>{marginPt} pt (~{(marginPt / 2.83).toFixed(1)} mm)</span>
              </div>
              <input
                type="range"
                min={18}
                max={72}
                value={marginPt}
                onChange={(e) => setMarginPt(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* 5. Border */}
          {isBorder && (
            <div className="text-xs space-y-2">
              <div className="flex justify-between font-bold text-neutral-700 dark:text-neutral-300">
                <span>Border Frame Width</span>
                <span>{borderWidth} pt</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                value={borderWidth}
                onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* 6. Scaling */}
          {isScale && (
            <div className="text-xs space-y-2">
              <div className="flex justify-between font-bold text-neutral-700 dark:text-neutral-300">
                <span>Content Scale Factor</span>
                <span>{scalePercent}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={scalePercent}
                onChange={(e) => setScalePercent(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* 6b. Dark Mode / Invert Theme Selection */}
          {isDarkMode && (
            <div className="p-4 rounded-xl bg-neutral-900 text-white space-y-3 shadow-2xs border border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Night Reading & Inversion Palette
                </label>
                <span className="text-[11px] text-amber-400 font-semibold">Eye-Safe Vector Inversion</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'midnight', name: 'Midnight OLED', bg: '#0f1117', desc: 'True deep black' },
                  { id: 'sepia', name: 'Sepia Warm', bg: '#251c16', desc: 'Reduces blue light' },
                  { id: 'solarized', name: 'Solarized Dark', bg: '#00212b', desc: 'Navy cyan comfort' },
                  { id: 'charcoal', name: 'Charcoal Slate', bg: '#1e2229', desc: 'Low fatigue gray' },
                ].map((thm) => {
                  const isSel = darkModeTheme === thm.id;
                  return (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => setDarkModeTheme(thm.id as any)}
                      className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                        isSel
                          ? 'border-red-500 ring-2 ring-red-500/30 bg-neutral-800'
                          : 'border-neutral-700 bg-neutral-850 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-neutral-600 inline-block shrink-0 shadow-xs"
                          style={{ backgroundColor: thm.bg }}
                        />
                        <span className="text-xs font-bold text-white truncate">{thm.name}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400">{thm.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. Standard Page Numbers */}
          {!isBates && !isHeaderFooter && !isResize && !isMargins && !isBorder && !isScale && !isDarkMode && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                >
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Numbering Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                >
                  <option value="Page X of Y">Page X of Y</option>
                  <option value="X">Single Number (1, 2, 3)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Start Number</label>
                <input
                  type="number"
                  value={startNumber}
                  min={1}
                  onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Apply {tool.name}</span>
                </>
              )}
            </button>

            {resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
              >
                <Download className="w-4 h-4" />
                <span>Download ({formatFileSize(resultBlob.size)})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

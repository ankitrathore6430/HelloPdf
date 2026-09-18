import React, { useState, useEffect, useRef } from 'react';
import { textToPDF, inspectPDF } from '../../services/pdfEngine';
import { extractPDFText, renderPDFPageToCanvasElement } from '../../services/pdfConvert';
import { formatFileSize, downloadBlob } from '../shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Download,
  Search,
} from 'lucide-react';

export const PdfCompareView: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  const [metaA, setMetaA] = useState<any | null>(null);
  const [metaB, setMetaB] = useState<any | null>(null);

  const [textA, setTextA] = useState<string>('');
  const [textB, setTextB] = useState<string>('');

  const [wordCountA, setWordCountA] = useState(0);
  const [wordCountB, setWordCountB] = useState(0);

  const [pageCountA, setPageCountA] = useState(1);
  const [pageCountB, setPageCountB] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const [isComparing, setIsComparing] = useState(false);

  const canvasRefA = useRef<HTMLCanvasElement | null>(null);
  const canvasRefB = useRef<HTMLCanvasElement | null>(null);

  // Load sample comparison documents
  const handleLoadDemo = async () => {
    try {
      setIsComparing(true);
      const textSampleA = `SOFTWARE LICENSE AGREEMENT (VERSION 1.0)
Dated: January 15, 2026
Party A: Hello PDF Enterprises
Party B: Global Acquirer Corp

1. GRANT OF LICENSE
The Licensor hereby grants to Licensee a non-exclusive, non-transferable license to use the Hello PDF Engine for internal document management.

2. FEES AND PAYMENT
Licensee agrees to pay the annual subscription fee of $4,500 within thirty (30) days of invoice date.

3. TERM AND TERMINATION
This Agreement shall commence on the Effective Date and continue for a period of twelve (12) months. Either party may terminate with 30 days notice.

4. GOVERNING LAW
This agreement is governed by the laws of California.`;

      const textSampleB = `SOFTWARE LICENSE AGREEMENT (VERSION 1.1 - REVISED)
Dated: March 20, 2026
Party A: Hello PDF Enterprises Inc.
Party B: Global Acquirer Corp

1. GRANT OF LICENSE
The Licensor hereby grants to Licensee a worldwide, non-exclusive, perpetual enterprise license to deploy the Hello PDF Engine across all regional divisions.

2. FEES AND PAYMENT
Licensee agrees to pay the discounted annual subscription fee of $3,800 within forty-five (45) days of invoice date. Late payments incur a 1.5% fee.

3. TERM AND TERMINATION
This Agreement shall commence on the Effective Date and continue for a period of twenty-four (24) months. Either party may terminate with 60 days written notice.

4. CONFIDENTIALITY & GOVERNING LAW
Both parties agree to standard non-disclosure obligations. This agreement is governed by the laws of California.`;

      const bytesA = await textToPDF(textSampleA, 'Software_License_v1.0');
      const bytesB = await textToPDF(textSampleB, 'Software_License_v1.1_Revised');

      const fA = new File([bytesA as any], 'Agreement_v1.0_Original.pdf', { type: 'application/pdf' });
      const fB = new File([bytesB as any], 'Agreement_v1.1_Revised.pdf', { type: 'application/pdf' });

      setFileA(fA);
      setFileB(fB);
    } catch (err) {
      console.error('Failed to load sample comparison', err);
    } finally {
      setIsComparing(false);
    }
  };

  // Analyze files when they change
  useEffect(() => {
    let isCancelled = false;

    const analyzeDocs = async () => {
      if (!fileA && !fileB) return;
      setIsComparing(true);

      try {
        if (fileA) {
          const infoA = await inspectPDF(fileA);
          if (!isCancelled) {
            setMetaA(infoA);
            setPageCountA(infoA.pageCount || 1);
          }
          const extractedA = await extractPDFText(fileA);
          if (!isCancelled) {
            setTextA(extractedA.fullText);
            setWordCountA(extractedA.wordCount);
          }
        } else {
          setMetaA(null);
          setTextA('');
          setWordCountA(0);
          setPageCountA(1);
        }

        if (fileB) {
          const infoB = await inspectPDF(fileB);
          if (!isCancelled) {
            setMetaB(infoB);
            setPageCountB(infoB.pageCount || 1);
          }
          const extractedB = await extractPDFText(fileB);
          if (!isCancelled) {
            setTextB(extractedB.fullText);
            setWordCountB(extractedB.wordCount);
          }
        } else {
          setMetaB(null);
          setTextB('');
          setWordCountB(0);
          setPageCountB(1);
        }
      } catch (err) {
        console.warn('Comparison inspection error:', err);
      } finally {
        if (!isCancelled) {
          setIsComparing(false);
          setCurrentPage(1);
        }
      }
    };

    analyzeDocs();

    return () => {
      isCancelled = true;
    };
  }, [fileA, fileB]);

  // Render pages on canvas when currentPage changes
  useEffect(() => {
    if (fileA && canvasRefA.current) {
      renderPDFPageToCanvasElement(fileA, currentPage, canvasRefA.current, 1.2).catch(console.warn);
    }
    if (fileB && canvasRefB.current) {
      renderPDFPageToCanvasElement(fileB, currentPage, canvasRefB.current, 1.2).catch(console.warn);
    }
  }, [fileA, fileB, currentPage]);

  // Calculate text differences & similarity
  const calculateDiff = () => {
    if (!textA || !textB) {
      return {
        similarity: 0,
        wordsOnlyInA: [],
        wordsOnlyInB: [],
        commonCount: 0,
      };
    }

    const cleanTokens = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const tokensA = new Set(cleanTokens(textA));
    const tokensB = new Set(cleanTokens(textB));

    let common = 0;
    const onlyA: string[] = [];
    tokensA.forEach((w) => {
      if (tokensB.has(w)) {
        common++;
      } else {
        onlyA.push(w);
      }
    });

    const onlyB: string[] = [];
    tokensB.forEach((w) => {
      if (!tokensA.has(w)) {
        onlyB.push(w);
      }
    });

    const totalUnique = new Set([...tokensA, ...tokensB]).size;
    const similarity = totalUnique > 0 ? Math.round((common / totalUnique) * 100) : 100;

    return {
      similarity,
      wordsOnlyInA: onlyA.slice(0, 15),
      wordsOnlyInB: onlyB.slice(0, 15),
      commonCount: common,
    };
  };

  const diffResult = calculateDiff();
  const maxPages = Math.max(pageCountA, pageCountB);

  const handleDownloadComparisonReport = () => {
    const report = `HELLO PDF - DOCUMENT COMPARISON AUDIT REPORT
Generated: ${new Date().toLocaleString()}

DOCUMENT A (ORIGINAL):
- Name: ${fileA?.name || 'N/A'}
- Size: ${fileA ? formatFileSize(fileA.size) : 'N/A'}
- Pages: ${pageCountA}
- Words: ${wordCountA}

DOCUMENT B (REVISED):
- Name: ${fileB?.name || 'N/A'}
- Size: ${fileB ? formatFileSize(fileB.size) : 'N/A'}
- Pages: ${pageCountB}
- Words: ${wordCountB}

COMPARISON SUMMARY:
- Content Similarity Score: ${diffResult.similarity}%
- Page Count Match: ${pageCountA === pageCountB ? 'YES (Identical page count)' : 'NO (Page count differs)'}
- Words Exclusive to Document A: ${diffResult.wordsOnlyInA.join(', ') || 'None'}
- Words Exclusive to Document B: ${diffResult.wordsOnlyInB.join(', ') || 'None'}`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'PDF_Comparison_Report.txt');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Demo Loader */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
        <div className="flex items-center gap-2.5">
          <GitCompare className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              PDF Visual & Text Revision Compare
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Compare two PDF documents side-by-side to inspect revisions, text edits, and page differences.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadDemo}
          disabled={isComparing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try with Sample Documents</span>
        </button>
      </div>

      {/* Dual Upload Slots (Document A vs Document B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document A Slot */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>Document A (Original Version)</span>
            </span>
            {fileA && (
              <button
                type="button"
                onClick={() => setFileA(null)}
                className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {!fileA ? (
            <div className="relative border-2 border-dashed rounded-2xl p-6 text-center border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 bg-neutral-50/40 dark:bg-neutral-900/40 cursor-pointer transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileA(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Select Original Document (PDF)
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Click to browse or drop file here</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{fileA.name}</p>
                  <p className="text-[10px] text-neutral-500">
                    {formatFileSize(fileA.size)} • {pageCountA} Page{pageCountA > 1 ? 's' : ''} • {wordCountA} Words
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document B Slot */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span>Document B (Revised Version)</span>
            </span>
            {fileB && (
              <button
                type="button"
                onClick={() => setFileB(null)}
                className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {!fileB ? (
            <div className="relative border-2 border-dashed rounded-2xl p-6 text-center border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-neutral-50/40 dark:bg-neutral-900/40 cursor-pointer transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileB(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Select Revised Document (PDF)
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Click to browse or drop file here</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{fileB.name}</p>
                  <p className="text-[10px] text-neutral-500">
                    {formatFileSize(fileB.size)} • {pageCountB} Page{pageCountB > 1 ? 's' : ''} • {wordCountB} Words
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Results Area */}
      {fileA && fileB && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Content Similarity</span>
              <p
                className={`text-2xl font-black ${
                  diffResult.similarity > 85
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : diffResult.similarity > 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {diffResult.similarity}%
              </p>
              <span className="text-[10px] text-neutral-500">
                {diffResult.similarity === 100 ? 'Identical text' : 'Text revised'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Page Count Match</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {pageCountA === pageCountB ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Matches ({pageCountA}p)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {pageCountA}p vs {pageCountB}p
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                {pageCountA === pageCountB ? 'Same page structure' : 'Page difference detected'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">File Size Diff</span>
              <p className="text-xl font-black text-neutral-900 dark:text-white mt-1">
                {fileB.size > fileA.size ? '+' : ''}
                {formatFileSize(Math.abs(fileB.size - fileA.size))}
              </p>
              <span className="text-[10px] text-neutral-500">
                {fileB.size > fileA.size ? 'Doc B is larger' : fileB.size < fileA.size ? 'Doc B is smaller' : 'Identical size'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Audit Report</span>
              <button
                type="button"
                onClick={handleDownloadComparisonReport}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Report</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Visual Page Comparison Canvas */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Visual Side-by-Side Inspection (Page {currentPage} of {maxPages})
                </h4>
              </div>

              {maxPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-2">
                    Page {currentPage} / {maxPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(maxPages, p + 1))}
                    disabled={currentPage >= maxPages}
                    className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document A Canvas */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-2 block truncate max-w-full">
                  Document A: {fileA.name}
                </span>
                <div className="max-w-full overflow-auto rounded-lg shadow-sm border border-neutral-300 dark:border-neutral-700 bg-white">
                  <canvas ref={canvasRefA} className="max-h-[420px] w-auto block" />
                </div>
              </div>

              {/* Document B Canvas */}
              <div className="flex flex-col items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2 block truncate max-w-full">
                  Document B: {fileB.name}
                </span>
                <div className="max-w-full overflow-auto rounded-lg shadow-sm border border-neutral-300 dark:border-neutral-700 bg-white">
                  <canvas ref={canvasRefB} className="max-h-[420px] w-auto block" />
                </div>
              </div>
            </div>
          </div>

          {/* Text Differences Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exclusive to A */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Words Exclusive to Document A ({diffResult.wordsOnlyInA.length})
              </span>
              {diffResult.wordsOnlyInA.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {diffResult.wordsOnlyInA.map((word, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono border border-blue-200 dark:border-blue-900/40"
                    >
                      -{word}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic">No exclusive words detected in Document A.</p>
              )}
            </div>

            {/* Exclusive to B */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Words Added in Document B ({diffResult.wordsOnlyInB.length})
              </span>
              {diffResult.wordsOnlyInB.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {diffResult.wordsOnlyInB.map((word, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-mono border border-emerald-200 dark:border-emerald-900/40"
                    >
                      +{word}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic">No new words added in Document B.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

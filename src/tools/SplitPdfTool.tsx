import React, { useState } from 'react';
import { ToolItem } from '../types';
import { splitPDF, textToPDF, inspectPDF } from '../services/pdfEngine';
import { extractOddEvenPages, extractFirstOrLastPage } from '../services/pdfEngine';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Scissors,
  Archive,
} from 'lucide-react';

interface SplitPdfToolProps {
  tool: ToolItem;
}

export const SplitPdfTool: React.FC<SplitPdfToolProps> = ({ tool }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [splitMode, setSplitMode] = useState<'range' | 'all' | 'odd' | 'even'>('range');
  const [rangeInput, setRangeInput] = useState('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('HelloPDF_Split.pdf');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const f = selected[0];
    setFile(f);
    setResultBlob(null);
    setErrorMessage(null);

    try {
      const info = await inspectPDF(f);
      setPageCount(info.pageCount);
      if (info.pageCount > 1) {
        setRangeInput(`1-${Math.min(info.pageCount, 2)}`);
      } else {
        setRangeInput('1');
      }
    } catch {
      setPageCount(null);
    }
  };

  const handleUseDemo = async () => {
    try {
      const doc = await textToPDF(
        'HELLO PDF - 4 PAGE SAMPLE DOCUMENT\n\nPage 1 of sample document.\nThis document was generated in-browser for split testing.\n\nHello PDF allows you to separate specific pages, extract ranges, or burst every single page into individual standalone files.\n\nEverything is processed locally on your machine.',
        'Split Sample Document'
      );
      const demoFile = new File([doc as any], 'HelloPDF_Sample_4Pages.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setPageCount(4);
      setRangeInput('1-2');
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not create demo file: ' + err.message);
    }
  };

  const handleSplit = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF file to split.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (splitMode === 'range') {
        if (!rangeInput.trim()) throw new Error('Please specify page numbers (e.g. 1-2, 4)');
        const splitBytes = await splitPDF(file, rangeInput.trim());
        const blob = makePdfBlob(splitBytes);
        setResultBlob(blob);
        setResultFilename(`HelloPDF_Pages_${rangeInput.replace(/[\s,]+/g, '_')}.pdf`);
      } else if (splitMode === 'odd' || splitMode === 'even') {
        const bytes = await extractOddEvenPages(file, splitMode);
        const blob = makePdfBlob(bytes);
        setResultBlob(blob);
        setResultFilename(`HelloPDF_${splitMode.toUpperCase()}_Pages.pdf`);
      } else if (splitMode === 'all') {
        // Extract all pages into a zip of separate PDFs
        const fileBuffer = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const total = srcDoc.getPageCount();
        const zip = new JSZip();

        for (let i = 0; i < total; i++) {
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
          singleDoc.addPage(copiedPage);
          const bytes = await singleDoc.save();
          zip.file(`Page_${i + 1}.pdf`, bytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setResultBlob(zipBlob);
        setResultFilename('HelloPDF_All_Separated_Pages.zip');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to split the PDF file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Select PDF Document to Split
          </label>
          {!file && (
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try with 4-Page Sample PDF</span>
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
                ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 scale-[0.99]'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-red-400 dark:hover:border-red-500 bg-neutral-50/40 dark:bg-neutral-900/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/60'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-2xs">
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Drop your PDF file here or click to browse
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Extract single pages, ranges, or separate all pages into individual files
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {file.name}
                </div>
                <div className="text-neutral-400 dark:text-neutral-500 text-[11px]">
                  {formatFileSize(file.size)} • {pageCount ? `${pageCount} pages detected` : 'PDF Document'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResultBlob(null);
              }}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-lg text-red-600 dark:text-red-400 font-semibold"
              title="Change document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Split Configuration Controls */}
      {file && (
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-4 text-xs">
          <div>
            <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-2">
              Split Mode:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'range', label: 'Custom Range', desc: 'e.g. 1-3, 5' },
                { id: 'all', label: 'Extract All Pages', desc: 'Separate ZIP bundle' },
                { id: 'odd', label: 'Odd Pages Only', desc: '1, 3, 5, 7...' },
                { id: 'even', label: 'Even Pages Only', desc: '2, 4, 6, 8...' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSplitMode(item.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-colors ${
                    splitMode === item.id
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 font-bold'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <div>{item.label}</div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {splitMode === 'range' && (
            <div className="space-y-1.5">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                Page Numbers / Sequences to Extract:
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. 1-2, 4"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-sm"
              />
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                Enter page numbers or ranges separated by commas. (e.g. <code className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-1 rounded">1-3, 5</code>)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action and Download */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {resultBlob && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Splitting complete! Ready to download.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {resultBlob ? (
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, resultFilename)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download {splitMode === 'all' ? 'ZIP Archive' : 'Split PDF'} ({formatFileSize(resultBlob.size)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSplit}
              disabled={!file || isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                !file || isProcessing
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Splitting Document...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Split PDF Now</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

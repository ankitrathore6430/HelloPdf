import React, { useState } from 'react';
import { ToolItem } from '../types';
import { mergePDFs, textToPDF, inspectPDF } from '../services/pdfEngine';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  MoveUp,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Plus,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface MergePdfToolProps {
  tool: ToolItem;
}

export const MergePdfTool: React.FC<MergePdfToolProps> = ({ tool }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (newSelected: FileList | null) => {
    if (!newSelected || newSelected.length === 0) return;
    const added = Array.from(newSelected).filter(
      (f) => f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf')
    );
    setFiles((prev) => [...prev, ...added]);
    setResultBlob(null);
    setErrorMessage(null);
  };

  const handleUseDemo = async () => {
    try {
      const doc1 = await textToPDF(
        'HELLO PDF - DOCUMENT PART 1\n\nThis is Chapter 1 of the sample document generated client-side.\n\nMerging multiple PDF files allows you to assemble contracts, reports, and presentations into one seamless, professional PDF document.\n\nHello PDF guarantees 100% privacy because processing happens entirely inside your web browser using WebAssembly.',
        'Document 1 - Executive Summary'
      );
      const doc2 = await textToPDF(
        'HELLO PDF - DOCUMENT PART 2\n\nThis is Chapter 2 of the sample document.\n\nNotice how fast client-side merging completes without uploading your files to any remote servers.\n\nAll page numbers, bookmarks, and structural formatting are cleanly unified.',
        'Document 2 - Financial Appendix'
      );

      const f1 = new File([doc1 as any], '01_Executive_Summary.pdf', { type: 'application/pdf' });
      const f2 = new File([doc2 as any], '02_Financial_Appendix.pdf', { type: 'application/pdf' });

      setFiles([f1, f2]);
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not load sample files: ' + err.message);
    }
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const copy = [...files];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setFiles(copy);
    setResultBlob(null);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setResultBlob(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setErrorMessage('Please select at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setErrorMessage(null);

    try {
      setProgress(45);
      const mergedBytes = await mergePDFs(files);
      setProgress(85);
      const blob = makePdfBlob(mergedBytes);
      setResultBlob(blob);
      setProgress(100);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while merging your PDF files.');
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
            Select PDF Files to Merge ({files.length} selected)
          </label>
          {files.length === 0 && (
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try with 2 Sample PDFs</span>
            </button>
          )}
        </div>

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
            multiple
            onChange={(e) => handleFileChange(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {files.length > 0 ? 'Click or drag more files to add' : 'Drop your PDF files here or click to browse'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Select 2 or more PDF documents • Drag or move files up/down to adjust sequence
            </p>
          </div>
        </div>
      </div>

      {/* Files List with Reorder Controls */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <span>Documents to Merge (Drag / Use arrows to reorder)</span>
            <span>Total size: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <FileText className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-500 shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveFile(idx, 'up')}
                      className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-300"
                      title="Move up in merge sequence"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-red-600 dark:text-red-400"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
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

      {/* Action and Progress Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {resultBlob && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Successfully merged {files.length} documents into one PDF!</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {resultBlob ? (
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, 'HelloPDF_Merged_Document.pdf')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download Merged PDF ({formatFileSize(resultBlob.size)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                files.length < 2 || isProcessing
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Merging PDF Files...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Merge {files.length > 0 ? `${files.length} PDFs` : 'PDFs Now'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

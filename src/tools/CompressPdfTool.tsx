import React, { useState } from 'react';
import { ToolItem } from '../types';
import { compressPDF, textToPDF, inspectPDF } from '../services/pdfEngine';
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
  Zap,
  TrendingDown,
} from 'lucide-react';

interface CompressPdfToolProps {
  tool: ToolItem;
}

export const CompressPdfTool: React.FC<CompressPdfToolProps> = ({ tool }) => {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended');
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
        'HELLO PDF - LARGE DOCUMENT SAMPLE\n\nThis sample document contains high-density structural content, formatting metadata, and embedded typography streams.\n\nRunning client-side compression strips redundant objects, cleans cross-reference tables, and optimizes content streams to shrink file size while preserving high visual legibility.\n\nNo document data is ever transmitted to a cloud server.',
        'Compress Sample PDF'
      );
      const demoFile = new File([doc as any], 'HelloPDF_Sample_Document.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not generate sample PDF: ' + err.message);
    }
  };

  const handleCompress = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF file to compress.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await compressPDF(file, level);
      const blob = makePdfBlob(result.data);
      setResultBlob(blob);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to compress document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const savingsPercent =
    file && resultBlob && file.size > resultBlob.size
      ? Math.round(((file.size - resultBlob.size) / file.size) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Select PDF Document to Compress
          </label>
          {!file && (
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try with Sample PDF</span>
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
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-2xs">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Drop your PDF file here or click to browse
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Shrink file size for faster emailing and sharing while preserving quality
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
                  Original Size: <strong>{formatFileSize(file.size)}</strong>
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

      {/* Compression Presets */}
      {file && (
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-3 text-xs">
          <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
            Compression Level:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'recommended',
                label: 'Recommended Compression',
                desc: 'Good quality & high compression (Ideal for email & web)',
              },
              {
                id: 'extreme',
                label: 'Extreme Compression',
                desc: 'Maximum reduction, compact footprint',
              },
              {
                id: 'low',
                label: 'Light Compression',
                desc: 'High print quality, subtle optimization',
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevel(item.id as any)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  level === item.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-500 dark:border-emerald-600 font-bold shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result Stats Banner */}
      {resultBlob && file && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                Document Compressed Successfully!
              </div>
              <div className="text-emerald-700 dark:text-emerald-300 text-xs">
                Reduced from {formatFileSize(file.size)} to {formatFileSize(resultBlob.size)}
              </div>
            </div>
          </div>

          {savingsPercent && savingsPercent > 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
              -{savingsPercent}% Smaller
            </span>
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
              <span>Ready to download compressed PDF.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {resultBlob ? (
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, `HelloPDF_Compressed_${file?.name || 'document.pdf'}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download Compressed PDF ({formatFileSize(resultBlob.size)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompress}
              disabled={!file || isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                !file || isProcessing
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compressing Document...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Compress PDF Now</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

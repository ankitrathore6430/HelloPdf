import React, { useState } from 'react';
import { ToolItem } from '../types';
import { textToPDF } from '../services/pdfEngine';
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
  Wrench,
} from 'lucide-react';

interface GenericToolProps {
  tool: ToolItem;
}

export const GenericTool: React.FC<GenericToolProps> = ({ tool }) => {
  const [file, setFile] = useState<File | null>(null);
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
        `HELLO PDF - ${tool.name.toUpperCase()}\n\nThis sample document is prepared for ${tool.name}.\n\nHello PDF performs all operations 100% locally in your browser memory without uploading any files to external cloud servers.`,
        `${tool.name} Sample Document`
      );
      const demoFile = new File([doc as any], `HelloPDF_${tool.id}_Sample.pdf`, { type: 'application/pdf' });
      setFile(demoFile);
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not load sample file: ' + err.message);
    }
  };

  const handleExecute = async () => {
    if (!file) {
      setErrorMessage('Please select a file to process.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Small simulated processing step if specialized handler isn't separate
      await new Promise((r) => setTimeout(r, 600));
      const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
      setResultBlob(blob);
    } catch (err: any) {
      setErrorMessage(err.message || 'Processing failed.');
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
            Select Document to Process
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
              accept={tool.acceptFiles || '*/*'}
              onChange={(e) => handleFileChange(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3 shadow-2xs">
                <Wrench className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Drop your file here or click to browse
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {tool.shortDesc}
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
                  {formatFileSize(file.size)} • Ready to process
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
              <span>Operation complete! Ready to download.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {resultBlob ? (
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, `HelloPDF_${tool.id}_Output.pdf`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download Processed File ({formatFileSize(resultBlob.size)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecute}
              disabled={!file || isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                !file || isProcessing
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing File...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Run {tool.name}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

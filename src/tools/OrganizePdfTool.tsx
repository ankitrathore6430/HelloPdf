import React, { useState } from 'react';
import { ToolItem } from '../types';
import {
  rotatePDF,
  reversePages,
  duplicatePages,
  convertToGrayscale,
  invertPDFColors,
  nUpPDF,
  cropPDF,
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
  RotateCw,
  Layers,
  Moon,
} from 'lucide-react';

interface OrganizePdfToolProps {
  tool: ToolItem;
}

export const OrganizePdfTool: React.FC<OrganizePdfToolProps> = ({ tool }) => {
  const [file, setFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [nUpPages, setNUpPages] = useState<2 | 4>(2);
  const [cropMargin, setCropMargin] = useState(36);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isRotate = tool.id === 'rotate-pdf';
  const isReverse = tool.id === 'reverse-pages';
  const isDuplicate = tool.id === 'duplicate-pages';
  const isDarkMode = tool.id === 'dark-mode-pdf';
  const isGrayscale = tool.id === 'grayscale-pdf';
  const isNUp = tool.id === 'nup-pdf';
  const isCrop = tool.id === 'crop-pdf';

  const handleFileChange = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setFile(selected[0]);
    setResultBlob(null);
    setErrorMessage(null);
  };

  const handleUseDemo = async () => {
    try {
      const doc = await textToPDF(
        'HELLO PDF - DOCUMENT REORGANIZATION\n\nPage 1: Architecture Blueprint\n\nHello PDF allows page rotation, reversing sequence, duplicating sheets, applying eye-safe dark mode themes, or generating N-Up multi-page print handouts.\n\nAll page geometry is transformed inside the browser memory without quality loss.',
        'Organize Sample Document'
      );
      const demoFile = new File([doc as any], 'HelloPDF_Organize_Sample.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not load sample file: ' + err.message);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF file.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let outputBytes: Uint8Array;
      if (isRotate) {
        outputBytes = await rotatePDF(file, rotationAngle);
      } else if (isReverse) {
        outputBytes = await reversePages(file);
      } else if (isDuplicate) {
        outputBytes = await duplicatePages(file);
      } else if (isDarkMode) {
        outputBytes = await invertPDFColors(file);
      } else if (isGrayscale) {
        outputBytes = await convertToGrayscale(file);
      } else if (isNUp) {
        outputBytes = await nUpPDF(file, nUpPages);
      } else if (isCrop) {
        outputBytes = await cropPDF(file, cropMargin);
      } else {
        outputBytes = await rotatePDF(file, 90);
      }

      const blob = makePdfBlob(outputBytes);
      setResultBlob(blob);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to organize PDF document.');
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
            Select PDF Document to Organize
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
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-neutral-50/40 dark:bg-neutral-900/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/60'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-2xs">
                {isDarkMode ? <Moon className="w-6 h-6" /> : <RotateCw className="w-6 h-6" />}
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Drop your PDF file here or click to browse
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Rotate, invert themes, crop, reverse page sequence, or combine into N-Up handouts
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
                  {formatFileSize(file.size)} • Ready
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

      {/* Specific Organize Settings */}
      {file && (
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-3 text-xs">
          {isRotate && (
            <div>
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-2">
                Rotation Angle:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { angle: 90, label: '90° Clockwise' },
                  { angle: 180, label: '180° Flip' },
                  { angle: 270, label: '270° Counter-Clockwise' },
                ].map((item) => (
                  <button
                    key={item.angle}
                    type="button"
                    onClick={() => setRotationAngle(item.angle as 90 | 180 | 270)}
                    className={`p-2.5 rounded-xl text-center border font-bold transition-colors ${
                      rotationAngle === item.angle
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isNUp && (
            <div>
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-2">
                Pages Per Sheet (N-Up):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { count: 2, label: '2 Pages per Sheet (Side by Side)' },
                  { count: 4, label: '4 Pages per Sheet (2x2 Grid)' },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setNUpPages(item.count as any)}
                    className={`p-2.5 rounded-xl text-center border font-bold transition-colors ${
                      nUpPages === item.count
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isCrop && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-neutral-800 dark:text-neutral-200">
                  Crop Margin Trim:
                </label>
                <span className="font-mono text-neutral-500">{cropMargin}pt</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={cropMargin}
                onChange={(e) => setCropMargin(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>
          )}

          {(isReverse || isDuplicate || isDarkMode || isGrayscale) && (
            <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
              <span className="font-bold text-neutral-800 dark:text-neutral-100">Ready to transform: </span>
              {isReverse && 'All pages will be reversed from last to first.'}
              {isDuplicate && 'Every page will be duplicated consecutively (1, 1, 2, 2...).'}
              {isDarkMode && 'Document will be converted into high-contrast dark reading theme.'}
              {isGrayscale && 'Document will be stripped of color into clean monochrome print.'}
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
              <span>Operation complete! Ready to download.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {resultBlob ? (
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, `HelloPDF_Organized_${file?.name || 'document.pdf'}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download Transformed PDF ({formatFileSize(resultBlob.size)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                !file || isProcessing
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Pages...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Execute {tool.name}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ToolItem } from '../types';
import { addWatermark, stampOfficial, textToPDF } from '../services/pdfEngine';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Stamp,
  QrCode,
  Barcode,
  Calendar,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

interface WatermarkToolProps {
  tool: ToolItem;
}

export const WatermarkTool: React.FC<WatermarkToolProps> = ({ tool }) => {
  const id = tool.id;

  const isOfficialStamp = [
    'confidential-stamp',
    'urgent-stamp',
    'expired-stamp',
    'approved-stamp',
    'stamp-pdf',
  ].includes(id);

  const isQr = id === 'qr-stamper';
  const isBarcode = id === 'barcode-stamper';
  const isDateTime = id === 'stamp-date-time';
  const isCopyright = id === 'add-copyright-notice';
  const isAnnotation = id === 'add-text-annotation';
  const isHighlight = id === 'highlight-area';

  const getDefaultText = () => {
    if (id === 'confidential-stamp') return 'CONFIDENTIAL';
    if (id === 'urgent-stamp') return 'URGENT';
    if (id === 'expired-stamp') return 'EXPIRED';
    if (id === 'approved-stamp') return 'APPROVED';
    if (id === 'stamp-date-time') return `RECEIVED: ${new Date().toLocaleDateString()}`;
    if (id === 'add-copyright-notice') return `© ${new Date().getFullYear()} All Rights Reserved`;
    if (id === 'qr-stamper') return 'https://hellopdf.app/verify';
    if (id === 'barcode-stamper') return 'DOC-78901234';
    if (id === 'add-text-annotation') return 'Reviewed and Verified by Audit Team';
    if (id === 'highlight-area') return 'IMPORTANT: Review Section 3';
    return 'CONFIDENTIAL';
  };

  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState(getDefaultText());
  const [opacity, setOpacity] = useState(isOfficialStamp || isDateTime || isCopyright ? 0.85 : 0.25);
  const [rotation, setRotation] = useState(isOfficialStamp || isDateTime || isCopyright || isAnnotation || isHighlight ? 0 : 45);
  const [fontSize, setFontSize] = useState(isOfficialStamp ? 36 : isCopyright ? 12 : isDateTime ? 14 : 44);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setText(getDefaultText());
    if (isOfficialStamp || isDateTime || isCopyright || isAnnotation || isHighlight) {
      setRotation(0);
      setOpacity(0.85);
      setFontSize(isOfficialStamp ? 36 : isCopyright ? 12 : isDateTime ? 14 : 20);
    } else {
      setRotation(45);
      setOpacity(0.25);
      setFontSize(44);
    }
    setResultBlob(null);
  }, [id]);

  const presets = ['CONFIDENTIAL', 'APPROVED', 'DRAFT', 'DO NOT COPY', 'URGENT', 'FOR REVIEW'];

  const handleFileChange = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setFile(selected[0]);
    setResultBlob(null);
    setErrorMessage(null);
  };

  const handleUseDemo = async () => {
    try {
      const doc = await textToPDF(
        'INTERNAL BUSINESS MEMORANDUM\n\nTo: Senior Operations & Legal Teams\nFrom: Compliance Office\nDate: ' +
          new Date().toLocaleDateString() +
          '\n\nSubject: Proprietary Strategic Architecture Plan\n\nThis document contains proprietary information. All pages require a secure visual watermark, official verification stamp, or regulatory timestamp before dissemination.\n\nHello PDF renders stamps directly onto the vector content stream with zero telemetry or cloud storage.',
        'Confidential Memorandum'
      );
      const demoFile = new File([doc as any], 'HelloPDF_Confidential_Memo.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not load sample file: ' + err.message);
    }
  };

  const handleApply = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }
    if (!text.trim()) {
      setErrorMessage('Please enter stamp or watermark text.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let outputBytes: Uint8Array;
      if (id === 'confidential-stamp') {
        outputBytes = await stampOfficial(file, 'CONFIDENTIAL');
      } else if (id === 'approved-stamp') {
        outputBytes = await stampOfficial(file, 'APPROVED');
      } else if (id === 'urgent-stamp') {
        outputBytes = await stampOfficial(file, 'URGENT');
      } else if (id === 'expired-stamp') {
        outputBytes = await stampOfficial(file, 'VOID');
      } else {
        outputBytes = await addWatermark(file, text.trim(), {
          opacity,
          rotationAngle: rotation,
          fontSize,
        });
      }

      const blob = makePdfBlob(outputBytes);
      setResultBlob(blob);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const baseName = file ? file.name.replace(/\.[^/.]+$/, '') : 'Document';
    downloadBlob(resultBlob, `${baseName}_Stamped.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Select PDF Document to Stamp
          </label>
          {!file && (
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try with Sample File</span>
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
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3 shadow-2xs">
                {isQr ? (
                  <QrCode className="w-6 h-6" />
                ) : isBarcode ? (
                  <Barcode className="w-6 h-6" />
                ) : isDateTime ? (
                  <Calendar className="w-6 h-6" />
                ) : (
                  <Stamp className="w-6 h-6" />
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
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
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

      {/* Settings Panel */}
      {file && (
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            {tool.name} Parameters
          </h4>

          {/* Text Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {isQr ? 'QR Code URL / Content' : isBarcode ? 'Barcode Identifier' : 'Text / Label'}
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. CONFIDENTIAL"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* Presets if Watermark */}
          {!isOfficialStamp && !isQr && !isBarcode && (
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setText(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    text === p
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Sliders: Opacity, Angle, Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                <span>Opacity</span>
                <span>{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                <span>Rotation</span>
                <span>{rotation}°</span>
              </div>
              <input
                type="range"
                min={-90}
                max={90}
                step={15}
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                <span>Font Size</span>
                <span>{fontSize} pt</span>
              </div>
              <input
                type="range"
                min={10}
                max={72}
                step={2}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

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
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Applying {tool.name}...</span>
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

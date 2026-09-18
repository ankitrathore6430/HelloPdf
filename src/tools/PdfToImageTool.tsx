import React, { useState, useEffect } from 'react';
import { ToolItem } from '../types';
import { convertPDFToImages, ConvertedImageResult } from '../services/pdfConvert';
import { textToPDF } from '../services/pdfEngine';
import { downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import JSZip from 'jszip';
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Image,
  Archive,
} from 'lucide-react';

interface PdfToImageToolProps {
  tool: ToolItem;
}

export const PdfToImageTool: React.FC<PdfToImageToolProps> = ({ tool }) => {
  const getInitialFormat = (): 'image/jpeg' | 'image/png' | 'image/webp' => {
    if (tool.id === 'pdf-to-png' || tool.id === 'extract-images') return 'image/png';
    if (tool.id === 'pdf-to-webp') return 'image/webp';
    return 'image/jpeg';
  };

  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>(getInitialFormat());
  const [grayscale, setGrayscale] = useState<boolean>(tool.id === 'pdf-to-greyscale-images');
  const [scale, setScale] = useState<number>(1.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderedImages, setRenderedImages] = useState<ConvertedImageResult[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setFormat(getInitialFormat());
    setGrayscale(tool.id === 'pdf-to-greyscale-images');
  }, [tool.id]);

  const handleFileChange = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setFile(selected[0]);
    setRenderedImages([]);
    setZipBlob(null);
    setErrorMessage(null);
  };

  const handleUseDemo = async () => {
    try {
      const doc = await textToPDF(
        'HELLO PDF - HIGH DEFINITION CONVERSION DEMO\n\n' +
          'This sample page tests real-time, browser-native PDF rasterization.\n' +
          'Our high-fidelity engine decodes typography, layouts, and vector graphics directly into crisp pixels.\n\n' +
          '• Supports Lossless PNG, Compressed JPEG, and Modern WebP\n' +
          '• Optional Grayscale / B&W conversion for archival prints\n' +
          '• Download individual pages or package everything into a ZIP archive.',
        'Convert PDF Demo'
      );
      const demoFile = new File([doc as any], 'HelloPDF_Sample_Doc.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setRenderedImages([]);
      setZipBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not generate sample document: ' + err.message);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF file to convert.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await convertPDFToImages(file, {
        format,
        quality: 0.92,
        grayscale,
        scale,
      });

      if (!result.images || result.images.length === 0) {
        throw new Error('No pages could be extracted from this PDF.');
      }

      setRenderedImages(result.images);
      if (result.zipBlob) {
        setZipBlob(result.zipBlob);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to render PDF pages into images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (image: ConvertedImageResult) => {
    downloadBlob(image.blob, image.filename);
  };

  const handleDownloadAllZip = async () => {
    if (renderedImages.length === 0) return;

    if (zipBlob) {
      downloadBlob(zipBlob, `${file?.name.replace(/\.pdf$/i, '') || 'HelloPDF'}_Images.zip`);
      return;
    }

    const zip = new JSZip();
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    for (const img of renderedImages) {
      zip.file(img.filename || `Page_${img.pageIndex + 1}.${ext}`, img.blob);
    }

    const generatedZip = await zip.generateAsync({ type: 'blob' });
    downloadBlob(generatedZip, `${file?.name.replace(/\.pdf$/i, '') || 'HelloPDF'}_Images.zip`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Select PDF to Convert into Images
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
              accept=".pdf,application/pdf"
              onChange={(e) => handleFileChange(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 shadow-2xs">
                <Image className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Drop your PDF file here or click to browse
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Extract and render every page as high-resolution JPG, PNG, or WebP images
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
                  {formatFileSize(file.size)} • Ready to convert
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setRenderedImages([]);
                setZipBlob(null);
              }}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-lg text-red-600 dark:text-red-400 font-semibold transition-colors"
              title="Change document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Image Format Settings */}
      {file && (
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1.5">
                Output Image Format:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('image/jpeg')}
                  className={`py-2 px-2.5 rounded-lg font-bold border text-center transition-colors ${
                    format === 'image/jpeg'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  JPG
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('image/png')}
                  className={`py-2 px-2.5 rounded-lg font-bold border text-center transition-colors ${
                    format === 'image/png'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('image/webp')}
                  className={`py-2 px-2.5 rounded-lg font-bold border text-center transition-colors ${
                    format === 'image/webp'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  WebP
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1.5">
                Resolution / DPI Quality:
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
              >
                <option value="1.0">Standard Web (72 - 100 DPI - Fast)</option>
                <option value="1.5">High Definition (150 DPI - Balanced)</option>
                <option value="2.0">Ultra High Definition (300 DPI - Print Quality)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300 font-medium">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className="rounded accent-sky-600 w-4 h-4"
              />
              <span>Convert to Grayscale (Black & White)</span>
            </label>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Ideal for scanned documents, contracts, and fax receipts
            </span>
          </div>
        </div>
      )}

      {/* Rendered Images Gallery */}
      {renderedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Extracted Pages ({renderedImages.length})
            </span>
            <button
              type="button"
              onClick={handleDownloadAllZip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Download All as ZIP</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {renderedImages.map((img) => (
              <div
                key={img.pageIndex}
                className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2.5 space-y-2.5 shadow-2xs"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                  <img
                    src={img.dataUrl}
                    alt={`Page ${img.pageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                      Page {img.pageIndex + 1}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      {formatFileSize(img.blob.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(img)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 hover:text-sky-600 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action and Convert */}
      {renderedImages.length === 0 && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || isProcessing}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
              !file || isProcessing
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20 hover:scale-[1.02]'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting Pages...</span>
              </>
            ) : (
              <>
                <Image className="w-4 h-4" />
                <span>
                  Convert PDF to {format === 'image/jpeg' ? 'JPG' : format === 'image/png' ? 'PNG' : 'WebP'}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

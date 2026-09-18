import React, { useState } from 'react';
import { ToolItem } from '../types';
import { createPhotoAlbumPDF, imagesToPDF, generateSamplePhotoFiles } from '../services/pdfEngine';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileImage,
  Trash2,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Images,
  BookOpen,
} from 'lucide-react';

interface ImageToPdfToolProps {
  tool: ToolItem;
}

export const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({ tool }) => {
  const isAlbumMode = tool.id === 'batch-image-to-pdf';

  const [files, setFiles] = useState<File[]>([]);
  const [albumLayout, setAlbumLayout] = useState<'1-per-page' | '2-per-page' | '4-per-page' | '6-per-page'>(
    isAlbumMode ? '4-per-page' : '1-per-page'
  );
  const [albumTitle, setAlbumTitle] = useState('My Photo Album 2026');
  const [albumCoverPage, setAlbumCoverPage] = useState(isAlbumMode);
  const [pageSize, setPageSize] = useState<'A4' | 'letter' | 'fit'>(isAlbumMode ? 'A4' : 'fit');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    isAlbumMode ? 'landscape' : 'portrait'
  );
  const [margin, setMargin] = useState(isAlbumMode ? 24 : 12);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (newSelected: FileList | null) => {
    if (!newSelected || newSelected.length === 0) return;
    const added = Array.from(newSelected).filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg|tiff?|heic)$/i.test(f.name)
    );
    setFiles((prev) => [...prev, ...added]);
    setResultBlob(null);
    setErrorMessage(null);
  };

  const handleUseSamplePhotos = async () => {
    try {
      const samples = await generateSamplePhotoFiles();
      setFiles(samples);
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not load sample photos: ' + err.message);
    }
  };

  const handleCompile = async () => {
    if (files.length === 0) {
      setErrorMessage('Please select or drop at least one photo or image.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (isAlbumMode) {
        const bytes = await createPhotoAlbumPDF(files, {
          layout: albumLayout,
          pageSize,
          orientation,
          margin,
          albumTitle: albumTitle.trim() || undefined,
          addCoverPage: albumCoverPage,
        });
        const blob = makePdfBlob(bytes);
        setResultBlob(blob);
      } else {
        const bytes = await imagesToPDF(files, {
          pageSize,
          margin,
          orientation,
        });
        const blob = makePdfBlob(bytes);
        setResultBlob(blob);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to convert images into PDF document.');
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
            {isAlbumMode
              ? `Select Photos for Album (${files.length} selected)`
              : `Select Image Files (${files.length} selected)`}
          </label>
          {files.length === 0 && (
            <button
              type="button"
              onClick={handleUseSamplePhotos}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try with 4 Sample Photos</span>
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
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 scale-[0.99]'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-rose-400 dark:hover:border-rose-500 bg-neutral-50/40 dark:bg-neutral-900/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/60'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileChange(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 shadow-2xs">
              <Images className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {files.length > 0 ? 'Click or drag more photos here' : 'Drop your photos or images here or click to browse'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Supports JPEG, PNG, WebP • Batch processing with zero server uploads
            </p>
          </div>
        </div>
      </div>

      {/* Visual Photos Thumbnail Grid */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <span>Uploaded Photos ({files.length})</span>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setResultBlob(null);
              }}
              className="text-red-500 hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-1">
            {files.map((file, idx) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1 shadow-2xs"
                >
                  <div className="h-20 w-full rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                    <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-1 flex items-center justify-between px-1">
                    <span className="text-[10px] truncate max-w-[70px] font-medium text-neutral-700 dark:text-neutral-300">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFiles(files.filter((_, i) => i !== idx));
                        setResultBlob(null);
                      }}
                      className="text-neutral-400 hover:text-red-600 p-0.5 rounded"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Album Layout & Page Settings */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-4 text-xs">
        {isAlbumMode && (
          <div>
            <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-2">
              Album Layout Grid:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: '1-per-page', label: '1 Photo/Page', desc: 'Full-bleed album page' },
                { id: '2-per-page', label: '2 Photos/Page', desc: 'Side-by-side view' },
                { id: '4-per-page', label: '4 Photos/Page', desc: '2x2 Collage Grid' },
                { id: '6-per-page', label: '6 Photos/Page', desc: 'Proof / Contact sheet' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAlbumLayout(item.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-colors ${
                    albumLayout === item.id
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-500 dark:border-rose-600 font-bold'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <div className="font-bold">{item.label}</div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isAlbumMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-neutral-800 dark:text-neutral-200">
                Album Cover Page & Title:
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600 dark:text-neutral-300 text-xs">
                <input
                  type="checkbox"
                  checked={albumCoverPage}
                  onChange={(e) => setAlbumCoverPage(e.target.checked)}
                  className="rounded accent-rose-600"
                />
                <span>Include Cover Page</span>
              </label>
            </div>
            {albumCoverPage && (
              <input
                type="text"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                placeholder="e.g. Vacation & Memories 2026"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Page Size:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
            >
              <option value="A4">A4 Standard</option>
              <option value="letter">US Letter</option>
              {!isAlbumMode && <option value="fit">Fit to Photo Dimensions</option>}
            </select>
          </div>

          <div>
            <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Orientation:</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
            >
              <option value="landscape">Landscape (Photo Album)</option>
              <option value="portrait">Portrait (Document)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Page Margins:</label>
            <select
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
            >
              <option value="12">Compact (12pt)</option>
              <option value="24">Standard (24pt)</option>
              <option value="40">Spacious (40pt)</option>
            </select>
          </div>
        </div>
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
              <span>
                {isAlbumMode
                  ? `Photo album compiled with ${files.length} photos!`
                  : `Successfully converted ${files.length} image(s) to PDF!`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {resultBlob ? (
            <button
              type="button"
              onClick={() =>
                downloadBlob(
                  resultBlob,
                  isAlbumMode
                    ? `HelloPDF_Photo_Album_${files.length}_Photos.pdf`
                    : 'HelloPDF_Images_Converted.pdf'
                )
              }
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>
                Download {isAlbumMode ? 'Photo Album PDF' : 'PDF Document'} ({formatFileSize(resultBlob.size)})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompile}
              disabled={files.length === 0 || isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                files.length === 0 || isProcessing
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling {isAlbumMode ? 'Photo Album' : 'Images'}...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>{isAlbumMode ? `Generate Photo Album (${files.length})` : 'Convert to PDF Now'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

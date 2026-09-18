import React, { useState, useEffect, useRef } from 'react';
import { textToPDF, overlayGridOnPDF } from '../../services/pdfEngine';
import { renderPDFPageToCanvasElement } from '../../services/pdfConvert';
import { formatFileSize, downloadBlob } from '../shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Grid,
  Download,
  RefreshCw,
  Sliders,
  Eye,
} from 'lucide-react';

interface PdfGridOverlayViewProps {
  initialFile?: File | null;
}

export const PdfGridOverlayView: React.FC<PdfGridOverlayViewProps> = ({ initialFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [gridStep, setGridStep] = useState(50); // in points
  const [gridColorKey, setGridColorKey] = useState<'blue' | 'red' | 'emerald' | 'charcoal' | 'cyan'>('blue');
  const [opacity, setOpacity] = useState(0.35);
  const [showLabels, setShowLabels] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const colorMap = {
    blue: { r: 0.1, g: 0.5, b: 0.95, css: '#1d72b8' },
    red: { r: 0.9, g: 0.2, b: 0.2, css: '#dc2626' },
    emerald: { r: 0.1, g: 0.7, b: 0.4, css: '#059669' },
    charcoal: { r: 0.25, g: 0.25, b: 0.25, css: '#374151' },
    cyan: { r: 0.0, g: 0.75, b: 0.85, css: '#0891b2' },
  };

  // Load sample document
  const handleLoadDemo = async () => {
    try {
      setIsProcessing(true);
      const sampleText = `ENGINEERING & ARCHITECTURAL BLUEPRINT
Project: Hello PDF Grid Alignment Specimen
Date: Spring 2026

1. SPECIFICATIONS
- Page geometry: ISO 216 / Standard A4 (595.28 x 841.89 pt)
- Coordinate Origin: Top-Left (0, 0)
- Precision alignment units: Typography Points (1 pt = 1/72 inch)

2. MARGIN & LAYOUT BOUNDARIES
- Left margin: 50 pt
- Right margin: 50 pt
- Column width: 235 pt
- Column gutter: 25 pt

3. COMPONENT PLACEMENT TEST
Use the superimposed coordinate grid to audit typography baseline alignment, box spacing, and margin consistency.`;

      const bytes = await textToPDF(sampleText, 'Grid_Alignment_Specimen');
      const demoFile = new File([bytes as any], 'Grid_Alignment_Specimen.pdf', { type: 'application/pdf' });
      setFile(demoFile);
    } catch (err) {
      console.error('Failed to create sample', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render base PDF page to canvas
  useEffect(() => {
    if (!file || !canvasRef.current) return;
    renderPDFPageToCanvasElement(file, 1, canvasRef.current, 1.4)
      .then(() => {
        drawGridOverlay();
      })
      .catch(console.warn);
  }, [file]);

  // Draw grid overlay on top canvas whenever options change
  const drawGridOverlay = () => {
    const baseCanvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!baseCanvas || !overlayCanvas) return;

    overlayCanvas.width = baseCanvas.width;
    overlayCanvas.height = baseCanvas.height;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    const scale = baseCanvas.width / 595.28; // scale factor
    const pxStep = gridStep * (scale || 1.4);
    const color = colorMap[gridColorKey];

    ctx.strokeStyle = color.css;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;
    ctx.font = '9px monospace';
    ctx.fillStyle = color.css;

    // Vertical lines
    for (let x = 0; x <= overlayCanvas.width; x += pxStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, overlayCanvas.height);
      ctx.stroke();

      if (showLabels && x > 0) {
        const ptVal = Math.round(x / (scale || 1.4));
        ctx.fillText(`${ptVal}`, x + 2, 10);
      }
    }

    // Horizontal lines
    for (let y = 0; y <= overlayCanvas.height; y += pxStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(overlayCanvas.width, y);
      ctx.stroke();

      if (showLabels && y > 0) {
        const ptVal = Math.round(y / (scale || 1.4));
        ctx.fillText(`${ptVal}`, 3, y + 10);
      }
    }
  };

  useEffect(() => {
    drawGridOverlay();
  }, [gridStep, gridColorKey, opacity, showLabels]);

  // Burn grid to PDF & download
  const handleBurnAndDownload = async () => {
    if (!file) return;
    try {
      setIsDownloading(true);
      const color = colorMap[gridColorKey];
      const resultBytes = await overlayGridOnPDF(file, {
        gridStep,
        color: { r: color.r, g: color.g, b: color.b },
        opacity,
        showLabels,
      });

      const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      downloadBlob(blob, `Grid_${gridStep}pt_${file.name}`);
    } catch (err: any) {
      console.error('Failed to generate grid PDF', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
        <div className="flex items-center gap-2.5">
          <Grid className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              PDF Coordinate Grid & Alignment Overlay
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Superimpose architectural and typographic grid lines with coordinate rulers for precision document layout audit.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadDemo}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try with Sample PDF</span>
        </button>
      </div>

      {/* Upload zone */}
      {!file ? (
        <div className="relative border-2 border-dashed rounded-3xl p-10 text-center border-neutral-300 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-neutral-50/40 dark:bg-neutral-900/40 cursor-pointer transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Upload PDF for Grid Overlay
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Select any PDF to superimpose precision coordinate lines and rulers
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{file.name}</p>
                <p className="text-[11px] text-neutral-500">{formatFileSize(file.size)} • Real-Time Grid Canvas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResultBlob(null);
              }}
              className="p-2 text-neutral-400 hover:text-red-500 cursor-pointer"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Grid Settings Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Grid & Alignment Settings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Grid Spacing */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Grid Step / Interval:
                </label>
                <div className="flex items-center gap-1">
                  {[25, 50, 100].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setGridStep(step)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        gridStep === step
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      {step} pt
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Line Color:
                </label>
                <div className="flex items-center gap-1.5">
                  {(['blue', 'red', 'emerald', 'charcoal', 'cyan'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setGridColorKey(key)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                        gridColorKey === key ? 'scale-110 border-neutral-900 dark:border-white shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: colorMap[key].css }}
                      title={key}
                    />
                  ))}
                </div>
              </div>

              {/* Opacity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Opacity:</label>
                  <span className="text-xs font-mono text-neutral-500">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Coordinate Labels Toggle */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                  <span>Show Coordinate Labels</span>
                </label>
              </div>
            </div>

            {/* Action Download Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleBurnAndDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Grid on PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF with Alignment Grid</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Live Canvas Preview */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center">
            <span className="text-xs text-neutral-400 font-mono mb-3">
              Live Preview: Page 1 with Superimposed {gridStep}pt Coordinate Grid
            </span>
            <div className="relative rounded-lg overflow-hidden shadow-2xl border border-neutral-700 bg-white">
              {/* Base Document Canvas */}
              <canvas ref={canvasRef} className="max-h-[520px] w-auto block" />
              {/* Superimposed Transparent Grid Canvas */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 max-h-[520px] w-auto pointer-events-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

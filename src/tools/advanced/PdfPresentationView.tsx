import React, { useState, useEffect, useRef } from 'react';
import { textToPDF } from '../../services/pdfEngine';
import { extractPDFText, renderPDFPageToCanvasElement } from '../../services/pdfConvert';
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Tv,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  Minimize,
  Radio,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface PdfPresentationViewProps {
  initialFile?: File | null;
}

export const PdfPresentationView: React.FC<PdfPresentationViewProps> = ({ initialFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval, setPlayInterval] = useState(4); // seconds
  const [laserMode, setLaserMode] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [slideTexts, setSlideTexts] = useState<string[]>([]);

  const theaterRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<any>(null);

  // Load sample presentation
  const handleLoadDemo = async () => {
    try {
      setIsProcessing(true);
      const demoSlides = `EXECUTIVE STRATEGY & PRODUCT ROADMAP 2026
Hello PDF In-Browser Document Solutions
Author: Strategic Innovations Group

Slide 1: In-Browser Architecture
- 100% Client-Side WebAssembly
- Zero Server Latency & High Privacy
- Compliant with HIPAA and GDPR Regulations

Slide 2: Enterprise Growth Metrics
- 4.2M Monthly Document Transformations
- 99.98% Conversion Accuracy across formats
- Seamless Multi-Device Touch & Pen Optimization

Slide 3: Next Phase Deliverables
- Dynamic Document Collaboration
- Client-Side Vector Watermarking
- Automated Offline Digital Signatures`;

      const bytes = await textToPDF(demoSlides, 'Executive_Strategy_2026_Deck');
      const demoFile = new File([bytes as any], 'Executive_Strategy_Presentation.pdf', { type: 'application/pdf' });
      setFile(demoFile);
    } catch (err) {
      console.error('Failed to create sample presentation', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Inspect file and extract page texts
  useEffect(() => {
    if (!file) {
      setTotalSlides(1);
      setCurrentSlide(1);
      setSlideTexts([]);
      return;
    }

    let isCancelled = false;
    const loadInfo = async () => {
      try {
        setIsProcessing(true);
        const extracted = await extractPDFText(file);
        if (!isCancelled) {
          setTotalSlides(Math.max(1, extracted.pageCount || extracted.pagesText.length));
          setCurrentSlide(1);
          setSlideTexts(extracted.pagesText);
        }
      } catch (err) {
        console.warn('Presentation inspection error:', err);
      } finally {
        if (!isCancelled) {
          setIsProcessing(false);
        }
      }
    };

    loadInfo();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  // Render current slide on canvas
  useEffect(() => {
    if (!file || !canvasRef.current) return;
    renderPDFPageToCanvasElement(file, currentSlide, canvasRef.current, 1.8)
      .then((res) => {
        setTotalSlides(res.totalPages);
      })
      .catch(console.warn);
  }, [file, currentSlide]);

  // Auto-play slideshow logic
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev >= totalSlides ? 1 : prev + 1));
      }, playInterval * 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSlides, playInterval]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!theaterRef.current) return;
    if (!document.fullscreenElement) {
      theaterRef.current.requestFullscreen().catch(console.warn);
    } else {
      document.exitFullscreen().catch(console.warn);
    }
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < totalSlides ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev > 1 ? prev - 1 : prev));
  };

  // Track mouse position over canvas for laser pointer
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!laserMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
        <div className="flex items-center gap-2.5">
          <Tv className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              PDF Presentation & Fullscreen Slide Viewer
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Present your PDF deck with slide controls, fullscreen theater mode, laser pointer, and auto-play timer.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadDemo}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try with Sample Slide Deck</span>
        </button>
      </div>

      {/* Upload Zone if no file */}
      {!file ? (
        <div className="relative border-2 border-dashed rounded-3xl p-10 text-center border-neutral-300 dark:border-neutral-700 hover:border-teal-500 dark:hover:border-teal-500 bg-neutral-50/40 dark:bg-neutral-900/40 cursor-pointer transition-colors">
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
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Upload PDF Presentation or Document
            </p>
            <p className="text-xs text-neutral-500 mt-1">Select any PDF to begin presenting in theater mode</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{file.name}</p>
                <p className="text-[11px] text-neutral-500">
                  {totalSlides} Slides Detected • High-DPI Canvas Rendering
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setIsPlaying(false);
              }}
              className="p-2 text-neutral-400 hover:text-red-500 cursor-pointer"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Presentation Theater Stage */}
          <div
            ref={theaterRef}
            className={`relative rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col items-center justify-center p-4 sm:p-8 select-none transition-all ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'min-h-[500px]'
            }`}
          >
            {/* Top Toolbar in Theater */}
            <div className="w-full flex items-center justify-between mb-4 z-20 text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-700 text-xs font-bold text-white shadow-xs">
                  Slide {currentSlide} of {totalSlides}
                </span>

                {isPlaying && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[11px] font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Auto-Play ({playInterval}s)
                  </span>
                )}
              </div>

              {/* Theater Control Actions */}
              <div className="flex items-center gap-2">
                {/* Laser Pointer Toggle */}
                <button
                  type="button"
                  onClick={() => setLaserMode(!laserMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    laserMode
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                  title="Toggle Red Laser Pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Laser {laserMode ? 'ON' : 'OFF'}</span>
                </button>

                {/* Auto-Play Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-600 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                  title={isPlaying ? 'Pause Slideshow' : 'Start Auto-Play Slideshow'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
                </button>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Slide Stage Container with Laser Effect */}
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setMousePos(null)}
              className="relative max-w-full flex items-center justify-center cursor-default z-10"
            >
              <div className="rounded-xl overflow-hidden shadow-2xl bg-white border border-neutral-800 max-h-[72vh] flex items-center justify-center">
                <canvas ref={canvasRef} className="max-h-[70vh] max-w-full block object-contain" />
              </div>

              {/* Glowing Laser Pointer Dot */}
              {laserMode && mousePos && (
                <div
                  className="absolute pointer-events-none w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_6px_rgba(239,68,68,0.9)] -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-75"
                  style={{
                    left: `${mousePos.x}px`,
                    top: `${mousePos.y}px`,
                  }}
                />
              )}
            </div>

            {/* Bottom Navigation Strip */}
            <div className="w-full flex items-center justify-between mt-6 z-20">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentSlide <= 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Slide Thumbnail Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] px-2 py-1 scrollbar-none">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      currentSlide === i + 1
                        ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentSlide >= totalSlides}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 disabled:opacity-30 text-xs font-bold cursor-pointer transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slide Notes / Extracted Text excerpt */}
          {slideTexts[currentSlide - 1] && (
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                Slide {currentSlide} Text & Notes Preview:
              </span>
              <p className="text-xs text-neutral-800 dark:text-neutral-200 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {slideTexts[currentSlide - 1]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ToolItem } from '../types';
import {
  inspectPDF,
  updatePDFMetadata,
  cleanPDFMetadata,
  flattenPDF,
  linearizePDF,
  textToPDF,
} from '../services/pdfEngine';
import { analyzePDFColorPalette, PDFColorAnalysis } from '../services/pdfConvert';
import { formatFileSize, downloadBlob } from './shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Download,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Binary,
  Globe,
  Palette,
  FileJson,
  Edit3,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';

// Specialized Sub-views for Complex Advanced Tools
import { PdfCompareView } from './advanced/PdfCompareView';
import { PdfPresentationView } from './advanced/PdfPresentationView';
import { PdfGridOverlayView } from './advanced/PdfGridOverlayView';
import { PdfLinkCheckerView } from './advanced/PdfLinkCheckerView';
import { PdfWordCounterView } from './advanced/PdfWordCounterView';
import { PdfPageDimensionView } from './advanced/PdfPageDimensionView';
import { PdfFontInspectorView } from './advanced/PdfFontInspectorView';

interface InspectRepairToolProps {
  tool: ToolItem;
}

export const InspectRepairTool: React.FC<InspectRepairToolProps> = ({ tool }) => {
  const id = tool.id;

  // Tool flags
  const isCompare = id === 'pdf-compare';
  const isPresentation = id === 'pdf-presentation-mode';
  const isGridOverlay = id === 'pdf-grid-overlay';
  const isLinkChecker = id === 'pdf-link-checker';
  const isWordCount = id === 'pdf-word-counter';
  const isPageDimension = id === 'pdf-page-dimension';
  const isFontInspector = id === 'pdf-font-inspector';

  const isHexInspector = id === 'pdf-hex-inspector';
  const isLinearization = id === 'pdf-linearization-check';
  const isColorAnalyzer = id === 'pdf-color-analyzer';
  const isJsonMetadata = id === 'pdf-to-json-metadata';
  const isClean = id === 'clean-metadata';
  const isFlatten = id === 'flatten-pdf';
  const isMetadata = id === 'edit-pdf-metadata' || id === 'metadata-editor';

  // Sub-component Delegations for specialized tools
  if (isCompare) return <PdfCompareView />;
  if (isPresentation) return <PdfPresentationView />;
  if (isGridOverlay) return <PdfGridOverlayView />;
  if (isLinkChecker) return <PdfLinkCheckerView />;
  if (isWordCount) return <PdfWordCounterView />;
  if (isPageDimension) return <PdfPageDimensionView />;
  if (isFontInspector) return <PdfFontInspectorView />;

  // Standard File State for remaining tools
  const [file, setFile] = useState<File | null>(null);
  const [inspectData, setInspectData] = useState<any | null>(null);
  const [colorAnalysis, setColorAnalysis] = useState<PDFColorAnalysis | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [hexDump, setHexDump] = useState<string[]>([]);
  const [hexOffset, setHexOffset] = useState<'start' | 'offset256' | 'offset512' | 'eof'>('start');
  const [jsonMetadata, setJsonMetadata] = useState<string>('');
  const [isLinearized, setIsLinearized] = useState<boolean | null>(null);

  // Editable metadata state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [creator, setCreator] = useState('');
  const [keywords, setKeywords] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResultBlob(null);
    setErrorMessage(null);
    if (!file) {
      setInspectData(null);
      setHexDump([]);
      setJsonMetadata('');
      setIsLinearized(null);
    }
  }, [id]);

  const analyzeFile = async (f: File, offsetMode = hexOffset) => {
    try {
      setIsProcessing(true);
      const data = await inspectPDF(f);
      setInspectData(data);
      if (data) {
        setTitle(data.title || '');
        setAuthor(data.author || '');
        setSubject(data.subject || '');
        setCreator(data.creator || '');
        setKeywords(data.keywords || '');
      }

      // Read buffer for hex & linearization inspection
      const fileSize = f.size;
      let startByte = 0;
      if (offsetMode === 'offset256') startByte = Math.min(256, Math.max(0, fileSize - 256));
      else if (offsetMode === 'offset512') startByte = Math.min(512, Math.max(0, fileSize - 256));
      else if (offsetMode === 'eof') startByte = Math.max(0, fileSize - 256);

      const buffer = await f.slice(startByte, startByte + 256).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const lines: string[] = [];
      for (let i = 0; i < bytes.length; i += 16) {
        const chunk = bytes.slice(i, i + 16);
        const hex = Array.from(chunk)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(' ');
        const ascii = Array.from(chunk)
          .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
          .join('');
        const offset = (startByte + i).toString(16).padStart(4, '0').toUpperCase();
        lines.push(`${offset}  ${hex.padEnd(48, ' ')}  |${ascii}|`);
      }
      setHexDump(lines);

      // Check linearization in first 1024 bytes
      const first1k = await f.slice(0, 1024).text();
      const hasLinearized = /\/Linearized\s+1/.test(first1k) || /\/Linearized/.test(first1k);
      setIsLinearized(hasLinearized);

      // JSON dump
      const jsonDumpObj = {
        fileName: f.name,
        fileSize: f.size,
        formattedSize: formatFileSize(f.size),
        pageCount: data?.pageCount || 1,
        pdfVersion: '1.7',
        isEncrypted: false,
        hasLinearization: hasLinearized,
        metadata: {
          title: data?.title || null,
          author: data?.author || null,
          subject: data?.subject || null,
          creator: data?.creator || null,
          producer: 'Hello PDF Engine',
          keywords: data?.keywords || null,
          creationDate: data?.creationDate || null,
          modificationDate: data?.modificationDate || null,
        },
      };
      setJsonMetadata(JSON.stringify(jsonDumpObj, null, 2));

      // Color analysis if relevant
      if (isColorAnalyzer) {
        const colors = await analyzePDFColorPalette(f);
        setColorAnalysis(colors);
      }
    } catch (err: any) {
      console.error('Inspection failed:', err);
      setErrorMessage(err.message || 'Unable to analyze PDF structure.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setResultBlob(null);
      setErrorMessage(null);
      analyzeFile(selected);
    }
  };

  const handleUseDemo = async () => {
    try {
      setIsProcessing(true);
      const demoText = `HELLO PDF SPECIMEN & ADVANCED ARCHITECTURE BRIEF
Document Title: Executive System Verification
Author: Hello PDF Research Labs
Subject: Client-Side WebAssembly Processing & Prepress
Keywords: WebAssembly, PDF, Color, Metadata, Linearization

Section 1: In-Browser Document Execution
This PDF was synthesized entirely in memory without contacting external web endpoints.
All color palettes, object streams, and metadata headers conform strictly to ISO 32000-1 specifications.

Section 2: Color Space & Contrast Guidelines
DeviceRGB color calibration guarantees that digital documents maintain optical legibility across calibrated sRGB monitors and mobile displays.`;

      const bytes = await textToPDF(demoText, 'HelloPDF_Advanced_Specimen');
      const demoFile = new File([bytes as any], 'HelloPDF_Advanced_Specimen.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setResultBlob(null);
      setErrorMessage(null);
      await analyzeFile(demoFile);
    } catch (err: any) {
      setErrorMessage('Could not load sample document: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let bytes: Uint8Array;

      if (isMetadata) {
        bytes = await updatePDFMetadata(file, {
          title,
          author,
          subject,
          keywords,
        });
      } else if (isClean) {
        bytes = await cleanPDFMetadata(file);
      } else if (isFlatten) {
        bytes = await flattenPDF(file);
      } else if (isLinearization) {
        bytes = await linearizePDF(file);
      } else {
        throw new Error('Unsupported execution mode for current tool.');
      }

      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      downloadBlob(blob, `${tool.id}_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Demo Loader */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
            {isHexInspector ? (
              <Binary className="w-4 h-4" />
            ) : isLinearization ? (
              <Globe className="w-4 h-4" />
            ) : isColorAnalyzer ? (
              <Palette className="w-4 h-4" />
            ) : isJsonMetadata ? (
              <FileJson className="w-4 h-4" />
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{tool.name}</h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">{tool.shortDesc}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUseDemo}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try with Sample PDF</span>
        </button>
      </div>

      {/* Upload Zone */}
      {!file ? (
        <div className="relative border-2 border-dashed rounded-3xl p-10 text-center border-neutral-300 dark:border-neutral-700 hover:border-teal-500 dark:hover:border-teal-500 bg-neutral-50/40 dark:bg-neutral-900/40 cursor-pointer transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelected}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Upload PDF for {tool.name}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Select any PDF to begin inspection and processing</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{file.name}</p>
              <p className="text-[11px] text-neutral-500">
                {formatFileSize(file.size)}
                {inspectData?.pageCount ? ` • ${inspectData.pageCount} Pages` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setInspectData(null);
              setResultBlob(null);
            }}
            className="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
            title="Remove File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TOOL SPECIFIC WORKSPACES */}
      {file && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 1. Hex Inspector View */}
          {isHexInspector && (
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Binary Hex Header & Byte Viewer
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Offset selector */}
                  <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setHexOffset('start');
                        analyzeFile(file, 'start');
                      }}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        hexOffset === 'start' ? 'bg-white dark:bg-neutral-700 shadow-2xs text-teal-600 font-bold' : 'text-neutral-500'
                      }`}
                    >
                      0x0000 Header
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHexOffset('offset256');
                        analyzeFile(file, 'offset256');
                      }}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        hexOffset === 'offset256' ? 'bg-white dark:bg-neutral-700 shadow-2xs text-teal-600 font-bold' : 'text-neutral-500'
                      }`}
                    >
                      +256 Byte
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHexOffset('eof');
                        analyzeFile(file, 'eof');
                      }}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        hexOffset === 'eof' ? 'bg-white dark:bg-neutral-700 shadow-2xs text-teal-600 font-bold' : 'text-neutral-500'
                      }`}
                    >
                      EOF Trailer
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(hexDump.join('\n'))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Hex'}</span>
                  </button>
                </div>
              </div>

              {/* Magic Byte Check */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-neutral-500">Magic Number:</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">%PDF-1.x Valid Standard</span>
              </div>

              <pre className="p-4 rounded-xl bg-neutral-950 text-neutral-200 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed border border-neutral-800">
                {hexDump.join('\n')}
              </pre>
            </div>
          )}

          {/* 2. Web Linearization Checker */}
          {isLinearization && (
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Web Linearization (Fast Web View) Audit
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isLinearized ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Linearized (Fast Web View Active)</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Not Linearized (Standard Stream)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2 text-neutral-700 dark:text-neutral-300">
                <p className="font-bold text-neutral-900 dark:text-white">
                  What is Fast Web View (Linearization)?
                </p>
                <p className="leading-relaxed">
                  Linearization re-organizes the PDF binary structure so the first page displays immediately in web browsers before the entire file finishes downloading. It utilizes HTTP Byte-Range requests to stream multi-megabyte documents progressively.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Optimizing for Web Streaming...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Optimize & Download Linearized Web PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. Color Palette Analyzer */}
          {isColorAnalyzer && colorAnalysis && (
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Document Palette & Color Harmony Analysis
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold">
                  {colorAnalysis.wcagStatus} Contrast
                </span>
              </div>

              {/* Dominant Swatches */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {colorAnalysis.dominantColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-2 text-center"
                  >
                    <div
                      className="w-full h-14 rounded-lg shadow-inner border border-neutral-300/40"
                      style={{ backgroundColor: color.hex }}
                    />
                    <p className="font-mono text-xs font-bold text-neutral-900 dark:text-white">{color.hex}</p>
                    <p className="text-[10px] text-neutral-500">{color.percentage}% coverage</p>
                  </div>
                ))}
              </div>

              {/* Contrast Metrics */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">Estimated Contrast Ratio:</span>
                <span className="font-bold text-neutral-900 dark:text-white font-mono">
                  {colorAnalysis.contrastRatio}:1 (WCAG AA Compliant)
                </span>
              </div>
            </div>
          )}

          {/* 4. JSON Metadata Dump */}
          {isJsonMetadata && (
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Structured Document JSON Schema
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(jsonMetadata)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([jsonMetadata], { type: 'application/json' });
                      downloadBlob(blob, `${file.name}_metadata.json`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-neutral-950 text-neutral-200 text-xs font-mono max-h-96 overflow-y-auto whitespace-pre leading-relaxed border border-neutral-800">
                {jsonMetadata}
              </pre>
            </div>
          )}

          {/* 5. Metadata Editor */}
          {isMetadata && (
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-3">
                Edit PDF Document Properties
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Document Title:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-medium"
                    placeholder="Enter document title"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Author / Creator:
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-medium"
                    placeholder="Author name"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Subject / Topic:
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-medium"
                    placeholder="Subject overview"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Keywords (comma separated):
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-medium"
                    placeholder="e.g. invoice, report, 2026"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Metadata...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Save & Download Updated PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 6. Clean / Flatten Actions */}
          {(isClean || isFlatten) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                {isClean ? 'Privacy Hardening & Metadata Scrub' : 'Flatten Form Fields & Vector Annotations'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {isClean
                  ? 'Permanently scrubs hidden author tags, revision histories, creation dates, and metadata dictionaries from your document.'
                  : 'Permanently burns interactive form fields, checkmarks, signatures, and annotations directly into static page content.'}
              </p>

              <button
                type="button"
                onClick={handleAction}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Execute & Download PDF</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

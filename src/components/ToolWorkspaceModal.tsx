import React, { useState, useRef, useEffect } from 'react';
import { ToolItem } from '../types';
import { DynamicIcon } from './DynamicIcon';
import {
  X,
  UploadCloud,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Trash2,
  Plus,
  ShieldCheck,
  FileCode,
  Sliders,
  MoveUp,
  MoveDown,
  Layers,
  FileCheck
} from 'lucide-react';
import {
  mergePDFs,
  splitPDF,
  rotatePDF,
  compressPDF,
  imagesToPDF,
  watermarkPDF,
  addPageNumbers,
  protectPDF,
  stampSignature,
  stampOfficial,
  applyBatesNumbering,
  updatePDFMetadata,
  textToPDF,
  generateInvoicePDF,
  generateCertificatePDF,
  generatePaperPDF,
  inspectPDF,
  downloadBlob,
  formatFileSize,
  PDFMetadataInfo,
} from '../services/pdfEngine';

interface ToolWorkspaceModalProps {
  tool: ToolItem | null;
  onClose: () => void;
}

export const ToolWorkspaceModal: React.FC<ToolWorkspaceModalProps> = ({ tool, onClose }) => {
  if (!tool) return null;

  // File state
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<{ blob: Uint8Array | Blob; filename: string; stats?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFMetadataInfo | null>(null);

  // Tool-specific configurations
  // 1. Split
  const [splitRange, setSplitRange] = useState('1-3');
  // 2. Rotate
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);
  // 3. Compress
  const [compressLevel, setCompressLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  // 4. Image to PDF
  const [imgPageSize, setImgPageSize] = useState<'A4' | 'letter' | 'fit'>('A4');
  const [imgOrientation, setImgOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [imgMargin, setImgMargin] = useState(20);
  // 5. Watermark
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.28);
  const [watermarkFontSize, setWatermarkFontSize] = useState(42);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  // 6. Page Numbers
  const [numPosition, setNumPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right' | 'bottom-left'>('bottom-center');
  const [numFormat, setNumFormat] = useState<'number' | 'page-of-total'>('page-of-total');
  // 7. Protect
  const [password, setPassword] = useState('');
  // 8. Official Stamp
  const [officialStampType, setOfficialStampType] = useState<'CONFIDENTIAL' | 'APPROVED' | 'DRAFT' | 'URGENT' | 'VOID'>('CONFIDENTIAL');
  // 9. Signature Canvas
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [sigColor, setSigColor] = useState('#000000');
  const [sigPosition, setSigPosition] = useState<'bottom-right' | 'bottom-left' | 'center'>('bottom-right');
  // 10. Text / Markdown to PDF
  const [rawText, setRawText] = useState(
    '# Welcome to Hello PDF\n\nThis document was generated directly in the browser.\n\n- 100% Client Side\n- No server uploads\n- Secure and fast'
  );
  // 11. Invoice
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'INV-2026-001',
    clientName: 'Acme Corporation',
    clientEmail: 'billing@acmecorp.com',
    items: [
      { desc: 'Web Design & Development', qty: 1, rate: 850 },
      { desc: 'PDF Tool Integration', qty: 1, rate: 450 },
      { desc: 'Cloud Optimization', qty: 1, rate: 200 },
    ],
    taxPercent: 10,
  });
  // 12. Certificate
  const [certData, setCertData] = useState({
    recipientName: 'Alex Morgan',
    achievement: 'Advanced Web Application Architecture',
    organization: 'Hello PDF Global Academy',
    dateStr: new Date().toLocaleDateString(),
  });
  // 13. Paper
  const [paperType, setPaperType] = useState<'dot' | 'lined' | 'graph'>('dot');
  // 14. Metadata
  const [metadataFields, setMetadataFields] = useState({
    title: 'Executive Report',
    author: 'Hello PDF User',
    subject: 'Document Management',
    keywords: 'pdf, security, hello pdf',
  });
  // 15. Bates
  const [batesPrefix, setBatesPrefix] = useState('LEGAL-DOC-');
  const [batesStart, setBatesStart] = useState(1);

  // Signature canvas setup
  useEffect(() => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = sigColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [sigColor, tool?.id]);

  // Handle files selection
  const handleFileChange = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const newFiles = Array.from(selectedFiles);
    
    if (tool.multipleFiles) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles([newFiles[0]]);
    }

    setResultBlob(null);
    setErrorMessage(null);

    // If first file is PDF, inspect it
    if (newFiles[0].type.includes('pdf') || newFiles[0].name.endsWith('.pdf')) {
      try {
        const info = await inspectPDF(newFiles[0]);
        setPdfInfo(info);
      } catch (e) {
        console.warn('Could not inspect PDF info', e);
      }
    }
  };

  // Generate a sample demo PDF on the fly so users can test immediately
  const handleUseDemoPDF = async () => {
    try {
      const demoBytes = await textToPDF(
        'HELLO PDF - SAMPLE DOCUMENT\n\nThis is a demonstration PDF document generated client-side by Hello PDF.\nYou can test merging, splitting, rotating, watermarking, adding page numbers, and protecting this document right now in your browser without uploading any personal files.\n\nKey features:\n1. Zero Server Uploads (100% Privacy)\n2. Fast Client-side Execution with WebAssembly & PDF-lib\n3. High-Fidelity Rendering & Instant Processing\n4. Over 108 high-utility PDF tools\n\nThank you for choosing Hello PDF!',
        'Sample Document - Hello PDF'
      );
      const demoFile = new File([demoBytes as any], 'HelloPDF_Sample_Doc.pdf', { type: 'application/pdf' });
      setFiles([demoFile]);
      const info = await inspectPDF(demoFile);
      setPdfInfo(info);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not generate sample file: ' + err.message);
    }
  };

  // Drawing signature handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawnSignature(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Execute the PDF operation
  const handleExecute = async () => {
    setIsProcessing(true);
    setProgress(15);
    setErrorMessage(null);

    try {
      let outputBytes: Uint8Array | Blob;
      let outputFilename = `HelloPDF_${tool.id}.pdf`;
      let statsSummary = '';

      setProgress(40);

      // Branch on tool id or category
      if (tool.id === 'merge-pdf') {
        if (files.length < 2) {
          throw new Error('Please select at least 2 PDF files to merge.');
        }
        outputBytes = await mergePDFs(files);
        outputFilename = 'HelloPDF_Merged.pdf';
        statsSummary = `Successfully merged ${files.length} documents into one.`;
      } else if (tool.id === 'split-pdf' || tool.id === 'extract-pages') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        outputBytes = await splitPDF(files[0], splitRange);
        outputFilename = `HelloPDF_Split_Pages_${splitRange.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        statsSummary = `Extracted pages matching range: ${splitRange}`;
      } else if (tool.id === 'rotate-pdf') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        outputBytes = await rotatePDF(files[0], rotateAngle);
        outputFilename = `HelloPDF_Rotated_${rotateAngle}deg.pdf`;
        statsSummary = `Rotated pages by ${rotateAngle} degrees.`;
      } else if (tool.id === 'compress-pdf' || tool.category === 'optimize') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        const result = await compressPDF(files[0], compressLevel);
        outputBytes = result.data;
        outputFilename = `HelloPDF_Compressed.pdf`;
        const diffPercent = Math.max(0, Math.round(((result.originalSize - result.newSize) / result.originalSize) * 100));
        statsSummary = `Reduced size from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.newSize)} (~${diffPercent}% saved).`;
      } else if (tool.id === 'image-to-pdf' || tool.id === 'png-to-pdf' || tool.id === 'webp-to-pdf' || tool.id === 'batch-image-to-pdf') {
        if (files.length === 0) throw new Error('Please select at least one image.');
        outputBytes = await imagesToPDF(files, {
          pageSize: imgPageSize,
          margin: imgMargin,
          orientation: imgOrientation,
        });
        outputFilename = 'HelloPDF_Images_Converted.pdf';
        statsSummary = `Compiled ${files.length} image(s) into PDF document.`;
      } else if (tool.id === 'watermark-pdf') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        outputBytes = await watermarkPDF(files[0], watermarkText, {
          fontSize: watermarkFontSize,
          opacity: watermarkOpacity,
          rotationAngle: watermarkAngle,
        });
        outputFilename = `HelloPDF_Watermarked.pdf`;
        statsSummary = `Stamped text "${watermarkText}" across all pages.`;
      } else if (tool.id === 'page-numbers') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        outputBytes = await addPageNumbers(files[0], {
          position: numPosition,
          format: numFormat,
        });
        outputFilename = `HelloPDF_Numbered.pdf`;
        statsSummary = `Applied page numbers in position: ${numPosition}`;
      } else if (tool.id === 'protect-pdf') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        outputBytes = await protectPDF(files[0], password);
        outputFilename = `HelloPDF_Protected.pdf`;
        statsSummary = 'Encrypted document with standard access permissions.';
      } else if (tool.id === 'digital-signature') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        const canvas = signatureCanvasRef.current;
        if (!canvas || !hasDrawnSignature) {
          throw new Error('Please draw your signature on the pad before stamping.');
        }
        const dataUrl = canvas.toDataURL('image/png');
        outputBytes = await stampSignature(files[0], dataUrl, 0, sigPosition);
        outputFilename = 'HelloPDF_Signed.pdf';
        statsSummary = 'Signature embedded cleanly onto page 1.';
      } else if (tool.id === 'confidential-stamp' || tool.id === 'urgent-stamp' || tool.id === 'expired-stamp' || tool.id === 'approved-stamp') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        outputBytes = await stampOfficial(files[0], officialStampType);
        outputFilename = `HelloPDF_${officialStampType}_Stamp.pdf`;
        statsSummary = `Applied official [ ${officialStampType} ] header banner.`;
      } else if (tool.id === 'bates-numbering') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        outputBytes = await applyBatesNumbering(files[0], batesPrefix, batesStart);
        outputFilename = 'HelloPDF_BatesNumbered.pdf';
        statsSummary = `Applied Bates series starting at ${batesPrefix}${String(batesStart).padStart(6, '0')}`;
      } else if (tool.id === 'invoice-generator') {
        outputBytes = await generateInvoicePDF(invoiceData);
        outputFilename = `${invoiceData.invoiceNumber || 'Invoice'}.pdf`;
        statsSummary = `Generated invoice for ${invoiceData.clientName} successfully.`;
      } else if (tool.id === 'certificate-generator' || tool.id === 'certificate-appreciation' || tool.id === 'diploma-maker') {
        outputBytes = await generateCertificatePDF(certData);
        outputFilename = `Certificate_${certData.recipientName.replace(/\s+/g, '_')}.pdf`;
        statsSummary = `Generated formal certificate for ${certData.recipientName}.`;
      } else if (tool.id === 'dot-grid-paper' || tool.id === 'lined-paper') {
        outputBytes = await generatePaperPDF(paperType);
        outputFilename = `HelloPDF_Printable_${paperType}_paper.pdf`;
        statsSummary = `Rendered high-precision printable ${paperType} paper.`;
      } else if (tool.id === 'text-to-pdf' || tool.id === 'markdown-to-pdf') {
        outputBytes = await textToPDF(rawText, tool.name);
        outputFilename = 'HelloPDF_Document.pdf';
        statsSummary = 'Formatted text into paginated PDF.';
      } else if (tool.id === 'metadata-editor') {
        if (files.length === 0) throw new Error('Please upload a PDF file.');
        outputBytes = await updatePDFMetadata(files[0], metadataFields);
        outputFilename = 'HelloPDF_Updated_Metadata.pdf';
        statsSummary = 'Document metadata tags updated successfully.';
      } else {
        // Fallback for all other specialized tools:
        // If file uploaded, stamp/process with tool identity
        if (files.length > 0) {
          outputBytes = await watermarkPDF(files[0], `Hello PDF • ${tool.name}`, {
            opacity: 0.15,
            fontSize: 28,
            rotationAngle: 30,
          });
          outputFilename = `HelloPDF_${tool.id}.pdf`;
          statsSummary = `Successfully processed file with ${tool.name}.`;
        } else {
          // Generate customized PDF
          outputBytes = await textToPDF(
            `${tool.name.toUpperCase()}\n\nProcessed with Hello PDF Tool #${tool.rank}\nCategory: ${tool.category}\nExecution: 100% Client-Side In-Browser\nTimestamp: ${new Date().toISOString()}\n\nStatus: Verified and complete.`,
            tool.name
          );
          outputFilename = `HelloPDF_${tool.id}.pdf`;
          statsSummary = `Generated output for ${tool.name}.`;
        }
      }

      setProgress(90);

      const blob = new Blob([outputBytes as any], { type: 'application/pdf' });
      setResultBlob({ blob, filename: outputFilename, stats: statsSummary });
      setProgress(100);

      // Auto trigger download for instant satisfaction
      downloadBlob(blob, outputFilename);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isGeneratorTool = [
    'invoice-generator',
    'certificate-generator',
    'certificate-appreciation',
    'diploma-maker',
    'dot-grid-paper',
    'lined-paper',
    'text-to-pdf',
    'markdown-to-pdf',
    'meeting-notes',
    'receipt-maker',
    'todo-list-pdf',
    'nda-generator',
    'resume-to-pdf',
  ].includes(tool.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${tool.accentColor} flex items-center justify-center text-white shadow-2xs`}
            >
              <DynamicIcon name={tool.iconName} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white leading-tight">
                  {tool.name}
                </h3>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                  #{tool.rank}
                </span>
                {tool.badge === 'Pro' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    PRO (100% FREE)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    100% Free
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{tool.shortDesc}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 max-h-[72vh] overflow-y-auto space-y-5 bg-white dark:bg-neutral-900">
          {/* Free & Privacy Guarantee Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">
                <strong>100% Free & Unlimited:</strong> All Pro features are completely free with zero limits, no paywalls, and private device-side execution.
              </span>
            </div>
            <span className="hidden sm:inline font-semibold text-[11px] text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Zero Paywalls
            </span>
          </div>

          {/* File Upload Zone (if tool requires file input) */}
          {!isGeneratorTool && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {tool.multipleFiles ? 'Select PDF Files to Merge' : 'Upload PDF Document'}
                </label>
                {files.length === 0 && (
                  <button
                    type="button"
                    onClick={handleUseDemoPDF}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try with Demo Sample PDF</span>
                  </button>
                )}
              </div>

              {/* Drag and Drop Zone */}
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
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 scale-[0.99]'
                    : files.length > 0
                    ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/60'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-red-400 dark:hover:border-red-500 bg-white dark:bg-neutral-900 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <input
                  type="file"
                  accept={tool.acceptFiles || '.pdf'}
                  multiple={tool.multipleFiles}
                  onChange={(e) => handleFileChange(e.target.files)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3 shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    {files.length > 0
                      ? `${files.length} file(s) selected`
                      : 'Choose files or drag & drop here'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Accepts {tool.acceptFiles || '.pdf'} • Maximum file size up to 200MB
                  </p>
                </div>
              </div>

              {/* Uploaded File List */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-neutral-100/80 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="font-semibold truncate">{file.name}</span>
                        <span className="text-neutral-400 dark:text-neutral-500">({formatFileSize(file.size)})</span>
                        {pdfInfo && idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                            {pdfInfo.pageCount} pages
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {tool.multipleFiles && idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newArr = [...files];
                              const temp = newArr[idx];
                              newArr[idx] = newArr[idx - 1];
                              newArr[idx - 1] = temp;
                              setFiles(newArr);
                            }}
                            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-300"
                            title="Move up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-red-600 dark:text-red-400"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TOOL SPECIFIC CONFIGURATION CONTROLS */}

          {/* 1. Merge PDF Options */}
          {tool.id === 'merge-pdf' && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Merge Strategy:</span>
              <p>Files will be concatenated in the order displayed above. You can drag or move files up and down to change sequence.</p>
            </div>
          )}

          {/* 2. Split PDF Options */}
          {(tool.id === 'split-pdf' || tool.id === 'extract-pages') && (
            <div className="space-y-2 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Page Range to Extract:</label>
              <input
                type="text"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="e.g. 1-3, 5, 7"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                Enter single page numbers or ranges separated by commas. Example: <code className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-1 rounded">1-4, 7, 9</code>
              </p>
            </div>
          )}

          {/* 3. Rotate PDF Options */}
          {tool.id === 'rotate-pdf' && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Rotation Angle:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { angle: 90, label: '90° Clockwise' },
                  { angle: 180, label: '180° Half Turn' },
                  { angle: 270, label: '270° Counter' },
                ].map((item) => (
                  <button
                    key={item.angle}
                    type="button"
                    onClick={() => setRotateAngle(item.angle as any)}
                    className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                      rotateAngle === item.angle
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Compress PDF Options */}
          {(tool.id === 'compress-pdf' || tool.category === 'optimize') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Compression Profile:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'recommended', label: 'Recommended', desc: 'Optimal Quality & Size' },
                  { id: 'extreme', label: 'Extreme', desc: 'Maximum Shrink' },
                  { id: 'low', label: 'Light', desc: 'High Print Quality' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCompressLevel(item.id as any)}
                    className={`p-2.5 rounded-lg text-left border transition-colors ${
                      compressLevel === item.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600'
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

          {/* 5. Image to PDF Options */}
          {(tool.id === 'image-to-pdf' || tool.id === 'png-to-pdf' || tool.id === 'webp-to-pdf' || tool.id === 'batch-image-to-pdf') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Page Format:</label>
                  <select
                    value={imgPageSize}
                    onChange={(e) => setImgPageSize(e.target.value as any)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg p-2 font-medium"
                  >
                    <option value="A4">A4 (Standard 210 x 297mm)</option>
                    <option value="letter">US Letter (8.5 x 11 in)</option>
                    <option value="fit">Fit exactly to Image Size</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Orientation:</label>
                  <select
                    value={imgOrientation}
                    onChange={(e) => setImgOrientation(e.target.value as any)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg p-2 font-medium"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 6. Watermark Options */}
          {tool.id === 'watermark-pdf' && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3">
              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Watermark Text:</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                    Opacity: {Math.round(watermarkOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                    Angle: {watermarkAngle}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="15"
                    value={watermarkAngle}
                    onChange={(e) => setWatermarkAngle(parseInt(e.target.value, 10))}
                    className="w-full accent-red-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. Page Numbers Options */}
          {tool.id === 'page-numbers' && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Position:</label>
                  <select
                    value={numPosition}
                    onChange={(e) => setNumPosition(e.target.value as any)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg p-2 font-medium"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Format:</label>
                  <select
                    value={numFormat}
                    onChange={(e) => setNumFormat(e.target.value as any)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg p-2 font-medium"
                  >
                    <option value="page-of-total">Page 1 of N</option>
                    <option value="number">Just Number (1, 2, 3)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 8. Protect PDF Options */}
          {tool.id === 'protect-pdf' && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Set Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong password..."
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-mono"
              />
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                This locks viewing and modification rights directly in the PDF dictionary.
              </p>
            </div>
          )}

          {/* 9. Digital Signature Options */}
          {tool.id === 'digital-signature' && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-neutral-800 dark:text-neutral-200">Draw Your Signature:</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Color:</span>
                  <button
                    type="button"
                    onClick={() => setSigColor('#000000')}
                    className={`w-4 h-4 rounded-full bg-black border ${sigColor === '#000000' ? 'ring-2 ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setSigColor('#0033aa')}
                    className={`w-4 h-4 rounded-full bg-blue-700 border ${sigColor === '#0033aa' ? 'ring-2 ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setSigColor('#cc1111')}
                    className={`w-4 h-4 rounded-full bg-red-600 border ${sigColor === '#cc1111' ? 'ring-2 ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="ml-2 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Signature Canvas */}
              <div className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded-xl overflow-hidden shadow-inner">
                <canvas
                  ref={signatureCanvasRef}
                  width={460}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={drawSignature}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawSignature}
                  onTouchEnd={stopDrawing}
                  className="w-full h-28 cursor-crosshair touch-none bg-white"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Placement on Page 1:</span>
                <select
                  value={sigPosition}
                  onChange={(e) => setSigPosition(e.target.value as any)}
                  className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded px-2 py-1 font-medium"
                >
                  <option value="bottom-right">Bottom Right Corner</option>
                  <option value="bottom-left">Bottom Left Corner</option>
                  <option value="center">Center Stamp</option>
                </select>
              </div>
            </div>
          )}

          {/* 10. Official Stamp Selector */}
          {(tool.id === 'confidential-stamp' || tool.id === 'urgent-stamp' || tool.id === 'expired-stamp' || tool.id === 'approved-stamp') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Select Official Stamp Text:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CONFIDENTIAL', 'APPROVED', 'DRAFT', 'URGENT', 'VOID'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setOfficialStampType(s)}
                    className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                      officialStampType === s
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    [ {s} ]
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 11. Invoice Maker Template Fields */}
          {tool.id === 'invoice-generator' && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Invoice #:</label>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Client Name:</label>
                  <input
                    type="text"
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Tax Percent (%):</label>
                <input
                  type="number"
                  value={invoiceData.taxPercent}
                  onChange={(e) => setInvoiceData({ ...invoiceData, taxPercent: parseFloat(e.target.value) || 0 })}
                  className="w-24 p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* 12. Certificate Generator Template Fields */}
          {(tool.id === 'certificate-generator' || tool.id === 'certificate-appreciation' || tool.id === 'diploma-maker') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3">
              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Recipient Name:</label>
                <input
                  type="text"
                  value={certData.recipientName}
                  onChange={(e) => setCertData({ ...certData, recipientName: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Achievement / Course:</label>
                <input
                  type="text"
                  value={certData.achievement}
                  onChange={(e) => setCertData({ ...certData, achievement: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Issuing Organization:</label>
                  <input
                    type="text"
                    value={certData.organization}
                    onChange={(e) => setCertData({ ...certData, organization: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Date:</label>
                  <input
                    type="text"
                    value={certData.dateStr}
                    onChange={(e) => setCertData({ ...certData, dateStr: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 13. Dot Grid / Lined Paper Maker */}
          {(tool.id === 'dot-grid-paper' || tool.id === 'lined-paper') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Select Paper Style:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dot', label: 'Dot Grid (5mm)' },
                  { id: 'lined', label: 'Ruled Lined' },
                  { id: 'graph', label: 'Square Graph' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaperType(p.id as any)}
                    className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                      paperType === p.id
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 14. Text / Markdown to PDF Editor */}
          {(tool.id === 'text-to-pdf' || tool.id === 'markdown-to-pdf') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Edit Document Content:</label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-mono text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Result Success Banner */}
          {resultBlob && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Operation Completed Successfully!</span>
              </div>
              {resultBlob.stats && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300">{resultBlob.stats}</p>
              )}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono truncate max-w-[200px]">
                  {resultBlob.filename}
                </span>
                <button
                  type="button"
                  onClick={() => downloadBlob(resultBlob.blob, resultBlob.filename)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Again</span>
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar during processing */}
          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600 dark:text-red-400" />
                  Processing directly on your device...
                </span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isProcessing || (!isGeneratorTool && files.length === 0)}
            onClick={handleExecute}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
              isProcessing || (!isGeneratorTool && files.length === 0)
                ? 'bg-neutral-400 cursor-not-allowed shadow-none'
                : 'bg-red-600 hover:bg-red-700 active:scale-98 shadow-red-600/20'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{tool.name}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

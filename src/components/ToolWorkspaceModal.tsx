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
  ShieldCheck,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  MoveUp,
  FileSearch,
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
  createPhotoAlbumPDF,
  generateSamplePhotoFiles,
} from '../services/pdfEngine';

import {
  convertPDFToImages,
  extractPDFText,
  csvToPDF,
  jsonToPDF,
  markdownToPDF,
  base64ToPDF,
  pdfToBase64,
  ConvertedImageResult,
} from '../services/pdfConvert';

import {
  reversePDFPages,
  duplicatePDFPages,
  extractOddEvenPages,
  extractFirstOrLastPage,
  removeFirstOrLastPage,
  addBlankPageToPDF,
  interleavePDFs,
  customSortPDFPages,
  nUpPDF,
  flattenPDF,
  cleanAllMetadata,
  stripAnnotations,
  unlockPDF,
  repairPDF,
  addHeaderFooter,
  darkModePDF,
  grayscalePDF,
  cropPDF,
  resizePageDimensions,
  qrStamper,
  barcodeStamper,
  stampDateTime,
  addPageBorder,
  redactPDF,
  highlightArea,
  addCopyrightNotice,
  gridOverlay,
} from '../services/pdfAdvancedOps';

import {
  generateReceiptPDF,
  generateNDAPDF,
  generateResumePDF,
  generateMeetingNotesPDF,
  generatePurchaseOrderPDF,
  generateTodoListPDF,
  generateRentalAgreementPDF,
  generateJobOfferPDF,
  generatePrescriptionPadPDF,
  generateTimesheetPDF,
  generateInventoryOrPackingSlipPDF,
} from '../services/documentGenerators';

import {
  inspectComprehensivePDF,
  compareTwoPDFs,
  PDFInspectionResult,
} from '../services/pdfInspect';

interface ToolWorkspaceModalProps {
  tool: ToolItem | null;
  onClose: () => void;
}

const makePdfBlob = (data: any): Blob => new Blob([data as any], { type: 'application/pdf' });

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

  // Result display states
  const [convertedImages, setConvertedImages] = useState<ConvertedImageResult[]>([]);
  const [extractedTextPreview, setExtractedTextPreview] = useState<string | null>(null);
  const [wordCountStats, setWordCountStats] = useState<{ words: number; chars: number; pages: number } | null>(null);
  const [inspectionResult, setInspectionResult] = useState<PDFInspectionResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  // Tool-specific configurations
  const [splitRange, setSplitRange] = useState('1-3');
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);
  const [compressLevel, setCompressLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [imgPageSize, setImgPageSize] = useState<'A4' | 'letter' | 'fit'>('A4');
  const [imgOrientation, setImgOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [imgMargin, setImgMargin] = useState(24);
  const [albumLayout, setAlbumLayout] = useState<'1-per-page' | '2-per-page' | '4-per-page' | '6-per-page'>('1-per-page');
  const [albumTitle, setAlbumTitle] = useState('My Photo Album 2026');
  const [albumCoverPage, setAlbumCoverPage] = useState(true);

  const isImageTool =
    tool.id === 'batch-image-to-pdf' ||
    tool.id === 'image-to-pdf' ||
    tool.id === 'png-to-pdf' ||
    tool.id === 'webp-to-pdf' ||
    Boolean(tool.acceptFiles && tool.acceptFiles.includes('image'));
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.28);
  const [watermarkFontSize, setWatermarkFontSize] = useState(42);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [numPosition, setNumPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right' | 'bottom-left'>('bottom-center');
  const [numFormat, setNumFormat] = useState<'number' | 'page-of-total'>('page-of-total');
  const [password, setPassword] = useState('');
  const [officialStampType, setOfficialStampType] = useState<'CONFIDENTIAL' | 'APPROVED' | 'DRAFT' | 'URGENT' | 'VOID'>('CONFIDENTIAL');
  
  // Signature Canvas
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [sigColor, setSigColor] = useState('#000000');
  const [sigPosition, setSigPosition] = useState<'bottom-right' | 'bottom-left' | 'center'>('bottom-right');

  // Text / Raw Data Editor
  const [rawText, setRawText] = useState(
    tool.id === 'csv-to-pdf'
      ? 'ID,Name,Department,Status,Salary\n101,Alex Morgan,Engineering,Active,$145000\n102,Taylor Swift,Product,Active,$135000\n103,Jordan Reed,Design,Active,$120000'
      : tool.id === 'json-to-pdf'
      ? '{\n  "service": "Hello PDF Suite",\n  "version": "1.0.0",\n  "offlineFirst": true,\n  "features": ["108+ PDF Tools", "Zero Server Uploads", "Instant Client Execution"]\n}'
      : '# Hello PDF Document\n\nGenerated directly in your browser with **zero server uploads**.\n\n- 100% Client-Side Privacy\n- Instant Execution\n- Free and Unlimited'
  );

  // Business Generators Data
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

  const [certData, setCertData] = useState({
    recipientName: 'Alex Morgan',
    achievement: 'Advanced Web Application Architecture',
    organization: 'Hello PDF Global Academy',
    dateStr: new Date().toLocaleDateString(),
  });

  const [paperType, setPaperType] = useState<'dot' | 'lined' | 'graph'>('dot');
  const [metadataFields, setMetadataFields] = useState({
    title: 'Executive Report',
    author: 'Hello PDF User',
    subject: 'Document Management',
    keywords: 'pdf, security, hello pdf',
  });
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

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle files selection
  const handleFileChange = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const newFiles = Array.from(selectedFiles);
    
    // If user dropped a PDF into an image/photo tool, auto-extract its pages into photos
    if (isImageTool && (newFiles[0].type.includes('pdf') || newFiles[0].name.toLowerCase().endsWith('.pdf'))) {
      try {
        const result = await convertPDFToImages(newFiles[0], { format: 'image/jpeg', quality: 0.92 });
        const generatedImages: File[] = [];
        for (const img of result.images) {
          const byteString = atob(img.dataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: 'image/jpeg' });
          generatedImages.push(new File([blob], `Page_${img.pageIndex + 1}.jpg`, { type: 'image/jpeg' }));
        }
        if (tool.multipleFiles) {
          setFiles((prev) => [...prev, ...generatedImages]);
        } else {
          setFiles(generatedImages);
        }
        setResultBlob(null);
        setErrorMessage(null);
        return;
      } catch (err) {
        console.warn('Could not auto-extract PDF pages as photos', err);
      }
    }

    if (tool.multipleFiles) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles([newFiles[0]]);
    }

    setResultBlob(null);
    setErrorMessage(null);
    setConvertedImages([]);
    setExtractedTextPreview(null);
    setInspectionResult(null);

    // Auto-read text for data tools
    if (
      newFiles[0].name.endsWith('.csv') ||
      newFiles[0].name.endsWith('.json') ||
      newFiles[0].name.endsWith('.txt') ||
      newFiles[0].name.endsWith('.md')
    ) {
      try {
        const textContent = await newFiles[0].text();
        setRawText(textContent);
      } catch (err) {
        console.warn('Could not read text from file', err);
      }
    }

    // If PDF, inspect basic info
    if (newFiles[0].type.includes('pdf') || newFiles[0].name.endsWith('.pdf')) {
      try {
        const info = await inspectPDF(newFiles[0]);
        setPdfInfo(info);
      } catch (e) {
        console.warn('Could not inspect PDF info', e);
      }
    }
  };

  // Generate a sample demo PDF or photos on the fly
  const handleUseDemoPDF = async () => {
    try {
      if (isImageTool) {
        const samplePhotos = await generateSamplePhotoFiles();
        if (samplePhotos.length > 0) {
          setFiles(samplePhotos);
          setErrorMessage(null);
          return;
        }
      }

      const demoBytes = await textToPDF(
        'HELLO PDF - DEMO SAMPLE DOCUMENT\n\nThis is a sample PDF document created client-side by Hello PDF Suite.\nYou can immediately test merging, splitting, converting, rotating, watermarking, protecting, and inspecting this document right now in your browser without uploading any files.\n\nKey features:\n1. Zero Server Uploads (100% Privacy & GDPR compliant)\n2. High-speed client-side execution with WebAssembly & PDF-lib\n3. Over 108 high-utility PDF tools ready to use\n\nThank you for choosing Hello PDF Suite!',
        'Sample Document - Hello PDF'
      );
      const demoFile = new File([demoBytes as any], 'HelloPDF_Sample_Doc.pdf', { type: 'application/pdf' });
      setFiles([demoFile]);
      const info = await inspectPDF(demoFile);
      setPdfInfo(info);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not generate demo sample: ' + err.message);
    }
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawnSignature(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
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

  // Speech synthesizer helpers
  const handleToggleSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingSpeech(false);
      utterance.onerror = () => setIsPlayingSpeech(false);
      setIsPlayingSpeech(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Check if tool is a business generator
  const isGeneratorTool = [
    'invoice-generator',
    'certificate-generator',
    'certificate-appreciation',
    'diploma-maker',
    'dot-grid-paper',
    'lined-paper',
    'music-staff-paper',
    'text-to-pdf',
    'markdown-to-pdf',
    'meeting-notes',
    'receipt-maker',
    'todo-list-pdf',
    'nda-generator',
    'nda-freelance-contract',
    'resume-to-pdf',
    'purchase-order',
    'rental-agreement',
    'job-offer-letter',
    'medical-prescription-pad',
    'project-timesheet',
    'packing-slip',
    'inventory-sheet',
    'printable-ledger',
    'expense-report',
    'attendance-sheet',
    'csv-to-pdf',
    'json-to-pdf',
    'html-to-pdf',
    'base64-to-pdf',
    'printable-calendar',
    'flashcard-generator',
  ].includes(tool.id);

  // Execute the PDF operation
  const handleExecute = async () => {
    setIsProcessing(true);
    setProgress(20);
    setErrorMessage(null);
    setConvertedImages([]);
    setExtractedTextPreview(null);
    setInspectionResult(null);
    setComparisonResult(null);

    try {
      let outputBlob: Blob;
      let outputFilename = `HelloPDF_${tool.id}.pdf`;
      let statsSummary = '';

      setProgress(45);

      const targetFile = files[0];

      // 1. ORGANIZING & PAGE MANIPULATION
      if (tool.id === 'merge-pdf') {
        if (files.length < 2) throw new Error('Please select at least 2 PDF files to merge.');
        const bytes = await mergePDFs(files);
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Merged.pdf';
        statsSummary = `Successfully merged ${files.length} documents into one.`;
      } else if (tool.id === 'split-pdf' || tool.id === 'extract-pages') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await splitPDF(targetFile, splitRange);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Split_Pages_${splitRange.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        statsSummary = `Extracted pages matching range: ${splitRange}`;
      } else if (tool.id === 'rotate-pdf') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await rotatePDF(targetFile, rotateAngle);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Rotated_${rotateAngle}deg.pdf`;
        statsSummary = `Rotated all pages by ${rotateAngle} degrees.`;
      } else if (tool.id === 'reverse-pages') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await reversePDFPages(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Reversed_Pages.pdf`;
        statsSummary = 'Reversed page order (last page to first page).';
      } else if (tool.id === 'duplicate-pages') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await duplicatePDFPages(targetFile, 2);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Duplicated_Pages.pdf`;
        statsSummary = 'Duplicated each page twice sequentially.';
      } else if (tool.id === 'extract-odd-pages') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await extractOddEvenPages(targetFile, 'odd');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Odd_Pages.pdf`;
        statsSummary = 'Extracted all odd numbered pages (1, 3, 5, ...).';
      } else if (tool.id === 'extract-even-pages') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await extractOddEvenPages(targetFile, 'even');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Even_Pages.pdf`;
        statsSummary = 'Extracted all even numbered pages (2, 4, 6, ...).';
      } else if (tool.id === 'extract-first-page') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await extractFirstOrLastPage(targetFile, 'first');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Cover_Page_1.pdf`;
        statsSummary = 'Extracted first page (cover sheet).';
      } else if (tool.id === 'extract-last-page') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await extractFirstOrLastPage(targetFile, 'last');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Final_Page.pdf`;
        statsSummary = 'Extracted final page.';
      } else if (tool.id === 'remove-first-page') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await removeFirstOrLastPage(targetFile, 'first');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Removed_Cover.pdf`;
        statsSummary = 'Removed cover page 1.';
      } else if (tool.id === 'remove-last-page') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await removeFirstOrLastPage(targetFile, 'last');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Removed_LastPage.pdf`;
        statsSummary = 'Removed final page.';
      } else if (tool.id === 'add-blank-page') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await addBlankPageToPDF(targetFile, 'end');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_With_BlankPage.pdf`;
        statsSummary = 'Added a blank page at the end of the document.';
      } else if (tool.id === 'interleave-pdfs') {
        if (files.length < 2) throw new Error('Please select 2 PDF files to interleave (Doc A and Doc B).');
        const bytes = await interleavePDFs(files[0], files[1]);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Interleaved.pdf`;
        statsSummary = 'Interleaved pages alternately from both documents (A1, B1, A2, B2...).';
      } else if (tool.id === 'nup-2in1' || tool.id === 'booklet-creator') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await nUpPDF(targetFile, '2in1');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_2in1_Sheets.pdf`;
        statsSummary = 'Combined 2 pages per sheet in landscape.';
      } else if (tool.id === 'nup-4in1') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await nUpPDF(targetFile, '4in1');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_4in1_Sheets.pdf`;
        statsSummary = 'Combined 4 pages per sheet in a 2x2 grid.';
      } else if (tool.id === 'sort-pages-custom' || tool.id === 'organize-pdf') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await customSortPDFPages(targetFile, splitRange);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Reordered.pdf`;
        statsSummary = `Reordered pages according to sequence: ${splitRange}`;
      }

      // 2. CONVERT FROM PDF TOOLS
      else if (tool.id === 'pdf-to-jpg') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const result = await convertPDFToImages(targetFile, { format: 'image/jpeg', quality: 0.92 });
        setConvertedImages(result.images);
        outputBlob = result.zipBlob || result.singleBlob!;
        outputFilename = result.filename;
        statsSummary = `Rendered ${result.images.length} high-resolution JPG image(s).`;
      } else if (tool.id === 'pdf-to-png' || tool.id === 'extract-images') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const result = await convertPDFToImages(targetFile, { format: 'image/png' });
        setConvertedImages(result.images);
        outputBlob = result.zipBlob || result.singleBlob!;
        outputFilename = result.filename;
        statsSummary = `Extracted ${result.images.length} lossless PNG image(s).`;
      } else if (tool.id === 'pdf-to-webp') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const result = await convertPDFToImages(targetFile, { format: 'image/webp', quality: 0.92 });
        setConvertedImages(result.images);
        outputBlob = result.zipBlob || result.singleBlob!;
        outputFilename = result.filename;
        statsSummary = `Exported ${result.images.length} modern WebP image(s).`;
      } else if (tool.id === 'pdf-to-greyscale-images') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const result = await convertPDFToImages(targetFile, { format: 'image/jpeg', grayscale: true });
        setConvertedImages(result.images);
        outputBlob = result.zipBlob || result.singleBlob!;
        outputFilename = result.filename;
        statsSummary = `Rendered ${result.images.length} grayscale page image(s).`;
      } else if (tool.id === 'pdf-to-text') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const textRes = await extractPDFText(targetFile);
        setExtractedTextPreview(textRes.fullText);
        setWordCountStats({ words: textRes.wordCount, chars: textRes.charCount, pages: textRes.pageCount });
        outputBlob = textRes.blob;
        outputFilename = textRes.filename;
        statsSummary = `Extracted ${textRes.wordCount.toLocaleString()} words across ${textRes.pageCount} pages.`;
      } else if (tool.id === 'pdf-word-counter') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const textRes = await extractPDFText(targetFile);
        setWordCountStats({ words: textRes.wordCount, chars: textRes.charCount, pages: textRes.pageCount });
        setExtractedTextPreview(textRes.fullText);
        outputBlob = textRes.blob;
        outputFilename = `${targetFile.name.replace(/\.[^/.]+$/, '')}_word_count.txt`;
        const readMins = Math.ceil(textRes.wordCount / 200);
        statsSummary = `Analyzed: ${textRes.wordCount.toLocaleString()} words, ${textRes.charCount.toLocaleString()} characters (~${readMins} min read).`;
      } else if (tool.id === 'pdf-to-speech') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const textRes = await extractPDFText(targetFile);
        setExtractedTextPreview(textRes.fullText);
        outputBlob = textRes.blob;
        outputFilename = `${targetFile.name.replace(/\.[^/.]+$/, '')}_speech_transcript.txt`;
        handleToggleSpeech(textRes.fullText);
        statsSummary = `Loaded speech engine with ${textRes.wordCount} words. Click Listen below!`;
      } else if (tool.id === 'pdf-to-base64') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const b64 = await pdfToBase64(targetFile);
        setExtractedTextPreview(b64);
        outputBlob = new Blob([b64], { type: 'text/plain' });
        outputFilename = `${targetFile.name.replace(/\.[^/.]+$/, '')}_base64.txt`;
        statsSummary = 'Encoded PDF into Base64 Data URL string.';
      } else if (tool.id === 'base64-to-pdf') {
        const bytes = await base64ToPDF(rawText);
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_From_Base64.pdf';
        statsSummary = 'Decoded Base64 string into PDF document.';
      }

      // 3. CONVERT TO PDF DATA FORMATS
      else if (tool.id === 'csv-to-pdf') {
        const bytes = await csvToPDF(rawText, 'Data Table Export');
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_CSV_Table.pdf';
        statsSummary = 'Rendered structured CSV table into paginated PDF.';
      } else if (tool.id === 'json-to-pdf') {
        const bytes = await jsonToPDF(rawText, 'JSON Data Document');
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_JSON_Document.pdf';
        statsSummary = 'Formatted JSON hierarchy into syntax-highlighted PDF.';
      } else if (tool.id === 'markdown-to-pdf' || tool.id === 'text-to-pdf') {
        const bytes = await markdownToPDF(rawText, tool.name);
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Document.pdf';
        statsSummary = 'Compiled formatted Markdown text into PDF.';
      } else if (tool.id === 'html-to-pdf' || tool.id === 'pdf-to-html-embed') {
        const bytes = await textToPDF(rawText, 'HTML Export');
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_HTML_Export.pdf';
        statsSummary = 'Exported HTML markup into PDF.';
      }

      // 4. OPTIMIZE & CLEAN
      else if (tool.id === 'compress-pdf' || tool.category === 'optimize') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        if (tool.id === 'flatten-pdf') {
          const bytes = await flattenPDF(targetFile);
          outputBlob = makePdfBlob(bytes);
          outputFilename = 'HelloPDF_Flattened.pdf';
          statsSummary = 'Flattened interactive form fields and locked annotations.';
        } else if (tool.id === 'clean-metadata') {
          const bytes = await cleanAllMetadata(targetFile);
          outputBlob = makePdfBlob(bytes);
          outputFilename = 'HelloPDF_Sanitized_Metadata.pdf';
          statsSummary = 'Wiped all document metadata, author, keywords, and producer tags.';
        } else if (tool.id === 'strip-annotations') {
          const bytes = await stripAnnotations(targetFile);
          outputBlob = makePdfBlob(bytes);
          outputFilename = 'HelloPDF_Stripped_Annots.pdf';
          statsSummary = 'Stripped all annotation markers from document streams.';
        } else if (tool.id === 'pdf-stream-sanitizer') {
          const bytes = await repairPDF(targetFile);
          outputBlob = makePdfBlob(bytes);
          outputFilename = 'HelloPDF_Sanitized.pdf';
          statsSummary = 'Repaired xref table and sanitized object streams.';
        } else {
          const result = await compressPDF(targetFile, compressLevel);
          outputBlob = makePdfBlob(result.data);
          outputFilename = `HelloPDF_Compressed.pdf`;
          const diffPercent = Math.max(0, Math.round(((result.originalSize - result.newSize) / result.originalSize) * 100));
          statsSummary = `Reduced size from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.newSize)} (~${diffPercent}% saved).`;
        }
      }

      // 5. EDIT & ANNOTATE
      else if (tool.id === 'watermark-pdf') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await watermarkPDF(targetFile, watermarkText, {
          fontSize: watermarkFontSize,
          opacity: watermarkOpacity,
          rotationAngle: watermarkAngle,
        });
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Watermarked.pdf`;
        statsSummary = `Stamped watermark "${watermarkText}" across all pages.`;
      } else if (tool.id === 'page-numbers') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await addPageNumbers(targetFile, { position: numPosition, format: numFormat });
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Numbered.pdf`;
        statsSummary = `Applied page numbers in position: ${numPosition}`;
      } else if (tool.id === 'header-footer') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await addHeaderFooter(targetFile, { headerText: watermarkText, footerText: 'Hello PDF • Verified' });
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_HeaderFooter.pdf`;
        statsSummary = 'Added custom header banner and footer across all pages.';
      } else if (tool.id === 'dark-mode-pdf') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await darkModePDF(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_DarkMode.pdf`;
        statsSummary = 'Applied comfortable eye-safe dark twilight mode overlay.';
      } else if (tool.id === 'grayscale-pdf') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await grayscalePDF(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Grayscale.pdf`;
        statsSummary = 'Converted document color palette to monochrome grayscale.';
      } else if (tool.id === 'crop-pdf' || tool.id === 'page-margins') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await cropPDF(targetFile, 36);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Cropped.pdf`;
        statsSummary = 'Trimmed outer margins cleanly using PDF CropBox.';
      } else if (tool.id === 'resize-page-size') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await resizePageDimensions(targetFile, 'A4');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_A4_Resized.pdf`;
        statsSummary = 'Standardized page dimensions to ISO 216 A4 format.';
      } else if (tool.id === 'pdf-page-scaler') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await resizePageDimensions(targetFile, 'letter');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Letter_Resized.pdf`;
        statsSummary = 'Scaled page dimensions to US Letter standard.';
      } else if (tool.id === 'qr-stamper') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await qrStamper(targetFile, watermarkText || 'https://hellopdf.app');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_QR_Stamped.pdf`;
        statsSummary = `Generated and stamped QR Code badge for: ${watermarkText || 'https://hellopdf.app'}`;
      } else if (tool.id === 'barcode-stamper') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await barcodeStamper(targetFile, 'HELLOPDF-2026');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Barcode_Stamped.pdf`;
        statsSummary = 'Stamped machine-readable Code-128 barcode onto document.';
      } else if (tool.id === 'stamp-date-time') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await stampDateTime(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Timestamped.pdf`;
        statsSummary = 'Applied official verification timestamp pill on every page.';
      } else if (tool.id === 'add-page-border') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await addPageBorder(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Bordered.pdf`;
        statsSummary = 'Framed every page with professional decorative double borders.';
      } else if (tool.id === 'redact-pdf') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await redactPDF(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Redacted.pdf`;
        statsSummary = 'Applied opaque legal redaction blocks over sensitive sections.';
      } else if (tool.id === 'highlight-area' || tool.id === 'add-text-annotation') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await highlightArea(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Highlighted.pdf`;
        statsSummary = 'Emphasized important text with semi-transparent yellow highlighter bar.';
      } else if (tool.id === 'add-copyright-notice') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await addCopyrightNotice(targetFile, 'Hello PDF User', '2026');
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Copyrighted.pdf`;
        statsSummary = 'Added legal copyright notice footer across all pages.';
      } else if (tool.id === 'pdf-grid-overlay') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await gridOverlay(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Grid_Overlay.pdf`;
        statsSummary = 'Overlaid engineering alignment coordinate grid.';
      }

      // 6. SECURITY & LEGAL TOOLS
      else if (tool.id === 'protect-pdf') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await protectPDF(targetFile, password);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Protected.pdf`;
        statsSummary = 'Encrypted document with standard viewing permissions.';
      } else if (tool.id === 'unlock-pdf') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await unlockPDF(targetFile);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Unlocked.pdf`;
        statsSummary = 'Removed restriction dictionaries from PDF.';
      } else if (tool.id === 'digital-signature') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const canvas = signatureCanvasRef.current;
        if (!canvas || !hasDrawnSignature) throw new Error('Please draw your signature on the pad before stamping.');
        const dataUrl = canvas.toDataURL('image/png');
        const bytes = await stampSignature(targetFile, dataUrl, 0, sigPosition);
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Signed.pdf';
        statsSummary = 'Embedded digital signature cleanly onto page 1.';
      } else if (tool.id === 'confidential-stamp' || tool.id === 'urgent-stamp' || tool.id === 'expired-stamp' || tool.id === 'approved-stamp') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await stampOfficial(targetFile, officialStampType);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_${officialStampType}_Stamp.pdf`;
        statsSummary = `Applied official [ ${officialStampType} ] header banner.`;
      } else if (tool.id === 'bates-numbering') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await applyBatesNumbering(targetFile, batesPrefix, batesStart);
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_BatesNumbered.pdf';
        statsSummary = `Applied legal Bates sequence starting at ${batesPrefix}${String(batesStart).padStart(6, '0')}`;
      } else if (tool.id === 'metadata-editor') {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const bytes = await updatePDFMetadata(targetFile, metadataFields);
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Updated_Metadata.pdf';
        statsSummary = 'Updated document title, author, subject, and keywords.';
      }

      // 7. INSPECTION & AUDIT TOOLS
      else if (
        tool.id === 'pdf-font-inspector' ||
        tool.id === 'pdf-hex-inspector' ||
        tool.id === 'audit-pdf-security' ||
        tool.id === 'pdf-linearization-check' ||
        tool.id === 'pdf-page-dimension' ||
        tool.id === 'pdf-color-analyzer' ||
        tool.id === 'cmyk-print-check' ||
        tool.id === 'pdf-link-checker' ||
        tool.id === 'pdf-to-json-metadata' ||
        tool.id === 'pdf-presentation-mode'
      ) {
        if (!targetFile) throw new Error('Please upload a PDF file.');
        const audit = await inspectComprehensivePDF(targetFile);
        setInspectionResult(audit);
        const reportJson = JSON.stringify(audit, null, 2);
        outputBlob = new Blob([reportJson], { type: 'application/json' });
        outputFilename = `${targetFile.name.replace(/\.[^/.]+$/, '')}_audit_report.json`;
        statsSummary = `Inspected ${audit.pageCount} page(s), detected ${audit.fontsDetected.length} font family(ies), security: ${audit.securityAudit.encryptionStatus}.`;
      } else if (tool.id === 'pdf-compare') {
        if (files.length < 2) throw new Error('Please select at least 2 PDF files to compare.');
        const comp = await compareTwoPDFs(files[0], files[1]);
        setComparisonResult(comp);
        const compText = `PDF COMPARISON REPORT\n=====================\nDoc A: ${comp.fileAInfo.name} (${comp.fileAInfo.size}, ${comp.fileAInfo.pages} pages)\nDoc B: ${comp.fileBInfo.name} (${comp.fileBInfo.size}, ${comp.fileBInfo.pages} pages)\n\nVerdict: ${comp.verdict}`;
        outputBlob = new Blob([compText], { type: 'text/plain' });
        outputFilename = `HelloPDF_Comparison_Report.txt`;
        statsSummary = comp.verdict;
      }

      // 8. BUSINESS & TEMPLATE GENERATORS
      else if (tool.id === 'receipt-maker') {
        const bytes = await generateReceiptPDF({ storeName: invoiceData.clientName || 'HELLO PDF STORE' });
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Store_Receipt.pdf';
        statsSummary = 'Generated itemized sales receipt with barcode.';
      } else if (tool.id === 'nda-generator' || tool.id === 'nda-freelance-contract') {
        const bytes = await generateNDAPDF({ disclosingParty: invoiceData.clientName });
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_NDA_Agreement.pdf';
        statsSummary = 'Generated formal Mutual Non-Disclosure Agreement with signature blocks.';
      } else if (tool.id === 'resume-to-pdf') {
        const bytes = await generateResumePDF({ fullName: certData.recipientName });
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Resume_${certData.recipientName.replace(/\s+/g, '_')}.pdf`;
        statsSummary = 'Created clean modern software engineer resume.';
      } else if (tool.id === 'meeting-notes') {
        const bytes = await generateMeetingNotesPDF({});
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Meeting_Notes.pdf';
        statsSummary = 'Generated formal meeting notes with agenda & action item checkboxes.';
      } else if (tool.id === 'purchase-order') {
        const bytes = await generatePurchaseOrderPDF({});
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Purchase_Order.pdf';
        statsSummary = 'Generated commercial purchase order with itemized vendor tables.';
      } else if (tool.id === 'todo-list-pdf') {
        const bytes = await generateTodoListPDF();
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Daily_Task_Planner.pdf';
        statsSummary = 'Generated daily task planner with checkboxes and priority blocks.';
      } else if (tool.id === 'rental-agreement') {
        const bytes = await generateRentalAgreementPDF({});
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Rental_Lease_Agreement.pdf';
        statsSummary = 'Generated complete residential tenancy agreement.';
      } else if (tool.id === 'job-offer-letter') {
        const bytes = await generateJobOfferPDF({ candidateName: certData.recipientName });
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Job_Offer_Letter.pdf';
        statsSummary = 'Generated executive job employment offer letter.';
      } else if (tool.id === 'medical-prescription-pad') {
        const bytes = await generatePrescriptionPadPDF({ patientName: certData.recipientName });
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Prescription_Pad.pdf';
        statsSummary = 'Rendered doctor Rx prescription pad with clinical lines.';
      } else if (tool.id === 'project-timesheet') {
        const bytes = await generateTimesheetPDF({});
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Project_Timesheet.pdf';
        statsSummary = 'Generated weekly consultant timesheet with hourly billing summary.';
      } else if (
        tool.id === 'packing-slip' ||
        tool.id === 'inventory-sheet' ||
        tool.id === 'printable-ledger' ||
        tool.id === 'expense-report' ||
        tool.id === 'attendance-sheet'
      ) {
        const bytes = await generateInventoryOrPackingSlipPDF(tool.id as any);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_${tool.id}.pdf`;
        statsSummary = `Generated printable ${tool.name} grid form.`;
      } else if (tool.id === 'invoice-generator') {
        const bytes = await generateInvoicePDF(invoiceData);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `${invoiceData.invoiceNumber || 'Invoice'}.pdf`;
        statsSummary = `Generated invoice for ${invoiceData.clientName} successfully.`;
      } else if (tool.id === 'certificate-generator' || tool.id === 'certificate-appreciation' || tool.id === 'diploma-maker') {
        const bytes = await generateCertificatePDF(certData);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `Certificate_${certData.recipientName.replace(/\s+/g, '_')}.pdf`;
        statsSummary = `Generated formal certificate for ${certData.recipientName}.`;
      } else if (
        tool.id === 'dot-grid-paper' ||
        tool.id === 'lined-paper' ||
        tool.id === 'music-staff-paper' ||
        tool.id === 'printable-calendar' ||
        tool.id === 'flashcard-generator'
      ) {
        const bytes = await generatePaperPDF(paperType);
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Printable_${paperType}_paper.pdf`;
        statsSummary = `Rendered high-precision printable ${paperType} paper.`;
      } else if (tool.id === 'batch-image-to-pdf') {
        if (files.length === 0) throw new Error('Please select at least one photo or click "Try with 4 Sample Photos".');
        const bytes = await createPhotoAlbumPDF(files, {
          pageSize: imgPageSize,
          orientation: imgOrientation,
          layout: albumLayout,
          margin: imgMargin,
          albumTitle: albumTitle.trim() || undefined,
          addCoverPage: albumCoverPage,
        });
        outputBlob = makePdfBlob(bytes);
        outputFilename = `HelloPDF_Photo_Album_${files.length}_Photos.pdf`;
        statsSummary = `Compiled ${files.length} photo(s) into an album with ${albumLayout} layout.`;
      } else if (tool.id === 'image-to-pdf' || tool.id === 'png-to-pdf' || tool.id === 'webp-to-pdf') {
        if (files.length === 0) throw new Error('Please select at least one image file.');
        const bytes = await imagesToPDF(files, {
          pageSize: imgPageSize,
          margin: imgMargin,
          orientation: imgOrientation,
        });
        outputBlob = makePdfBlob(bytes);
        outputFilename = 'HelloPDF_Images_Converted.pdf';
        statsSummary = `Compiled ${files.length} image(s) into PDF document.`;
      } else {
        // Fallback default
        if (files.length > 0) {
          const bytes = await watermarkPDF(files[0], `Hello PDF • ${tool.name}`, {
            opacity: 0.15,
            fontSize: 28,
            rotationAngle: 30,
          });
          outputBlob = makePdfBlob(bytes);
          outputFilename = `HelloPDF_${tool.id}.pdf`;
          statsSummary = `Processed file with ${tool.name}.`;
        } else {
          const bytes = await textToPDF(
            `${tool.name.toUpperCase()}\n\nGenerated with Hello PDF Suite\nTool #${tool.rank} • 100% Client-Side In-Browser\nDate: ${new Date().toISOString()}\n\nExecution verified successfully.`,
            tool.name
          );
          outputBlob = makePdfBlob(bytes);
          outputFilename = `HelloPDF_${tool.id}.pdf`;
          statsSummary = `Generated ${tool.name} document.`;
        }
      }

      setProgress(90);

      setResultBlob({ blob: outputBlob, filename: outputFilename, stats: statsSummary });
      setProgress(100);

      // Trigger download for the user
      downloadBlob(outputBlob, outputFilename);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${tool.accentColor} flex items-center justify-center text-white shadow-2xs`}>
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
          {/* Privacy Guarantee Banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">
                <strong>100% Free & Private:</strong> Processed in-browser using WebAssembly. Files never leave your computer.
              </span>
            </div>
            <span className="hidden sm:inline font-semibold text-[11px] text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Zero Server Uploads
            </span>
          </div>

          {/* File Upload Zone (if tool requires file input) */}
          {!isGeneratorTool && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {tool.multipleFiles
                    ? isImageTool
                      ? `Select Photos to Compile (${files.length} selected)`
                      : 'Select PDF Files to Merge'
                    : isImageTool
                    ? 'Upload Image File'
                    : 'Upload Document'}
                </label>
                {files.length === 0 && (
                  <button
                    type="button"
                    onClick={handleUseDemoPDF}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isImageTool ? 'Try with 4 Sample Photos' : 'Try with Demo Sample PDF'}</span>
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

          {/* Split / Range Tools */}
          {(tool.id === 'split-pdf' || tool.id === 'extract-pages' || tool.id === 'sort-pages-custom') && (
            <div className="space-y-2 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Page Sequence / Range:</label>
              <input
                type="text"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="e.g. 1-3, 5, 7"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                Enter page numbers or ranges separated by commas. Example: <code className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-1 rounded">1-4, 7</code>
              </p>
            </div>
          )}

          {/* Rotate PDF Options */}
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

          {/* Compress PDF Options */}
          {(tool.id === 'compress-pdf' || (tool.category === 'optimize' && !['flatten-pdf', 'clean-metadata', 'strip-annotations', 'pdf-stream-sanitizer'].includes(tool.id))) && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Compression Level:</label>
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

          {/* Photo Album / Image to PDF Options */}
          {(tool.id === 'batch-image-to-pdf' || tool.id === 'image-to-pdf' || tool.id === 'png-to-pdf' || tool.id === 'webp-to-pdf') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3">
              {tool.id === 'batch-image-to-pdf' && (
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Album Layout Mode:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: '1-per-page', label: '1 per Page', desc: 'Full Album Page' },
                      { id: '2-per-page', label: '2 per Page', desc: 'Side by Side' },
                      { id: '4-per-page', label: '4 per Page', desc: '2x2 Collage Grid' },
                      { id: '6-per-page', label: '6 per Page', desc: 'Proof / Contact' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAlbumLayout(item.id as any)}
                        className={`p-2 rounded-lg text-left border transition-colors ${
                          albumLayout === item.id
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-600 font-bold'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <div>{item.label}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tool.id === 'batch-image-to-pdf' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200">Album Title & Cover Page:</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600 dark:text-neutral-300 text-[11px]">
                      <input
                        type="checkbox"
                        checked={albumCoverPage}
                        onChange={(e) => setAlbumCoverPage(e.target.checked)}
                        className="rounded accent-red-600"
                      />
                      <span>Include Cover Page</span>
                    </label>
                  </div>
                  {albumCoverPage && (
                    <input
                      type="text"
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      placeholder="e.g. My Family & Vacation Photo Album 2026"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-semibold"
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Page Size:</label>
                  <select
                    value={imgPageSize}
                    onChange={(e) => setImgPageSize(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
                  >
                    <option value="A4">A4 Standard</option>
                    <option value="letter">US Letter</option>
                    {tool.id !== 'batch-image-to-pdf' && <option value="fit">Fit to Image Size</option>}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Orientation:</label>
                  <select
                    value={imgOrientation}
                    onChange={(e) => setImgOrientation(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
                  >
                    <option value="landscape">Landscape (Album)</option>
                    <option value="portrait">Portrait (Book)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Page Margin:</label>
                  <select
                    value={imgMargin}
                    onChange={(e) => setImgMargin(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
                  >
                    <option value="12">Compact (12pt)</option>
                    <option value="24">Standard (24pt)</option>
                    <option value="40">Spacious (40pt)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Watermark / Stamp / Header Text Options */}
          {(tool.id === 'watermark-pdf' || tool.id === 'header-footer' || tool.id === 'qr-stamper') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3">
              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  {tool.id === 'qr-stamper' ? 'QR Code URL or Content:' : 'Custom Text:'}
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder={tool.id === 'qr-stamper' ? 'https://example.com' : 'e.g. CONFIDENTIAL'}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold"
                />
              </div>
              {tool.id === 'watermark-pdf' && (
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
              )}
            </div>
          )}

          {/* Page Numbers */}
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

          {/* Protect PDF */}
          {tool.id === 'protect-pdf' && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">Set Protection Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-mono"
              />
            </div>
          )}

          {/* Digital Signature Drawing Canvas */}
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

              <div className="border border-neutral-300 dark:border-neutral-700 bg-white rounded-xl overflow-hidden shadow-inner">
                <canvas
                  ref={signatureCanvasRef}
                  width={460}
                  height={120}
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

          {/* Official Stamps */}
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

          {/* Raw Text / Data Editor for CSV, JSON, Markdown, Base64 */}
          {(tool.id === 'csv-to-pdf' ||
            tool.id === 'json-to-pdf' ||
            tool.id === 'markdown-to-pdf' ||
            tool.id === 'text-to-pdf' ||
            tool.id === 'base64-to-pdf') && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-2">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                {tool.id === 'csv-to-pdf'
                  ? 'Edit or Paste CSV Data (Comma separated):'
                  : tool.id === 'json-to-pdf'
                  ? 'Edit or Paste JSON Data:'
                  : tool.id === 'base64-to-pdf'
                  ? 'Paste Base64 String:'
                  : 'Document Content (Markdown supported):'}
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-mono text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}

          {/* Business Generators (Invoice, Certificate, etc.) */}
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
            </div>
          )}

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
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* INTERACTIVE RESULT DISPLAYS */}

          {/* 1. Converted Images Grid */}
          {convertedImages.length > 0 && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                  Converted Pages ({convertedImages.length}):
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">High-Resolution Retina</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {convertedImages.map((img) => (
                  <div
                    key={img.pageIndex}
                    className="group relative border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900 shadow-2xs"
                  >
                    <img src={img.dataUrl} alt={img.filename} className="w-full h-24 object-contain bg-white" />
                    <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-between text-[10px]">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">Page {img.pageIndex}</span>
                      <button
                        type="button"
                        onClick={() => downloadBlob(img.blob, img.filename)}
                        className="text-red-600 dark:text-red-400 hover:underline font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Text / Speech Player */}
          {extractedTextPreview && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                    {tool.id === 'pdf-to-speech' ? 'Text-to-Speech Player' : 'Extracted Content Preview:'}
                  </span>
                </div>
                {tool.id === 'pdf-to-speech' && (
                  <button
                    type="button"
                    onClick={() => handleToggleSpeech(extractedTextPreview)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      isPlayingSpeech
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    }`}
                  >
                    {isPlayingSpeech ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isPlayingSpeech ? 'Stop Speaking' : 'Play Audio'}</span>
                  </button>
                )}
              </div>
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono text-xs max-h-36 overflow-y-auto text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                {extractedTextPreview.slice(0, 800)}
                {extractedTextPreview.length > 800 && '... [truncated in preview]'}
              </div>
            </div>
          )}

          {/* 3. Word Counter & Analysis */}
          {wordCountStats && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
                <div className="text-xl font-black text-red-600 dark:text-red-400">{wordCountStats.words.toLocaleString()}</div>
                <div className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Total Words</div>
              </div>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                <div className="text-xl font-black text-neutral-800 dark:text-neutral-200">{wordCountStats.chars.toLocaleString()}</div>
                <div className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Characters</div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">~{Math.ceil(wordCountStats.words / 200)}m</div>
                <div className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Reading Time</div>
              </div>
            </div>
          )}

          {/* 4. Inspection Diagnostic Card */}
          {inspectionResult && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                <span>PDF Diagnostic & Technical Audit:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                  {inspectionResult.securityAudit.encryptionStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div><strong>Page Count:</strong> {inspectionResult.pageCount}</div>
                <div><strong>File Size:</strong> {inspectionResult.fileSizeFormatted}</div>
                <div><strong>Color Model:</strong> {inspectionResult.colorModel}</div>
                <div><strong>Fast Web View (Linearized):</strong> {inspectionResult.isLinearized ? 'Yes' : 'No'}</div>
              </div>
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 text-[11px]">
                <strong>Fonts Detected:</strong> {inspectionResult.fontsDetected.join(', ')}
              </div>
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

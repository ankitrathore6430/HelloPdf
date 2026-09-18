import React, { useState, useEffect, useRef } from 'react';
import { ToolItem } from '../types';
import {
  csvToPDF,
  jsonToPDF,
  markdownToPDF,
  base64ToPDF,
  pdfToBase64,
  extractPDFText,
} from '../services/pdfConvert';
import { textToPDF } from '../services/pdfEngine';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import {
  Download,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  UploadCloud,
  FileText,
  Trash2,
  Search,
  BookOpen,
  Sliders,
  Settings2,
  Eye,
  FileCode,
} from 'lucide-react';

interface ConverterToolProps {
  tool: ToolItem;
}

export const ConverterTool: React.FC<ConverterToolProps> = ({ tool }) => {
  const id = tool.id;

  const isCsv = id === 'csv-to-pdf';
  const isJson = id === 'json-to-pdf';
  const isMarkdown = id === 'markdown-to-pdf';
  const isHtml = id === 'html-to-pdf';
  const isPdfToText = id === 'pdf-to-text';
  const isPdfToSpeech = id === 'pdf-to-speech';
  const isPdfToEmbed = id === 'pdf-to-html-embed';
  const isPdfToBase64 = id === 'pdf-to-base64';
  const isBase64ToPdf = id === 'base64-to-pdf';

  // For file-upload converters (PDF to text, speech, base64, embed)
  const isUploadMode = isPdfToText || isPdfToSpeech || isPdfToEmbed || isPdfToBase64;

  const getInitialContent = () => {
    if (isCsv) {
      return `Product ID,Product Name,Category,Price,In Stock\nSKU-001,MacBook Pro M3 Max,Computers,$3199,14\nSKU-002,Sony WH-1000XM5,Audio,$399,82\nSKU-003,Dell UltraSharp 32" 4K,Displays,$949,27\nSKU-004,Logitech MX Master 3S,Accessories,$99,150`;
    }
    if (isJson) {
      return JSON.stringify(
        {
          organization: 'Hello PDF Enterprise',
          auditId: 'AUD-88219',
          date: new Date().toISOString().split('T')[0],
          compliancePassed: true,
          metrics: {
            uptime: '99.99%',
            securityRating: 'A+',
            totalDocumentsProcessed: 148200,
          },
          regions: ['North America', 'Europe Central', 'Asia Pacific'],
        },
        null,
        2
      );
    }
    if (isMarkdown) {
      return `# Executive Project Brief\n\n## Overview\nHello PDF Suite is an open-source, zero-server document processing engine built for absolute user privacy.\n\n### Key Milestones\n* **Client-Side Engine:** All 108 native tools run directly in the browser.\n* **Zero Cloud Latency:** Files are processed without uploading to third-party servers.\n* **Accessibility & Audio:** Built-in PDF speech synthesis and real plain-text extraction.\n\n> "Privacy is not a feature; it is the foundation of user trust."\n\n\`\`\`javascript\n// In-browser client-side execution\nconst result = await extractPDFText(file);\nconsole.log(\`Extracted \${result.wordCount} words.\`);\n\`\`\`\n\n### Next Steps\n- Export to high-resolution vector PDF\n- Verify document layout and typography`;
    }
    if (isHtml) {
      return `<div style="font-family: sans-serif; padding: 20px;">\n  <h1>Executive Summary</h1>\n  <p>This HTML template is parsed and converted directly into a downloadable PDF document.</p>\n  <ul>\n    <li>Client-side rendering</li>\n    <li>Zero network roundtrips</li>\n  </ul>\n</div>`;
    }
    if (isBase64ToPdf) {
      return 'JVBERi0xLjcKCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKCjIgMCBvYmoKPDwvVHlwZSAvUGFnZXMgL0tpZHMgWzMgMCBSXSAvQ291bnQgMT4+CmVuZG9iagoKMyAwIG9iago8PC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL01lZGlhQm94IFswIDAgNTk1IDg0Ml0+PgplbmRvYmoKCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxMTcgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxODMKJSVFT0Y=';
    }
    return `HELLO PDF DOCUMENT\n\nGenerated with high-precision typography and page geometry directly in your browser.`;
  };

  const [textContent, setTextContent] = useState(getInitialContent());
  const [docTitle, setDocTitle] = useState('Document');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [outputString, setOutputString] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted PDF Stats & Page Breakdown
  const [extractedPages, setExtractedPages] = useState<string[]>([]);
  const [activePageTab, setActivePageTab] = useState<'all' | number>('all');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [textSearchQuery, setTextSearchQuery] = useState('');

  // Speech Synthesizer State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const sentencesRef = useRef<string[]>([]);

  // Markdown Preview Tab
  const [markdownView, setMarkdownView] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    setTextContent(getInitialContent());
    setResultBlob(null);
    setOutputString(null);
    setErrorMessage(null);
    setFile(null);
    setExtractedPages([]);
    setWordCount(0);
    setCharCount(0);
    stopSpeech();

    // Populate voices for speech synthesizer
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        if (available.length > 0) {
          // Default to an English voice if available
          const enIdx = available.findIndex((v) => v.lang.startsWith('en'));
          setSelectedVoiceIndex(enIdx >= 0 ? enIdx : 0);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      stopSpeech();
    };
  }, [id]);

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
  };

  const handleUseDemo = async () => {
    try {
      setIsProcessing(true);
      const demoText = `# Hello PDF Suite — Executive Brief & Audio Specimen\n\n## Section 1: In-Browser Document Processing\nHello PDF Suite executes PDF transformations entirely client-side using WebAssembly and pure JavaScript. No sensitive documents are uploaded to cloud servers.\n\n## Section 2: Audio Synthesis & Accessibility\nThis text can be read aloud using the native Web Speech API. You can adjust playback speed, change speech voices, and follow along with sentence-level highlights.\n\n## Section 3: Data Integrity & Conversion\nPlain text, Markdown formatting, CSV tables, and Base64 strings can be converted back and forth seamlessly with zero network dependencies.`;
      const docBytes = await markdownToPDF(demoText, 'HelloPDF_Demo_Document');
      const demoFile = new File([docBytes as any], 'HelloPDF_Demo_Specimen.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setErrorMessage(null);

      // Immediately run extraction on the sample PDF
      await processUploadFile(demoFile);
    } catch (err: any) {
      setErrorMessage('Could not load sample document: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processUploadFile = async (f: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (isPdfToBase64) {
        const b64 = await pdfToBase64(f);
        setOutputString(b64);
      } else if (isPdfToEmbed) {
        const b64 = await pdfToBase64(f);
        const snippet = `<!-- Responsive Hello PDF Embed Code -->\n<div style="position: relative; width: 100%; height: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">\n  <object data="${b64}" type="application/pdf" width="100%" height="100%">\n    <iframe src="${b64}" width="100%" height="100%" style="border: none;">\n      <p>This browser does not support inline PDFs. Please download the PDF to view it.</p>\n    </iframe>\n  </object>\n</div>`;
        setOutputString(snippet);
      } else if (isPdfToText || isPdfToSpeech) {
        // Real extraction using pdfjs
        const extracted = await extractPDFText(f);
        setExtractedPages(extracted.pagesText);
        setWordCount(extracted.wordCount);
        setCharCount(extracted.charCount);
        setOutputString(extracted.fullText);

        // Break into sentences for audio speech player
        const cleanSentences = extracted.fullText
          .split(/(?<=[.?!])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('---'));
        sentencesRef.current = cleanSentences;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvert = async () => {
    if (isUploadMode) {
      if (!file) {
        setErrorMessage('Please select or upload a PDF document first.');
        return;
      }
      await processUploadFile(file);
    } else {
      // Text / Data to PDF
      setIsProcessing(true);
      setErrorMessage(null);
      try {
        let bytes: Uint8Array;
        if (isCsv) {
          bytes = await csvToPDF(textContent.trim(), docTitle);
        } else if (isJson) {
          bytes = await jsonToPDF(textContent.trim(), docTitle);
        } else if (isMarkdown) {
          bytes = await markdownToPDF(textContent.trim(), docTitle);
        } else if (isBase64ToPdf) {
          bytes = await base64ToPDF(textContent.trim());
        } else {
          bytes = await textToPDF(textContent.trim(), docTitle);
        }

        const blob = makePdfBlob(bytes);
        setResultBlob(blob);
      } catch (err: any) {
        setErrorMessage(err.message || 'Conversion failed.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCopy = () => {
    if (!outputString) return;
    navigator.clipboard.writeText(outputString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    if (!outputString) return;
    const blob = new Blob([outputString], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${file ? file.name.replace(/\.[^/.]+$/, '') : 'Extracted'}.txt`);
  };

  const handleDownloadJsonBreakdown = () => {
    if (!outputString) return;
    const data = {
      filename: file?.name || 'document.pdf',
      extractedAt: new Date().toISOString(),
      pageCount: extractedPages.length,
      wordCount,
      charCount,
      pages: extractedPages.map((text, idx) => ({
        pageNumber: idx + 1,
        text,
        wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${file ? file.name.replace(/\.[^/.]+$/, '') : 'Extracted'}_pages.json`);
  };

  // --- Web Speech API Player ---
  const handlePlaySpeech = (startIdx = currentSentenceIndex) => {
    if (!('speechSynthesis' in window)) {
      setErrorMessage('Web Speech API is not supported in this browser.');
      return;
    }

    if (sentencesRef.current.length === 0) {
      if (outputString) {
        sentencesRef.current = outputString
          .split(/(?<=[.?!])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('---'));
      }
    }

    if (sentencesRef.current.length === 0) {
      setErrorMessage('No readable text found to play.');
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setIsPaused(false);

    let idx = startIdx >= sentencesRef.current.length ? 0 : startIdx;
    setCurrentSentenceIndex(idx);

    const speakNext = (i: number) => {
      if (i >= sentencesRef.current.length) {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentSentenceIndex(0);
        return;
      }

      setCurrentSentenceIndex(i);
      const textToSpeak = sentencesRef.current[i];
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      if (voices.length > 0 && voices[selectedVoiceIndex]) {
        utterance.voice = voices[selectedVoiceIndex];
      }
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      utterance.onend = () => {
        speakNext(i + 1);
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext(idx);
  };

  const handlePauseResumeSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    } else if (isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleRestartSpeech = () => {
    stopSpeech();
    handlePlaySpeech(0);
  };

  // Filtered extracted text based on user query
  const getDisplayText = () => {
    if (!outputString) return '';
    if (activePageTab !== 'all') {
      const pageText = extractedPages[activePageTab] || '';
      return pageText;
    }
    return outputString;
  };

  return (
    <div className="space-y-6">
      {/* Upload Mode (PDF to Text, Speech, Base64, Embed) */}
      {isUploadMode ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Select PDF Document to Process
            </label>
            {!file && (
              <button
                type="button"
                onClick={handleUseDemo}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try with Sample PDF</span>
              </button>
            )}
          </div>

          {!file ? (
            <div className="relative border-2 border-dashed rounded-2xl p-8 text-center border-neutral-300 dark:border-neutral-700 hover:border-red-400 dark:hover:border-red-500 bg-neutral-50/40 dark:bg-neutral-900/40 cursor-pointer transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const selected = e.target.files[0];
                    setFile(selected);
                    processUploadFile(selected);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3 shadow-2xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Drop your PDF file here or click to browse
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {isPdfToSpeech
                    ? 'Instant text extraction & native client-side speech synthesis'
                    : isPdfToText
                    ? 'Extract complete text page-by-page with word & character statistics'
                    : 'Convert to Base64 or interactive web embed code'}
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
                  <p className="text-[11px] text-neutral-500">
                    {formatFileSize(file.size)}
                    {extractedPages.length > 0 && ` • ${extractedPages.length} Pages • ${wordCount.toLocaleString()} Words`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setOutputString(null);
                  setExtractedPages([]);
                  stopSpeech();
                }}
                className="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                title="Remove File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Text/Data Input Mode (CSV, JSON, Markdown, Base64) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              {isCsv
                ? 'CSV Data Table'
                : isJson
                ? 'JSON Data'
                : isMarkdown
                ? 'Markdown Document'
                : isBase64ToPdf
                ? 'Base64 Encoded PDF String'
                : 'Text Content'}
            </label>
            <div className="flex items-center gap-2">
              {isMarkdown && (
                <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMarkdownView('edit')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      markdownView === 'edit'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkdownView('preview')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      markdownView === 'preview'
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Formatted Preview
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setTextContent(getInitialContent())}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
              >
                Reset Sample
              </button>
            </div>
          </div>

          {isMarkdown && markdownView === 'preview' ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs space-y-3 max-h-80 overflow-y-auto leading-relaxed">
              {textContent.split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-lg font-black text-neutral-900 dark:text-white border-b pb-1">
                      {line.replace('# ', '')}
                    </h1>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-sm font-bold text-red-600 dark:text-red-400 mt-2">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                if (line.startsWith('> ')) {
                  return (
                    <blockquote key={idx} className="border-l-4 border-red-500 pl-3 italic text-neutral-500">
                      {line.replace('> ', '')}
                    </blockquote>
                  );
                }
                if (line.startsWith('* ') || line.startsWith('- ')) {
                  return (
                    <li key={idx} className="ml-4 list-disc">
                      {line.slice(2)}
                    </li>
                  );
                }
                if (line.startsWith('```')) {
                  return null;
                }
                if (line.trim().length === 0) {
                  return <div key={idx} className="h-1" />;
                }
                return <p key={idx}>{line}</p>;
              })}
            </div>
          ) : (
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={9}
              className="w-full p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 shadow-2xs"
            />
          )}

          {/* Document Title input for text-to-pdf / markdown-to-pdf */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
              PDF Header Title:
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Document Title"
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 text-xs font-medium"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleConvert}
          disabled={isProcessing || (isUploadMode && !file)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Execute {tool.name}</span>
            </>
          )}
        </button>

        {resultBlob && (
          <button
            type="button"
            onClick={() => downloadBlob(resultBlob, `${docTitle}.pdf`)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF ({formatFileSize(resultBlob.size)})</span>
          </button>
        )}
      </div>

      {/* Advanced Audio Player Bar (for PDF to Speech) */}
      {isPdfToSpeech && (outputString || sentencesRef.current.length > 0) && (
        <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                {isSpeaking && !isPaused ? (
                  <Volume2 className="w-5 h-5 animate-pulse" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {isSpeaking
                    ? isPaused
                      ? 'Audio Reading Paused'
                      : 'Playing Audio Reading...'
                    : 'Ready to Read Aloud'}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {sentencesRef.current.length} sentences detected • Pure Client-Side Web Speech Engine
                </p>
              </div>
            </div>

            {/* Main Audio Controls */}
            <div className="flex items-center gap-2">
              {!isSpeaking ? (
                <button
                  type="button"
                  onClick={() => handlePlaySpeech(0)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Reading</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePauseResumeSpeech}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopSpeech}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestartSpeech}
                    className="p-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs transition-all cursor-pointer"
                    title="Restart from Beginning"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Voice, Speed & Pitch Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/70 dark:border-amber-900/40 text-xs">
            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Reading Voice:
              </label>
              <select
                value={selectedVoiceIndex}
                onChange={(e) => {
                  setSelectedVoiceIndex(Number(e.target.value));
                  if (isSpeaking) {
                    stopSpeech();
                    setTimeout(() => handlePlaySpeech(currentSentenceIndex), 100);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-850 border border-amber-300 dark:border-amber-800 text-neutral-800 dark:text-neutral-200 text-xs"
              >
                {voices.length === 0 ? (
                  <option value="0">Default System Voice</option>
                ) : (
                  voices.map((v, idx) => (
                    <option key={idx} value={idx}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Speed: {speechRate}x
              </label>
              <div className="flex items-center gap-1.5">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setSpeechRate(rate);
                      if (isSpeaking) {
                        stopSpeech();
                        setTimeout(() => handlePlaySpeech(currentSentenceIndex), 100);
                      }
                    }}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                      speechRate === rate
                        ? 'bg-amber-600 text-white'
                        : 'bg-white dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                Pitch: {speechPitch === 1 ? 'Normal' : speechPitch < 1 ? 'Deep' : 'High'}
              </label>
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.1"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
          </div>

          {/* Real-time reading progress & highlight */}
          {sentencesRef.current.length > 0 && (
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200/80 dark:border-amber-900/40 text-xs">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                Currently Reading (Sentence {currentSentenceIndex + 1} of {sentencesRef.current.length}):
              </span>
              <p className="text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed bg-amber-100/50 dark:bg-amber-950/40 p-2 rounded-lg">
                {sentencesRef.current[currentSentenceIndex] || 'Click Start Reading to listen.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Text Extraction View (PDF to Text) */}
      {isPdfToText && outputString && (
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Total Words</span>
              <p className="text-lg font-black text-neutral-900 dark:text-white">{wordCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Characters</span>
              <p className="text-lg font-black text-neutral-900 dark:text-white">{charCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Pages Parsed</span>
              <p className="text-lg font-black text-red-600 dark:text-red-400">{extractedPages.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Est. Read Time</span>
              <p className="text-lg font-black text-neutral-900 dark:text-white">
                {Math.max(1, Math.round(wordCount / 200))} min
              </p>
            </div>
          </div>

          {/* Page breakdown tabs */}
          {extractedPages.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setActivePageTab('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  activePageTab === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                All Pages ({extractedPages.length})
              </button>
              {extractedPages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePageTab(idx)}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                    activePageTab === idx
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Page {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              {activePageTab === 'all' ? 'Full Extracted Text' : `Page ${activePageTab + 1} Text`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save .txt</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJsonBreakdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON Export</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-neutral-900 text-neutral-200 text-xs font-mono max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed selection:bg-red-600 selection:text-white">
            {getDisplayText()}
          </pre>
        </div>
      )}

      {/* String Output for Base64 or Embed Snippet */}
      {(isPdfToBase64 || isPdfToEmbed) && outputString && (
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              {isPdfToEmbed ? 'HTML Embed Snippet' : 'Base64 Output'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-neutral-900 text-neutral-200 text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap break-all">
            {outputString}
          </pre>
        </div>
      )}
    </div>
  );
};

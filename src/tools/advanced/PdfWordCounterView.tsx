import React, { useState, useEffect } from 'react';
import { textToPDF } from '../../services/pdfEngine';
import { extractPDFText } from '../../services/pdfConvert';
import { formatFileSize, downloadBlob } from '../shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Hash,
  Clock,
  Mic,
  AlignLeft,
  Download,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface PdfWordCounterViewProps {
  initialFile?: File | null;
}

export const PdfWordCounterView: React.FC<PdfWordCounterViewProps> = ({ initialFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCountWithSpaces, setCharCountWithSpaces] = useState(0);
  const [charCountNoSpaces, setCharCountNoSpaces] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [pages, setPages] = useState<{ page: number; wordCount: number; charCount: number; text: string }[]>([]);
  const [topWords, setTopWords] = useState<{ word: string; count: number }[]>([]);
  const [copied, setCopied] = useState(false);

  // Load sample document
  const handleLoadDemo = async () => {
    try {
      setIsProcessing(true);
      const sampleText = `THE FUTURE OF CLIENT-SIDE DOCUMENT ARCHITECTURES
An Analytical Research Specimen by Hello PDF Research Institute

Section 1: The Transition to Browser-Native Processing
For over three decades, portable document format manipulation relied heavily on server-side compute clusters. Organizations routinely forwarded confidential contracts, patient health records, and banking statements to third-party endpoints simply to perform basic operations like page merging, visual watermarking, and metadata redaction.

Section 2: Privacy and Security Imperatives
Modern regulatory frameworks, notably HIPAA in healthcare and GDPR across the European Union, impose stringent data residency requirements. Transmitting raw binary payloads over wide-area networks introduces substantial surface area for security vulnerabilities. By utilizing WebAssembly (Wasm) and hardware-accelerated HTML5 canvases, all computations execute securely within the memory sandbox of the user's local browser runtime.

Section 3: Computational Performance and Benchmarks
Testing demonstrates that client-side PDF operations eliminate network latency entirely. A typical 20-page document requires zero upload bandwidth and renders with sub-millisecond execution cycles. Distributed edge processing also drastically reduces operational cloud computing expenses for modern software enterprises.`;

      const bytes = await textToPDF(sampleText, 'Client_Side_Architecture_Specimen');
      const demoFile = new File([bytes as any], 'Client_Side_Architecture_Specimen.pdf', { type: 'application/pdf' });
      setFile(demoFile);
    } catch (err) {
      console.error('Failed to create sample', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract text and compute real stats
  useEffect(() => {
    if (!file) {
      setWordCount(0);
      setCharCountWithSpaces(0);
      setCharCountNoSpaces(0);
      setSentenceCount(0);
      setParagraphCount(0);
      setPages([]);
      setTopWords([]);
      return;
    }

    let isCancelled = false;

    const analyzeStats = async () => {
      try {
        setIsProcessing(true);
        const extracted = await extractPDFText(file);
        if (isCancelled) return;

        const fullText = extracted.fullText;
        const words = fullText.trim().split(/\s+/).filter((w) => w.length > 0);
        const totalWords = words.length;
        const charsWithSpaces = fullText.length;
        const charsNoSpaces = fullText.replace(/\s+/g, '').length;

        // Sentences
        const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
        // Paragraphs
        const paragraphs = fullText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

        // Top Words frequency (excluding common stop words)
        const stopWords = new Set([
          'the', 'and', 'to', 'of', 'a', 'in', 'that', 'is', 'for', 'on', 'with', 'as', 'by', 'at', 'an', 'be', 'this', 'which', 'or', 'from', 'it', 'are', 'all'
        ]);
        const freqMap: Record<string, number> = {};
        words.forEach((w) => {
          const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (clean.length > 2 && !stopWords.has(clean)) {
            freqMap[clean] = (freqMap[clean] || 0) + 1;
          }
        });

        const sortedTopWords = Object.entries(freqMap)
          .map(([word, count]) => ({ word, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);

        // Per page breakdown
        const pageList = extracted.pagesText.map((pText: string, idx: number) => {
          const pWords = pText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
          return {
            page: idx + 1,
            wordCount: pWords,
            charCount: pText.length,
            text: pText,
          };
        });

        setWordCount(totalWords);
        setCharCountWithSpaces(charsWithSpaces);
        setCharCountNoSpaces(charsNoSpaces);
        setSentenceCount(sentences.length);
        setParagraphCount(Math.max(1, paragraphs.length));
        setPages(pageList);
        setTopWords(sortedTopWords);
      } catch (err) {
        console.warn('Word count analysis error:', err);
      } finally {
        if (!isCancelled) {
          setIsProcessing(false);
        }
      }
    };

    analyzeStats();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const handleCopyReport = () => {
    const report = `HELLO PDF - DOCUMENT WORD COUNT & TEXT METRICS REPORT
Document: ${file?.name || 'document.pdf'}
Generated: ${new Date().toLocaleString()}

SUMMARY STATISTICS:
- Total Words: ${wordCount.toLocaleString()}
- Characters (with spaces): ${charCountWithSpaces.toLocaleString()}
- Characters (no spaces): ${charCountNoSpaces.toLocaleString()}
- Pages: ${pages.length}
- Sentences: ${sentenceCount}
- Paragraphs: ${paragraphCount}
- Estimated Reading Time (200 WPM): ${Math.max(1, Math.round(wordCount / 200))} min
- Estimated Speaking Time (130 WPM): ${Math.max(1, Math.round(wordCount / 130))} min

TOP FREQUENT KEYWORDS:
${topWords.map((t) => `- ${t.word}: ${t.count} occurrences`).join('\n')}

PER-PAGE BREAKDOWN:
${pages.map((p) => `Page ${p.page}: ${p.wordCount.toLocaleString()} words (${p.charCount.toLocaleString()} chars)`).join('\n')}`;

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadReport = () => {
    const report = `HELLO PDF - DOCUMENT WORD COUNT & TEXT METRICS REPORT
Document: ${file?.name || 'document.pdf'}
Generated: ${new Date().toLocaleString()}

SUMMARY STATISTICS:
- Total Words: ${wordCount.toLocaleString()}
- Characters (with spaces): ${charCountWithSpaces.toLocaleString()}
- Characters (no spaces): ${charCountNoSpaces.toLocaleString()}
- Pages: ${pages.length}
- Sentences: ${sentenceCount}
- Paragraphs: ${paragraphCount}
- Estimated Reading Time (200 WPM): ${Math.max(1, Math.round(wordCount / 200))} min
- Estimated Speaking Time (130 WPM): ${Math.max(1, Math.round(wordCount / 130))} min

TOP FREQUENT KEYWORDS:
${topWords.map((t) => `- ${t.word}: ${t.count} occurrences`).join('\n')}

PER-PAGE BREAKDOWN:
${pages.map((p) => `Page ${p.page}: ${p.wordCount.toLocaleString()} words (${p.charCount.toLocaleString()} chars)`).join('\n')}`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${file?.name || 'document'}_word_count_report.txt`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
        <div className="flex items-center gap-2.5">
          <Hash className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              PDF Word, Character & Readability Metric Counter
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Accurate client-side text parsing with word counts, character frequencies, reading duration, and page distribution.
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
          <span>Try with Sample PDF</span>
        </button>
      </div>

      {/* Upload zone */}
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
              Upload PDF to Count Words & Characters
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Select any PDF to extract real text metrics and reading estimates
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{file.name}</p>
                <p className="text-[11px] text-neutral-500">
                  {formatFileSize(file.size)} • {pages.length} Pages Parsed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-2 text-neutral-400 hover:text-red-500 cursor-pointer"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Total Words</span>
              <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{wordCount.toLocaleString()}</p>
              <span className="text-[10px] text-neutral-500">Exact parsed words</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Total Characters</span>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">
                {charCountWithSpaces.toLocaleString()}
              </p>
              <span className="text-[10px] text-neutral-500">{charCountNoSpaces.toLocaleString()} without spaces</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Reading Time</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-teal-600" />
                <p className="text-xl font-black text-neutral-900 dark:text-white">
                  {Math.max(1, Math.round(wordCount / 200))} min
                </p>
              </div>
              <span className="text-[10px] text-neutral-500">At standard 200 WPM</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Speaking Time</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Mic className="w-4 h-4 text-amber-500" />
                <p className="text-xl font-black text-neutral-900 dark:text-white">
                  {Math.max(1, Math.round(wordCount / 130))} min
                </p>
              </div>
              <span className="text-[10px] text-neutral-500">At presentation 130 WPM</span>
            </div>
          </div>

          {/* Secondary Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Total Pages:</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">{pages.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Sentences:</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">{sentenceCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Paragraphs:</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">{paragraphCount}</span>
            </div>
          </div>

          {/* Top Frequent Keywords */}
          {topWords.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                Top Frequent Keywords in Document
              </span>
              <div className="flex flex-wrap gap-2">
                {topWords.map((item, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-200"
                  >
                    <span className="font-bold">{item.word}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-teal-200/70 dark:bg-teal-900 text-[10px] font-mono font-bold">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per Page Breakdown & Export Actions */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Per-Page Word Distribution
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report (.txt)</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {pages.map((p) => (
                <div key={p.page} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">Page {p.page}</span>
                  <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400 font-mono">
                    <span>{p.wordCount.toLocaleString()} words</span>
                    <span>{p.charCount.toLocaleString()} chars</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

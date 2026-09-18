import React, { useState, useEffect } from 'react';
import { textToPDF } from '../../services/pdfEngine';
import { extractPDFText } from '../../services/pdfConvert';
import { formatFileSize, downloadBlob } from '../shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Link,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Download,
  Search,
  RefreshCw,
} from 'lucide-react';

interface PdfLinkCheckerViewProps {
  initialFile?: File | null;
}

interface DetectedLink {
  url: string;
  domain: string;
  type: 'https' | 'http' | 'mailto' | 'other';
  pageFound?: number;
}

export const PdfLinkCheckerView: React.FC<PdfLinkCheckerViewProps> = ({ initialFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [links, setLinks] = useState<DetectedLink[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Load sample document with diverse hyperlinks
  const handleLoadDemo = async () => {
    try {
      setIsScanning(true);
      const sampleText = `WEB DIRECTORY & ACCESSIBILITY AUDIT SPECIMEN
Document: Hello PDF Link Verification Reference

1. OFFICIAL WEB SPECIFICATIONS
- World Wide Web Consortium: https://www.w3.org/standards/
- MDN Web Docs Documentation: https://developer.mozilla.org/en-US/
- Internet Engineering Task Force: https://www.ietf.org/

2. DEVELOPER ECOSYSTEM & REPOSITORIES
- GitHub Open Source: https://github.com/topics/pdf-generator
- Node Package Manager: https://www.npmjs.com/package/pdf-lib
- Unicode Standards Consortium: https://home.unicode.org/

3. INSECURE & LEGACY REFERENCES (FOR TESTING)
- Legacy Archive Index: http://example.com/legacy-archive
- Test HTTP Benchmark: http://info.cern.ch/hypertext/WWW/TheProject.html

4. CONTACT CHANNELS
- Inquiries: mailto:team@hellopdf.io
- Security Reports: mailto:security@hellopdf.io`;

      const bytes = await textToPDF(sampleText, 'Link_Verification_Specimen');
      const demoFile = new File([bytes as any], 'Link_Verification_Specimen.pdf', { type: 'application/pdf' });
      setFile(demoFile);
    } catch (err) {
      console.error('Failed to create sample', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Extract links from document
  useEffect(() => {
    if (!file) {
      setLinks([]);
      return;
    }

    let isCancelled = false;

    const scanLinks = async () => {
      try {
        setIsScanning(true);
        const extracted = await extractPDFText(file);
        if (isCancelled) return;

        const found: DetectedLink[] = [];
        const seenUrls = new Set<string>();

        // Regex for URLs and mailto
        const urlRegex = /(https?:\/\/[^\s<>"'()]+|mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

        extracted.pagesText.forEach((pageText: string, pageIndex: number) => {
          const matches = pageText.match(urlRegex) || [];
          matches.forEach((rawUrl: string) => {
            const clean = rawUrl.replace(/[.,;!?)]+$/, '');
            if (!seenUrls.has(clean)) {
              seenUrls.add(clean);

              let type: DetectedLink['type'] = 'other';
              let domain = '';

              if (clean.startsWith('https://')) {
                type = 'https';
                try {
                  domain = new URL(clean).hostname;
                } catch {
                  domain = clean.split('/')[2] || clean;
                }
              } else if (clean.startsWith('http://')) {
                type = 'http';
                try {
                  domain = new URL(clean).hostname;
                } catch {
                  domain = clean.split('/')[2] || clean;
                }
              } else if (clean.startsWith('mailto:')) {
                type = 'mailto';
                domain = clean.replace('mailto:', '');
              }

              found.push({
                url: clean,
                domain,
                type,
                pageFound: pageIndex + 1,
              });
            }
          });
        });

        setLinks(found);
      } catch (err) {
        console.warn('Link scanning error:', err);
      } finally {
        if (!isCancelled) {
          setIsScanning(false);
        }
      }
    };

    scanLinks();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const handleExportCsv = () => {
    const header = 'URL,Type,Domain,Page\n';
    const rows = links.map((l) => `"${l.url}","${l.type}","${l.domain}","${l.pageFound || 1}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${file?.name || 'document'}_hyperlinks.csv`);
  };

  const filteredLinks = links.filter(
    (l) =>
      l.url.toLowerCase().includes(searchFilter.toLowerCase()) ||
      l.domain.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const httpsCount = links.filter((l) => l.type === 'https').length;
  const httpCount = links.filter((l) => l.type === 'http').length;
  const mailtoCount = links.filter((l) => l.type === 'mailto').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/50">
        <div className="flex items-center gap-2.5">
          <Link className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              PDF Hyperlink & URI Annotation Inspector
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Scan, verify, test, and audit all external URLs, HTTPS security protocols, and email links embedded in your document.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadDemo}
          disabled={isScanning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try with Sample Links PDF</span>
        </button>
      </div>

      {/* Upload zone */}
      {!file ? (
        <div className="relative border-2 border-dashed rounded-3xl p-10 text-center border-neutral-300 dark:border-neutral-700 hover:border-cyan-500 dark:hover:border-cyan-500 bg-neutral-50/40 dark:bg-neutral-900/40 cursor-pointer transition-colors">
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
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Upload PDF to Audit Hyperlinks
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Select any PDF to scan for embedded web links, domains, and email addresses
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyan-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{file.name}</p>
                <p className="text-[11px] text-neutral-500">
                  {formatFileSize(file.size)} • {links.length} Links Detected
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setLinks([]);
              }}
              className="p-2 text-neutral-400 hover:text-red-500 cursor-pointer"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Total Links</span>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">{links.length}</p>
              <span className="text-[10px] text-neutral-500">Embedded URIs</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Secure HTTPS</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{httpsCount}</span>
              </div>
              <span className="text-[10px] text-neutral-500">Encrypted connections</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Insecure HTTP</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {httpCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Check className="w-5 h-5 text-emerald-500" />
                )}
                <span className={`text-xl font-black ${httpCount > 0 ? 'text-amber-600' : 'text-neutral-900 dark:text-white'}`}>
                  {httpCount}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500">{httpCount > 0 ? 'Review plain HTTP' : 'Zero insecure links'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Mailto Links</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Mail className="w-5 h-5 text-cyan-500" />
                <span className="text-xl font-black text-neutral-900 dark:text-white">{mailtoCount}</span>
              </div>
              <span className="text-[10px] text-neutral-500">Contact addresses</span>
            </div>
          </div>

          {/* Links Table Area */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter links or domain..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-medium focus:outline-hidden"
                />
              </div>

              {links.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Links (CSV)</span>
                </button>
              )}
            </div>

            {/* Links List */}
            {links.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs">
                <p>No external hyperlinks found in this document catalog.</p>
                <p className="text-[11px] mt-1 text-neutral-400">
                  Click "Try with Sample Links PDF" above to test the inspector.
                </p>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="py-6 text-center text-neutral-500 text-xs">
                No links matching "{searchFilter}".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-500 uppercase">
                      <th className="pb-2">Protocol</th>
                      <th className="pb-2">Target Destination</th>
                      <th className="pb-2">Domain / Host</th>
                      <th className="pb-2 text-center">Page</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredLinks.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50">
                        <td className="py-2.5">
                          {item.type === 'https' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-[10px]">
                              HTTPS
                            </span>
                          ) : item.type === 'http' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold font-mono text-[10px]">
                              HTTP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold font-mono text-[10px]">
                              MAILTO
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 max-w-[280px] truncate font-mono text-neutral-900 dark:text-neutral-100">
                          {item.url}
                        </td>
                        <td className="py-2.5 font-medium text-neutral-600 dark:text-neutral-400">
                          {item.domain}
                        </td>
                        <td className="py-2.5 text-center font-mono text-neutral-500">
                          {item.pageFound || 1}
                        </td>
                        <td className="py-2.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.url)}
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                            title="Copy URL"
                          >
                            {copiedUrl === item.url ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                            title="Open Link in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

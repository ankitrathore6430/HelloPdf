import React, { useState } from 'react';
import { ToolItem } from '../types';
import { DynamicIcon } from '../components/DynamicIcon';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Share2,
  Check,
  Sparkles,
  Lock,
  Zap,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { TOOLS_DATA } from '../data/toolsData';

interface ToolPageLayoutProps {
  tool: ToolItem;
  onBackHome: () => void;
  onNavigateToTool: (toolOrId: ToolItem | string) => void;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  children: React.ReactNode;
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  tool,
  onBackHome,
  onNavigateToTool,
  isFavorite,
  onToggleFavorite,
  children,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    try {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  // Find related tools in the same category or featured tools
  const relatedTools = TOOLS_DATA.filter(
    (t) => t.id !== tool.id && (t.category === tool.category || t.featured)
  ).slice(0, 4);

  return (
    <div className="w-full min-h-screen bg-neutral-50/50 dark:bg-neutral-950 py-6 sm:py-10 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <nav className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 font-medium">
            <button
              onClick={onBackHome}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tools</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
            <span className="capitalize">{tool.category.replace(/-/g, ' ')}</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
            <span className="text-neutral-900 dark:text-white font-semibold">{tool.name}</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold shadow-2xs transition-colors"
              title="Copy direct tool URL"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Share Tool</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(tool.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-colors ${
                isFavorite
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-neutral-400'}`} />
              <span>{isFavorite ? 'Saved' : 'Save Tool'}</span>
            </button>
          </div>
        </div>

        {/* Tool Header Banner */}
        <header className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 mb-1">
            <DynamicIcon name={tool.iconName} className="w-8 h-8" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {tool.name}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
              #{tool.rank}
            </span>
          </div>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
            {tool.shortDesc}
          </p>

          {/* Privacy Guarantee Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% In-Browser & Private • Zero Server Uploads</span>
          </div>
        </header>

        {/* Dedicated Tool Interactive Workspace */}
        <main className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 dark:shadow-none p-5 sm:p-8">
          {children}
        </main>

        {/* "How to use" Guide & FAQ Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Select or Drag Files</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Drop your documents or photos directly into the tool workspace above or click "Try with Demo".
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Customize Options</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Adjust layout, page ranges, presets, or metadata to match your exact document requirements.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Instant Download</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              The engine processes everything locally in milliseconds. Click Download to save your final PDF.
            </p>
          </div>
        </section>

        {/* Related Tools Recommendations */}
        {relatedTools.length > 0 && (
          <section className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Related PDF Tools You Might Need
              </h2>
              <button
                type="button"
                onClick={onBackHome}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <span>View all 108 tools</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {relatedTools.map((relTool) => (
                <button
                  key={relTool.id}
                  type="button"
                  onClick={() => onNavigateToTool(relTool)}
                  className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-red-400 dark:hover:border-red-500 text-left transition-all hover:shadow-md group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <DynamicIcon name={relTool.iconName} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {relTool.name}
                      </div>
                      <div className="text-[10px] text-neutral-400">Rank #{relTool.rank}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                    {relTool.shortDesc}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

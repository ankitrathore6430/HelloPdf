import React from 'react';
import { Search, ShieldCheck, Zap, Laptop, ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectCategory: (catId: any) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  searchInputRef,
  onSelectCategory,
}) => {
  const quickSearches = [
    { label: 'Merge PDF', term: 'merge' },
    { label: 'Split PDF', term: 'split' },
    { label: 'Compress PDF', term: 'compress' },
    { label: 'Image to PDF', term: 'image to pdf' },
    { label: 'Sign PDF', term: 'sign' },
    { label: 'Watermark', term: 'watermark' },
    { label: 'Protect PDF', term: 'protect' },
    { label: 'Invoice Maker', term: 'invoice' },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-14 bg-gradient-to-b from-red-50/60 via-white to-neutral-50/50 dark:from-neutral-900/90 dark:via-neutral-950 dark:to-neutral-950 border-b border-neutral-200/60 dark:border-neutral-800 transition-colors">
      {/* Subtle background decorative shapes */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-100/50 dark:bg-red-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-100/40 dark:bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Top pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold mb-5 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>108 Tools • All Pro Features 100% Free Forever • No Paywalls • In-Browser</span>
        </div>

        {/* Hero Main Heading */}
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight sm:leading-none">
          Every tool you need to work with <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-red-600 via-rose-600 to-red-500 bg-clip-text text-transparent">
            PDFs in one place
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3.5 sm:mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
          Hello PDF gives you 108 powerful tools to merge, split, compress, convert, edit, and sign documents directly in your browser. All Pro features are completely free with zero limits, no registration, and 100% device-side privacy.
        </p>

        {/* Big Search Input */}
        <div className="mt-6 sm:mt-8 max-w-2xl mx-auto">
          <div className="relative flex items-center shadow-lg shadow-neutral-200/60 dark:shadow-black/40 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus-within:border-red-500 dark:focus-within:border-red-500 focus-within:ring-3 focus-within:ring-red-100 dark:focus-within:ring-red-950/60 transition-all">
            <div className="pl-4 sm:pl-5 text-neutral-400 dark:text-neutral-500">
              <Search className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across 108 tools (e.g. merge, compress, protect, watermark, sign)..."
              className="w-full py-3.5 sm:py-4 px-3 sm:px-4 text-sm sm:text-base text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="pr-4 text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                Clear
              </button>
            )}
            <div className="pr-3 hidden sm:flex items-center">
              <span className="px-2.5 py-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                108 Tools
              </span>
            </div>
          </div>

          {/* Quick Search Chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mr-1">Popular:</span>
            {quickSearches.map((qs) => (
              <button
                key={qs.label}
                onClick={() => setSearchQuery(qs.term)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 hover:bg-red-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-red-700 dark:hover:text-red-400 border border-neutral-200/80 dark:border-neutral-700 hover:border-red-200 dark:hover:border-neutral-600 transition-colors shadow-2xs font-medium"
              >
                {qs.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-6 border-t border-neutral-200/60 dark:border-neutral-800 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="font-extrabold text-lg text-neutral-900 dark:text-white">108+</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Ranked PDF Tools</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">100%</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Client-Side Privacy</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-extrabold text-lg text-neutral-900 dark:text-white">0</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Server Uploads</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-extrabold text-lg text-amber-500">4.9 ★</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Top Rated Tools</span>
          </div>
        </div>
      </div>
    </section>
  );
};

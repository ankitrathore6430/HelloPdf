import React, { useState } from 'react';
import { FileText, Star, Shield, Search, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeMode } from '../hooks/useTheme';

interface HeaderProps {
  onSearchFocus: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

export const Header: React.FC<HeaderProps> = ({
  onSearchFocus,
  favoritesCount,
  onOpenFavorites,
  theme,
  setTheme,
  resolvedTheme,
}) => {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/25 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-neutral-900 dark:text-white">
                  Hello <span className="text-red-600 dark:text-red-500">PDF</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                  108 Tools
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 -mt-0.5 hidden sm:block font-medium">
                Free Online PDF Suite
              </span>
            </div>
          </a>
        </div>

        {/* Search shortcut button */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <button
            onClick={onSearchFocus}
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors text-left"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <span>Search across 100+ PDF tools...</span>
            </span>
            <kbd className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 shadow-2xs">
              /
            </kbd>
          </button>
        </div>

        {/* Action badges & Links */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Pro Free Indicator */}
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Pro Tools Free</span>
          </span>

          {/* Privacy badge */}
          <div className="relative">
            <button
              onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-semibold"
              title="100% Client-Side Privacy"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">100% Client-Side</span>
            </button>

            {showPrivacyNotice && (
              <div className="absolute right-0 mt-2 w-72 p-3.5 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white mb-1.5">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  100% Private & Secure Processing
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  All PDF tools run <strong>directly in your browser</strong> using WebAssembly & HTML5 Canvas. Your files are <em>never</em> uploaded to any remote server, making this 100% safe for sensitive contracts and personal records.
                </p>
                <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero Server Footprint</span>
                  <button
                    onClick={() => setShowPrivacyNotice(false)}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Starred Tools */}
          <button
            onClick={onOpenFavorites}
            type="button"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold transition-colors"
            title="Saved Tools"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Light / Dark Theme Selector */}
          <ThemeToggle
            theme={theme}
            setTheme={setTheme}
            resolvedTheme={resolvedTheme}
          />
        </div>
      </div>
    </header>
  );
};


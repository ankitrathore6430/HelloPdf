import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Star,
  Shield,
  Search,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Flame,
  LayoutGrid,
  Layers,
  Zap,
  FileInput,
  FileOutput,
  PenTool,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeMode } from '../hooks/useTheme';
import { TOOLS_DATA, CATEGORIES } from '../data/toolsData';
import { ToolItem, ToolCategory } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface HeaderProps {
  onSearchFocus: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  onGoHome?: () => void;
  onSelectTool?: (tool: ToolItem) => void;
  onSelectCategory?: (category: ToolCategory) => void;
  activeCategoryId?: ToolCategory;
  activeToolId?: string;
}

interface MenuNavCategory {
  id: ToolCategory;
  name: string;
  shortLabel: string;
  icon: any;
  categoryKey: string;
  badge?: string;
  colorClass: string;
}

const MENU_CATEGORIES: MenuNavCategory[] = [
  {
    id: 'organize',
    name: 'Merge & Split',
    shortLabel: 'Merge & Split',
    icon: Layers,
    categoryKey: 'organize',
    colorClass: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'optimize',
    name: 'Compress & Clean',
    shortLabel: 'Compress',
    icon: Zap,
    categoryKey: 'optimize',
    colorClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'convert-to-pdf',
    name: 'Convert to PDF',
    shortLabel: 'Convert to PDF',
    icon: FileInput,
    categoryKey: 'convert-to-pdf',
    colorClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'convert-from-pdf',
    name: 'Convert from PDF',
    shortLabel: 'Convert from PDF',
    icon: FileOutput,
    categoryKey: 'convert-from-pdf',
    colorClass: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'edit-annotate',
    name: 'Edit & Annotate',
    shortLabel: 'Edit & Sign',
    icon: PenTool,
    categoryKey: 'edit-annotate',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'security',
    name: 'Security & Rights',
    shortLabel: 'Security',
    icon: ShieldCheck,
    categoryKey: 'security',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'business',
    name: 'Business & Docs',
    shortLabel: 'Business',
    icon: FileSpreadsheet,
    categoryKey: 'business',
    colorClass: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'trending',
    name: 'Trending Tools',
    shortLabel: 'Trending',
    icon: Flame,
    categoryKey: 'trending',
    badge: 'Hot',
    colorClass: 'text-orange-600 dark:text-orange-400',
  },
];

export const Header: React.FC<HeaderProps> = ({
  onSearchFocus,
  favoritesCount,
  onOpenFavorites,
  theme,
  setTheme,
  resolvedTheme,
  onGoHome,
  onSelectTool,
  onSelectCategory,
  activeCategoryId = 'all',
  activeToolId,
}) => {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>('organize');

  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToolClick = (tool: ToolItem) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    if (onSelectTool) {
      onSelectTool(tool);
    }
  };

  const handleCategoryNav = (catId: ToolCategory) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else if (onGoHome) {
      onGoHome();
    }
  };

  // Helper to get tools for a menu category
  const getCategoryTools = (menuCat: MenuNavCategory): ToolItem[] => {
    if (menuCat.id === 'trending') {
      return TOOLS_DATA.filter((t) => t.badge === 'Trending' || (t.featured && t.rank <= 6)).slice(0, 8);
    }
    return TOOLS_DATA.filter((t) => t.category === menuCat.categoryKey).slice(0, 8);
  };

  return (
    <header
      ref={navContainerRef}
      className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors shadow-2xs"
    >
      {/* 1. TOP BRAND & ACTION BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveDropdown(null);
              setIsMobileMenuOpen(false);
              if (onGoHome) onGoHome();
            }}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
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
          </button>
        </div>

        {/* Search shortcut button */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <button
            onClick={() => {
              setActiveDropdown(null);
              onSearchFocus();
            }}
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors text-left cursor-pointer"
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
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Pro Tools Free</span>
          </span>

          {/* Privacy badge */}
          <div className="relative">
            <button
              onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-semibold cursor-pointer"
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
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium cursor-pointer"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Starred Tools */}
          <button
            onClick={() => {
              setActiveDropdown(null);
              onOpenFavorites();
            }}
            type="button"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold transition-colors cursor-pointer"
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

          {/* Mobile Menu Toggle Button (Hamburger) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
            aria-label="Toggle Main Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN MENU BAR (DESKTOP) */}
      <nav
        aria-label="Main Navigation Menu Bar"
        className="hidden lg:block border-t border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <ul className="flex items-center gap-1 py-1.5 overflow-x-auto no-scrollbar">
            {/* All Tools Direct Tab */}
            <li>
              <button
                type="button"
                onClick={() => handleCategoryNav('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryId === 'all' && !activeDropdown
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All Tools</span>
              </button>
            </li>

            {/* Menu Bar Category Dropdown Items */}
            {MENU_CATEGORIES.map((cat) => {
              const isOpen = activeDropdown === cat.id;
              const isActive = activeCategoryId === cat.id;
              const tools = getCategoryTools(cat);
              const IconComp = cat.icon;

              return (
                <li key={cat.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(isOpen ? null : cat.id)}
                    onMouseEnter={() => {
                      if (activeDropdown !== null) {
                        setActiveDropdown(cat.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isOpen
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                        : isActive
                        ? 'text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${cat.colorClass}`} />
                    <span>{cat.shortLabel}</span>
                    {cat.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-500 text-white">
                        {cat.badge}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-neutral-700 dark:text-neutral-200' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Card */}
                  {isOpen && (
                    <div
                      onMouseLeave={() => setActiveDropdown(null)}
                      className="absolute top-full left-0 mt-1 w-80 sm:w-96 p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <IconComp className={`w-3.5 h-3.5 ${cat.colorClass}`} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white block leading-tight">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {tools.length} popular utilities
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCategoryNav(cat.id)}
                          className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Explore all</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Tool Items Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-80 overflow-y-auto pr-0.5">
                        {tools.map((tool) => {
                          const isCurrent = activeToolId === tool.id;
                          return (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => handleToolClick(tool)}
                              className={`p-2 rounded-xl text-left transition-all flex items-start gap-2.5 cursor-pointer group ${
                                isCurrent
                                  ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
                              }`}
                            >
                              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-neutral-700 dark:text-neutral-300">
                                <DynamicIcon name={tool.iconName} className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-neutral-900 dark:text-white truncate block">
                                    {tool.name}
                                  </span>
                                  {tool.badge && (
                                    <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shrink-0">
                                      {tool.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                  {tool.shortDesc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Bottom action bar */}
                      <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400 text-[10px]">100% In-Browser & Private</span>
                        <button
                          type="button"
                          onClick={() => handleCategoryNav(cat.id)}
                          className="text-neutral-700 dark:text-neutral-300 font-semibold hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          View category page →
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Quick Menu Right-hand Shortcut */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 pl-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Quick:</span>
            {[
              { id: 'merge-pdf', name: 'Merge' },
              { id: 'split-pdf', name: 'Split' },
              { id: 'compress-pdf', name: 'Compress' },
              { id: 'digital-signature', name: 'Sign' },
              { id: 'dark-mode-pdf', name: 'Dark Mode' },
            ].map((quick) => {
              const tool = TOOLS_DATA.find((t) => t.id === quick.id);
              if (!tool) return null;
              return (
                <button
                  key={quick.id}
                  type="button"
                  onClick={() => handleToolClick(tool)}
                  className="px-2 py-0.5 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {quick.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. RESPONSIVE MOBILE MENU BAR (DRAWER / PANEL) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 max-h-[80vh] overflow-y-auto shadow-2xl animate-in slide-in-from-top-2">
          <div className="p-4 space-y-4">
            {/* Search Input for Mobile */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search 100+ PDF tools..."
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSearchFocus();
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 cursor-pointer"
                readOnly
              />
            </div>

            {/* Quick Favorites & All Tools Action Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleCategoryNav('all');
                }}
                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>All 108 Tools</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFavorites();
                }}
                className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>Favorites ({favoritesCount})</span>
              </button>
            </div>

            {/* Popular Fast Shortcuts */}
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">
                Popular Tools
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'merge-pdf', name: 'Merge PDF' },
                  { id: 'split-pdf', name: 'Split PDF' },
                  { id: 'compress-pdf', name: 'Compress' },
                  { id: 'digital-signature', name: 'Sign' },
                  { id: 'dark-mode-pdf', name: 'Dark Mode' },
                  { id: 'image-to-pdf', name: 'JPG to PDF' },
                  { id: 'pdf-to-jpg', name: 'PDF to JPG' },
                  { id: 'flashcard-generator', name: 'Flashcards' },
                ].map((item) => {
                  const tool = TOOLS_DATA.find((t) => t.id === item.id);
                  if (!tool) return null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToolClick(tool)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold cursor-pointer"
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accordion Categories Menu */}
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">
                Browse by Category
              </div>
              <div className="space-y-1.5">
                {MENU_CATEGORIES.map((cat) => {
                  const isExpanded = expandedMobileCategory === cat.id;
                  const tools = getCategoryTools(cat);
                  const IconComp = cat.icon;

                  return (
                    <div
                      key={cat.id}
                      className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMobileCategory(isExpanded ? null : cat.id)
                        }
                        className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 flex items-center justify-between text-left text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className={`w-4 h-4 ${cat.colorClass}`} />
                          <span>{cat.name}</span>
                          {cat.badge && (
                            <span className="text-[8px] uppercase font-bold px-1 rounded bg-amber-500 text-white">
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="p-2 space-y-1 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                          {tools.map((tool) => (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => handleToolClick(tool)}
                              className="w-full p-2 rounded-lg flex items-center justify-between text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <DynamicIcon
                                  name={tool.iconName}
                                  className="w-3.5 h-3.5 text-neutral-500 shrink-0"
                                />
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                  {tool.name}
                                </span>
                              </div>
                              {tool.badge && (
                                <span className="text-[8px] px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                                  {tool.badge}
                                </span>
                              )}
                            </button>
                          ))}

                          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                              type="button"
                              onClick={() => handleCategoryNav(cat.id)}
                              className="w-full py-1.5 text-center text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                            >
                              View all {cat.name} tools →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Info Banner */}
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Server Uploads (100% Private)</span>
              </div>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">Free Forever</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

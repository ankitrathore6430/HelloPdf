import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileText,
  Star,
  Shield,
  Search,
  X,
  ChevronDown,
  ArrowRight,
  LayoutGrid,
  Layers,
  Zap,
  FileInput,
  FileOutput,
  PenTool,
  ShieldCheck,
  FileSpreadsheet,
  Code,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeMode } from '../hooks/useTheme';
import { TOOLS_DATA } from '../data/toolsData';
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

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Prevent background scrolling while dropdown menu is open
  useEffect(() => {
    if (activeDropdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeDropdown]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setShowPrivacyNotice(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setShowPrivacyNotice(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Robust Click & Switch Handlers for Menu Bar
  const toggleDropdown = (menuKey: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown((prev) => (prev === menuKey ? null : menuKey));
  };

  // If a dropdown is already open, hovering switches seamlessly between menus (standard desktop UX)
  const handleMouseEnter = (menuKey: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (activeDropdown !== null) {
      setActiveDropdown(menuKey);
    }
  };

  const handleMouseLeave = () => {
    // Menu stays open when clicked until clicked outside, Esc pressed, or an item is launched
  };

  const handleToolClick = (tool: ToolItem) => {
    setActiveDropdown(null);
    if (onSelectTool) {
      onSelectTool(tool);
    }
  };

  const handleCategoryNav = (catId: ToolCategory) => {
    setActiveDropdown(null);
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else if (onGoHome) {
      onGoHome();
    }
  };

  // Complete lists per category with valid tool IDs
  const organizeTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === 'organize'), []);
  const optimizeTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === 'optimize'), []);
  const convertToTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === 'convert-to-pdf'), []);
  const convertFromTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === 'convert-from-pdf'), []);
  const editAnnotateTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === 'edit-annotate'), []);
  const securityTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === 'security'), []);
  const businessTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === 'business'), []);
  const advancedTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === 'advanced'), []);

  return (
    <header
      ref={navContainerRef}
      className="sticky top-0 z-[100] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors shadow-2xs"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* 1. BRAND LOGO */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveDropdown(null);
              if (onGoHome) onGoHome();
            }}
            className="flex items-center gap-2 sm:gap-2.5 group text-left cursor-pointer select-none"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white">
                  Hello <span className="text-red-600 dark:text-red-500">PDF</span>
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 sm:py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                  108
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 -mt-0.5 hidden md:block font-medium">
                Free Browser Suite
              </span>
            </div>
          </button>
        </div>

        {/* 3. RIGHT ACTION CONTROLS */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Search Button */}
          <button
            onClick={() => {
              setActiveDropdown(null);
              onSearchFocus();
            }}
            type="button"
            className="flex items-center justify-center sm:justify-start w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors cursor-pointer"
            title="Search PDF tools (Press /)"
            aria-label="Search tools"
          >
            <Search className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="hidden sm:inline ml-2 text-neutral-500 dark:text-neutral-400">Search...</span>
            <kbd className="hidden md:inline-block ml-2 px-1.5 py-0.2 text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 shadow-2xs">
              /
            </kbd>
          </button>

          {/* Privacy Badge */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-semibold cursor-pointer"
              title="100% Client-Side Privacy"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>100% Client-Side</span>
            </button>

            {showPrivacyNotice && (
              <div className="absolute right-0 mt-2 w-72 p-3.5 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white mb-1.5">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  100% In-Browser Privacy
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                  All tools run locally on your device via WebAssembly. Files never leave your browser.
                </p>
                <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero Uploads</span>
                  <button
                    onClick={() => setShowPrivacyNotice(false)}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Starred Favorites Button */}
          <button
            onClick={() => {
              setActiveDropdown(null);
              onOpenFavorites();
            }}
            type="button"
            className="relative flex items-center justify-center w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold transition-colors cursor-pointer"
            title="Saved Favorites"
            aria-label="Saved favorites"
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span className="hidden md:inline ml-1.5">Favorites</span>
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:static sm:ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Light/Dark Theme Switcher */}
          <ThemeToggle theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />
        </div>
      </div>

      {/* 2. SUB-HEADER CATEGORY QUICK MENU BAR (Always visible & interactive on all screen sizes) */}
      <div className="border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/95 dark:bg-neutral-900/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={(e) => toggleDropdown('all-tools', e)}
            onMouseEnter={() => handleMouseEnter('all-tools')}
            className={`flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer select-none border active:scale-95 ${
              activeDropdown === 'all-tools'
                ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>All 108 Tools</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'all-tools' ? 'rotate-180' : ''}`} />
          </button>

          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 shrink-0" />

          {[
            { id: 'organize', name: 'Merge & Split', count: organizeTools.length, icon: Layers, color: 'text-red-500' },
            { id: 'optimize', name: 'Compress', count: optimizeTools.length, icon: Zap, color: 'text-amber-500' },
            { id: 'convert', name: 'Convert', count: convertToTools.length + convertFromTools.length, icon: FileInput, color: 'text-blue-500' },
            { id: 'edit-annotate', name: 'Edit & Page', count: editAnnotateTools.length, icon: PenTool, color: 'text-emerald-500' },
            { id: 'security', name: 'Sign & Security', count: securityTools.length, icon: ShieldCheck, color: 'text-indigo-500' },
            { id: 'business', name: 'Business', count: businessTools.length, icon: FileSpreadsheet, color: 'text-pink-500' },
            { id: 'advanced', name: 'Advanced', count: advancedTools.length, icon: Code, color: 'text-teal-500' },
          ].map((cat) => {
            const CatIcon = cat.icon;
            const isOpen = activeDropdown === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={(e) => toggleDropdown(cat.id, e)}
                onMouseEnter={() => handleMouseEnter(cat.id)}
                className={`flex items-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer select-none border active:scale-95 ${
                  isOpen
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-2xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <CatIcon className={`w-3.5 h-3.5 ${isOpen ? '' : cat.color}`} />
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isOpen
                    ? 'bg-neutral-800 dark:bg-neutral-200 text-neutral-200 dark:text-neutral-800'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                }`}>
                  {cat.count}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RESPONSIVE SUB-HEADER DROPDOWN PANEL (Displays on top of the home screen body on all devices) */}
      {activeDropdown && (
        <>
          {/* Semi-transparent backdrop over home screen body */}
          <div
            className="fixed inset-0 top-[102px] sm:top-[112px] bg-black/40 backdrop-blur-[2px] z-[90] animate-in fade-in duration-150"
            onClick={() => setActiveDropdown(null)}
            aria-hidden="true"
          />

          <div className="absolute top-full left-0 right-0 z-[100] border-t border-neutral-200 dark:border-neutral-800 bg-white/98 dark:bg-neutral-900/98 backdrop-blur-md shadow-2xl max-h-[calc(100vh-125px)] overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shadow-2xs shrink-0">
                    {activeDropdown === 'organize' && <Layers className="w-5 h-5" />}
                    {activeDropdown === 'optimize' && <Zap className="w-5 h-5 text-amber-500" />}
                    {activeDropdown === 'convert' && <FileInput className="w-5 h-5 text-blue-500" />}
                    {activeDropdown === 'edit-annotate' && <PenTool className="w-5 h-5 text-emerald-500" />}
                    {activeDropdown === 'security' && <ShieldCheck className="w-5 h-5 text-indigo-500" />}
                    {activeDropdown === 'business' && <FileSpreadsheet className="w-5 h-5 text-pink-500" />}
                    {activeDropdown === 'advanced' && <Code className="w-5 h-5 text-teal-500" />}
                    {activeDropdown === 'all-tools' && <LayoutGrid className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
                      {activeDropdown === 'organize' && `Merge & Split (${organizeTools.length} Tools)`}
                      {activeDropdown === 'optimize' && `Compress & Clean (${optimizeTools.length} Tools)`}
                      {activeDropdown === 'convert' && `Convert PDF (${convertToTools.length + convertFromTools.length} Tools)`}
                      {activeDropdown === 'edit-annotate' && `Edit, Page & Watermark (${editAnnotateTools.length} Tools)`}
                      {activeDropdown === 'security' && `Sign & Security (${securityTools.length} Tools)`}
                      {activeDropdown === 'business' && `Business Documents (${businessTools.length} Tools)`}
                      {activeDropdown === 'advanced' && `Advanced & Dev Utilities (${advancedTools.length} Tools)`}
                      {activeDropdown === 'all-tools' && 'Complete 108 PDF Tools Directory'}
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {activeDropdown === 'organize' && 'Reorder, combine, extract, crop, and split PDF pages with device-side speed'}
                      {activeDropdown === 'optimize' && 'Reduce file size, flatten, grayscale, and clean metadata without cloud uploads'}
                      {activeDropdown === 'convert' && 'Convert between PDF and Word, Excel, JPG, PNG, Text, EPUB, and more'}
                      {activeDropdown === 'edit-annotate' && 'Add text, page numbering, margins, watermarks, stamps, and booklet formats'}
                      {activeDropdown === 'security' && 'Digital signature drawing, redaction, password protection, and sanitization'}
                      {activeDropdown === 'business' && 'Generate invoices, NDAs, receipts, certificates, purchase orders, and forms'}
                      {activeDropdown === 'advanced' && 'JSON/Base64 tools, repair corrupted files, font extractors, and dev workflows'}
                      {activeDropdown === 'all-tools' && 'Browse all 108 client-side tools or select a category below'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeDropdown !== 'all-tools' && (
                    <button
                      type="button"
                      onClick={() => handleCategoryNav(activeDropdown as ToolCategory)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Filter Catalog</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(null)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    aria-label="Close dropdown"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Special layout for all-tools */}
              {activeDropdown === 'all-tools' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5">
                    {[
                      { id: 'organize', name: 'Merge & Split', count: organizeTools.length, icon: Layers, color: 'text-red-500' },
                      { id: 'optimize', name: 'Compress & Clean', count: optimizeTools.length, icon: Zap, color: 'text-amber-500' },
                      { id: 'convert-to-pdf', name: 'Convert to PDF', count: convertToTools.length, icon: FileInput, color: 'text-blue-500' },
                      { id: 'convert-from-pdf', name: 'Convert from PDF', count: convertFromTools.length, icon: FileOutput, color: 'text-purple-500' },
                      { id: 'edit-annotate', name: 'Edit & Page', count: editAnnotateTools.length, icon: PenTool, color: 'text-emerald-500' },
                      { id: 'security', name: 'Sign & Security', count: securityTools.length, icon: ShieldCheck, color: 'text-indigo-500' },
                      { id: 'business', name: 'Business & Docs', count: businessTools.length, icon: FileSpreadsheet, color: 'text-pink-500' },
                      { id: 'advanced', name: 'Advanced & Dev', count: advancedTools.length, icon: Code, color: 'text-teal-500' },
                    ].map((cat) => {
                      const CatIcon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            if (cat.id === 'convert-to-pdf' || cat.id === 'convert-from-pdf') {
                              setActiveDropdown('convert');
                            } else {
                              setActiveDropdown(cat.id);
                            }
                          }}
                          className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-all border border-neutral-100 dark:border-neutral-800/80 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <CatIcon className={`w-4 h-4 ${cat.color} group-hover:scale-110 transition-transform`} />
                            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                              {cat.count} tools
                            </span>
                          </div>
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate group-hover:text-red-600 dark:group-hover:text-red-400">
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                      Popular Quick-Launch Tools
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {TOOLS_DATA.slice(0, 8).map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToolClick(tool)}
                          className="min-h-[48px] p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer border bg-neutral-50/60 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 group active:scale-[0.99]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-neutral-700 dark:text-neutral-200 shadow-2xs">
                            <DynamicIcon name={tool.iconName} className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold truncate block">{tool.name}</span>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">{tool.shortDesc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCategoryNav('all')}
                    className="w-full min-h-[44px] py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98"
                  >
                    <span>Open Full Catalog (All 108 Tools)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Special layout for convert: 2 columns */}
              {activeDropdown === 'convert' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Convert TO PDF */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileInput className="w-4 h-4" />
                        Convert TO PDF ({convertToTools.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCategoryNav('convert-to-pdf')}
                        className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {convertToTools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToolClick(tool)}
                          className="p-2.5 rounded-xl text-left bg-neutral-50/70 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-100 dark:border-neutral-800/80 flex items-center gap-2.5 cursor-pointer group transition-all"
                        >
                          <DynamicIcon
                            name={tool.iconName}
                            className="w-4 h-4 text-blue-500 shrink-0 group-hover:scale-110 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                              {tool.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Convert FROM PDF */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileOutput className="w-4 h-4" />
                        Convert FROM PDF ({convertFromTools.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCategoryNav('convert-from-pdf')}
                        className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {convertFromTools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToolClick(tool)}
                          className="p-2.5 rounded-xl text-left bg-neutral-50/70 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-100 dark:border-neutral-800/80 flex items-center gap-2.5 cursor-pointer group transition-all"
                        >
                          <DynamicIcon
                            name={tool.iconName}
                            className="w-4 h-4 text-purple-500 shrink-0 group-hover:scale-110 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                              {tool.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Standard category tool grid (Organize, Optimize, Edit, Security, Business, Advanced) */}
              {activeDropdown !== 'all-tools' && activeDropdown !== 'convert' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {(activeDropdown === 'organize' ? organizeTools :
                    activeDropdown === 'optimize' ? optimizeTools :
                    activeDropdown === 'edit-annotate' ? editAnnotateTools :
                    activeDropdown === 'security' ? securityTools :
                    activeDropdown === 'business' ? businessTools :
                    advancedTools
                  ).map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleToolClick(tool)}
                      className={`min-h-[48px] p-3 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer group border active:scale-[0.99] ${
                        activeToolId === tool.id
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                          : 'bg-neutral-50/60 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-neutral-700 dark:text-neutral-200 shadow-2xs">
                        <DynamicIcon name={tool.iconName} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate block">{tool.name}</span>
                          {tool.badge && (
                            <span className="text-[8px] font-bold uppercase px-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 shrink-0">
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">{tool.shortDesc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

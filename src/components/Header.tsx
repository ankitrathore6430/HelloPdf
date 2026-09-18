import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Star,
  Shield,
  Search,
  Menu,
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
  Flame,
  Sparkles,
  Sliders,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>('organize');

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

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
        setIsMobileMenuOpen(false);
        setShowPrivacyNotice(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Smooth hover handlers with small grace period to prevent flickering
  const handleMouseEnter = (menuKey: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(menuKey);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

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

  // Curated lists for clean, structured menus
  const organizeTools = TOOLS_DATA.filter((t) => t.category === 'organize').slice(0, 6);
  const optimizeTools = TOOLS_DATA.filter((t) => t.category === 'optimize').slice(0, 5);
  const convertToTools = TOOLS_DATA.filter((t) => t.category === 'convert-to-pdf').slice(0, 6);
  const convertFromTools = TOOLS_DATA.filter((t) => t.category === 'convert-from-pdf').slice(0, 6);
  const editSignTools = TOOLS_DATA.filter(
    (t) =>
      ['digital-signature', 'add-page-numbers', 'dark-mode-pdf', 'watermark-pdf', 'protect-pdf', 'pdf-redaction'].includes(t.id) ||
      (t.category === 'edit-annotate' && t.rank <= 6)
  ).slice(0, 6);

  return (
    <header
      ref={navContainerRef}
      className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors shadow-2xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* 1. BRAND LOGO */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveDropdown(null);
              setIsMobileMenuOpen(false);
              if (onGoHome) onGoHome();
            }}
            className="flex items-center gap-2.5 group text-left cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-neutral-900 dark:text-white">
                  Hello <span className="text-red-600 dark:text-red-500">PDF</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                  108
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 -mt-0.5 hidden sm:block font-medium">
                Free Browser Suite
              </span>
            </div>
          </button>
        </div>

        {/* 2. DESKTOP MAIN NAVIGATION MENU BAR (Clean, Single Row, High Contrast) */}
        <nav aria-label="Desktop Main Navigation" className="hidden lg:flex items-center gap-1">
          {/* MENU ITEM 1: Merge & Split */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('organize')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'organize' ? null : 'organize')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                activeDropdown === 'organize'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Merge & Split</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  activeDropdown === 'organize' ? 'rotate-180 text-red-600' : ''
                }`}
              />
            </button>

            {/* Dropdown Card */}
            {activeDropdown === 'organize' && (
              <div className="absolute top-full left-0 pt-1.5 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Page & File Operations
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCategoryNav('organize')}
                      className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all 21</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {organizeTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleToolClick(tool)}
                        className={`w-full p-2 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer group ${
                          activeToolId === tool.id
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-neutral-700 dark:text-neutral-300">
                          <DynamicIcon name={tool.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate block">{tool.name}</span>
                            {tool.badge && (
                              <span className="text-[8px] font-bold uppercase px-1 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 line-clamp-1">{tool.shortDesc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MENU ITEM 2: Compress & Optimize */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('optimize')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'optimize' ? null : 'optimize')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                activeDropdown === 'optimize'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Compress</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  activeDropdown === 'optimize' ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </button>

            {/* Dropdown Card */}
            {activeDropdown === 'optimize' && (
              <div className="absolute top-full left-0 pt-1.5 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Size & Pre-press
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCategoryNav('optimize')}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all 5</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {optimizeTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleToolClick(tool)}
                        className={`w-full p-2 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer group ${
                          activeToolId === tool.id
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-neutral-700 dark:text-neutral-300">
                          <DynamicIcon name={tool.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate block">{tool.name}</span>
                            {tool.badge && (
                              <span className="text-[8px] font-bold uppercase px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 line-clamp-1">{tool.shortDesc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MENU ITEM 3: Convert PDF (Side-by-Side Mega Dropdown) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('convert')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'convert' ? null : 'convert')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                activeDropdown === 'convert'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
              }`}
            >
              <FileInput className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Convert PDF</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  activeDropdown === 'convert' ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {/* Side-by-Side Convert Dropdown */}
            {activeDropdown === 'convert' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1.5 w-[560px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-2 gap-4">
                  {/* Column 1: Convert TO PDF */}
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileInput className="w-3.5 h-3.5" />
                        Convert TO PDF
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCategoryNav('convert-to-pdf')}
                        className="text-[10px] font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      >
                        All 9 →
                      </button>
                    </div>
                    <div className="space-y-1">
                      {convertToTools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToolClick(tool)}
                          className="w-full p-2 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer group transition-colors"
                        >
                          <DynamicIcon
                            name={tool.iconName}
                            className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform"
                          />
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {tool.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Convert FROM PDF */}
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileOutput className="w-3.5 h-3.5" />
                        Convert FROM PDF
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCategoryNav('convert-from-pdf')}
                        className="text-[10px] font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      >
                        All 8 →
                      </button>
                    </div>
                    <div className="space-y-1">
                      {convertFromTools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToolClick(tool)}
                          className="w-full p-2 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer group transition-colors"
                        >
                          <DynamicIcon
                            name={tool.iconName}
                            className="w-3.5 h-3.5 text-purple-500 shrink-0 group-hover:scale-110 transition-transform"
                          />
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {tool.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MENU ITEM 4: Edit & Sign */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('edit-sign')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'edit-sign' ? null : 'edit-sign')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                activeDropdown === 'edit-sign'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Edit & Sign</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  activeDropdown === 'edit-sign' ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </button>

            {/* Dropdown Card */}
            {activeDropdown === 'edit-sign' && (
              <div className="absolute top-full left-0 pt-1.5 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Annotation & Signatures
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCategoryNav('edit-annotate')}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore all</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {editSignTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleToolClick(tool)}
                        className={`w-full p-2 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer group ${
                          activeToolId === tool.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-neutral-700 dark:text-neutral-300">
                          <DynamicIcon name={tool.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate block">{tool.name}</span>
                            {tool.badge && (
                              <span className="text-[8px] font-bold uppercase px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 line-clamp-1">{tool.shortDesc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MENU ITEM 5: All Tools (Categorized Directory Mega Dropdown) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('all-tools')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('all-tools');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleCategoryNav('all');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors cursor-pointer select-none"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
              <span>All 108 Tools</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  activeDropdown === 'all-tools' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Mega Dropdown Grid */}
            {activeDropdown === 'all-tools' && (
              <div className="absolute top-full right-0 pt-1.5 w-[680px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                      <span className="font-extrabold text-sm text-neutral-900 dark:text-white block">
                        Complete PDF Tools Directory
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        108 tools grouped by specialized workflows
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCategoryNav('all')}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Browse Full Grid
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'organize', name: 'Merge & Split', count: 21, icon: Layers, color: 'text-red-500' },
                      { id: 'optimize', name: 'Compress & Clean', count: 5, icon: Zap, color: 'text-amber-500' },
                      { id: 'convert-to-pdf', name: 'Convert to PDF', count: 9, icon: FileInput, color: 'text-blue-500' },
                      { id: 'convert-from-pdf', name: 'Convert from PDF', count: 8, icon: FileOutput, color: 'text-purple-500' },
                      { id: 'edit-annotate', name: 'Edit & Annotate', count: 14, icon: PenTool, color: 'text-emerald-500' },
                      { id: 'security', name: 'Security & Rights', count: 12, icon: ShieldCheck, color: 'text-indigo-500' },
                      { id: 'business', name: 'Business & Docs', count: 25, icon: FileSpreadsheet, color: 'text-pink-500' },
                      { id: 'advanced', name: 'Advanced Utilities', count: 14, icon: Sliders, color: 'text-cyan-500' },
                      { id: 'trending', name: 'Trending Tools', count: 12, icon: Flame, color: 'text-orange-500' },
                    ].map((cat) => {
                      const CatIcon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryNav(cat.id as ToolCategory)}
                          className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-all border border-neutral-100 dark:border-neutral-800/80 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <CatIcon className={`w-4 h-4 ${cat.color} group-hover:scale-110 transition-transform`} />
                            <span className="text-[10px] font-bold text-neutral-400 bg-white dark:bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-200 dark:border-neutral-700">
                              {cat.count}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate group-hover:text-red-600 dark:group-hover:text-red-400">
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* 3. RIGHT CONTROLS (Search, Privacy, Favorites, Theme & Mobile Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Search Shortcut */}
          <button
            onClick={() => {
              setActiveDropdown(null);
              onSearchFocus();
            }}
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-colors text-left cursor-pointer"
            title="Search PDF tools (Press /)"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 shadow-2xs">
              /
            </kbd>
          </button>

          {/* Privacy Badge */}
          <div className="relative">
            <button
              onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-semibold cursor-pointer"
              title="100% Client-Side Privacy"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xl:inline">100% Client-Side</span>
            </button>

            {showPrivacyNotice && (
              <div className="absolute right-0 mt-2 w-72 p-3.5 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white mb-1.5">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  100% Private & In-Browser
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                  All tools run strictly on your device using WebAssembly and canvas memory. Files are never transmitted over the network.
                </p>
                <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[11px]">
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

          {/* Starred Favorites */}
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

          {/* Theme Selector */}
          <ThemeToggle theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 4. MOBILE / TABLET SLIDE-DOWN DRAWER (< lg) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 max-h-[82vh] overflow-y-auto shadow-2xl animate-in slide-in-from-top-2">
          <div className="p-4 space-y-4">
            {/* Search Input for Mobile */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
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

            {/* Quick Action Grid */}
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

            {/* Mobile Category Accordions */}
            <div className="space-y-1.5">
              {[
                { id: 'organize', name: 'Merge & Split', icon: Layers, tools: organizeTools },
                { id: 'optimize', name: 'Compress & Clean', icon: Zap, tools: optimizeTools },
                { id: 'convert-to-pdf', name: 'Convert to PDF', icon: FileInput, tools: convertToTools },
                { id: 'convert-from-pdf', name: 'Convert from PDF', icon: FileOutput, tools: convertFromTools },
                { id: 'edit-annotate', name: 'Edit & Sign', icon: PenTool, tools: editSignTools },
              ].map((group) => {
                const isExpanded = expandedMobileCategory === group.id;
                const GroupIcon = group.icon;

                return (
                  <div
                    key={group.id}
                    className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedMobileCategory(isExpanded ? null : group.id)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 flex items-center justify-between text-left text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <GroupIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>{group.name}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-2 space-y-1 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                        {group.tools.map((tool) => (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => handleToolClick(tool)}
                            className="w-full p-2 rounded-lg flex items-center justify-between text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs cursor-pointer group"
                          >
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                              {tool.name}
                            </span>
                            {tool.badge && (
                              <span className="text-[8px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

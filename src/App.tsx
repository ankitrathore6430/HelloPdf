import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { TopRankedGrid } from './components/TopRankedGrid';
import { AllToolsSection } from './components/AllToolsSection';
import { ToolWorkspaceModal } from './components/ToolWorkspaceModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { Footer } from './components/Footer';
import { TOOLS_DATA } from './data/toolsData';
import { ToolItem, ToolCategory } from './types';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [activeTool, setActiveTool] = useState<ToolItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hello_pdf_favorites');
      return saved ? JSON.parse(saved) : ['merge-pdf', 'split-pdf', 'compress-pdf', 'digital-signature'];
    } catch {
      return ['merge-pdf', 'split-pdf', 'compress-pdf', 'digital-signature'];
    }
  });
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hello_pdf_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not save favorites to localStorage', e);
    }
  }, [favorites]);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (e.key === 'Escape') {
        setActiveTool(null);
        setIsFavoritesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleFavorite = (toolId: string) => {
    setFavorites((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleClearFavorites = () => {
    setFavorites([]);
  };

  const handleSearchFocus = () => {
    searchInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-red-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Header
        onSearchFocus={handleSearchFocus}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        theme={theme}
        setTheme={setTheme}
        resolvedTheme={resolvedTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchInputRef={searchInputRef}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            const el = document.getElementById('all-tools');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Top Ranked & Essential Tools Grid (Top 12 Showcase) */}
        {!searchQuery && selectedCategory === 'all' && (
          <TopRankedGrid
            tools={TOOLS_DATA}
            onSelectTool={(tool) => setActiveTool(tool)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Complete Directory of 108+ Tools with Filter and Sort */}
        <AllToolsSection
          tools={TOOLS_DATA}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectTool={(tool) => setActiveTool(tool)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('all-tools');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Tool Workspace Execution Modal */}
      {activeTool && (
        <ToolWorkspaceModal
          tool={activeTool}
          onClose={() => setActiveTool(null)}
        />
      )}

      {/* Starred Favorites Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        tools={TOOLS_DATA}
        onSelectTool={(tool) => setActiveTool(tool)}
        onToggleFavorite={handleToggleFavorite}
        onClearFavorites={handleClearFavorites}
      />
    </div>
  );
}

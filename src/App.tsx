import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { TopRankedGrid } from './components/TopRankedGrid';
import { AllToolsSection } from './components/AllToolsSection';
import { ToolPageRouter } from './tools/ToolPageRouter';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { Footer } from './components/Footer';
import { TOOLS_DATA } from './data/toolsData';
import { ToolItem, ToolCategory } from './types';
import { useTheme } from './hooks/useTheme';
import { useRouter } from './hooks/useRouter';

export default function App() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { activeTool, navigateToTool, navigateHome } = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !activeTool && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (e.key === 'Escape') {
        if (isFavoritesOpen) {
          setIsFavoritesOpen(false);
        } else if (activeTool) {
          navigateHome();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, isFavoritesOpen, navigateHome]);

  const handleToggleFavorite = (toolId: string) => {
    setFavorites((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleClearFavorites = () => {
    setFavorites([]);
  };

  const handleSearchFocus = () => {
    if (activeTool) {
      navigateHome();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      searchInputRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-red-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar & Menu Bar */}
      <Header
        onSearchFocus={handleSearchFocus}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        theme={theme}
        setTheme={setTheme}
        resolvedTheme={resolvedTheme}
        onGoHome={navigateHome}
        onSelectTool={(tool) => navigateToTool(tool)}
        onSelectCategory={(cat) => {
          if (activeTool) navigateHome();
          setSelectedCategory(cat);
          setTimeout(() => {
            const el = document.getElementById('all-tools');
            el?.scrollIntoView({ behavior: 'smooth' });
          }, 60);
        }}
        activeCategoryId={selectedCategory}
        activeToolId={activeTool?.id}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTool ? (
          /* Dedicated Tool Page with URL sync (e.g. hellopdf.com/merge-pdf) */
          <ToolPageRouter
            tool={activeTool}
            onBackHome={navigateHome}
            onNavigateToTool={navigateToTool}
            isFavorite={favorites.includes(activeTool.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          /* Homepage Catalog & Category Views */
          <>
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

            {!searchQuery && selectedCategory === 'all' && (
              <TopRankedGrid
                tools={TOOLS_DATA}
                onSelectTool={(tool) => navigateToTool(tool)}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            <AllToolsSection
              tools={TOOLS_DATA}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectTool={(tool) => navigateToTool(tool)}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          if (activeTool) navigateHome();
          setSelectedCategory(cat);
          const el = document.getElementById('all-tools');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Starred Favorites Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        tools={TOOLS_DATA}
        onSelectTool={(tool) => {
          setIsFavoritesOpen(false);
          navigateToTool(tool);
        }}
        onToggleFavorite={handleToggleFavorite}
        onClearFavorites={handleClearFavorites}
      />
    </div>
  );
}

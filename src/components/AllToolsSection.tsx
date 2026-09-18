import React, { useState, useMemo } from 'react';
import { ToolItem, ToolCategory, SortOption } from '../types';
import { CATEGORIES } from '../data/toolsData';
import { DynamicIcon } from './DynamicIcon';
import { Star, ArrowUpDown, Filter, Search, ArrowRight, Check, Sparkles } from 'lucide-react';

interface AllToolsSectionProps {
  tools: ToolItem[];
  selectedCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectTool: (tool: ToolItem) => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
}

export const AllToolsSection: React.FC<AllToolsSectionProps> = ({
  tools,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  onSelectTool,
  favorites,
  onToggleFavorite,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  const [activeBadgeFilter, setActiveBadgeFilter] = useState<string>('all');

  // Filter & Sort
  const filteredTools = useMemo(() => {
    let list = [...tools];

    // Category filter
    if (selectedCategory === 'trending') {
      list = list.filter((t) => t.badge === 'Trending' || (t.featured && t.rank <= 6));
    } else if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory);
    }

    // Badge filter
    if (activeBadgeFilter !== 'all') {
      list = list.filter((t) => t.badge === activeBadgeFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortDesc.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q)) ||
          `#${t.rank}` === q ||
          String(t.rank) === q
      );
    }

    // Sorting
    if (sortBy === 'rank') {
      list.sort((a, b) => a.rank - b.rank);
    } else if (sortBy === 'popular') {
      // Parse usage numbers
      const parseUsage = (u: string) => {
        if (u.includes('M')) return parseFloat(u) * 1000000;
        if (u.includes('K')) return parseFloat(u) * 1000;
        return parseFloat(u);
      };
      list.sort((a, b) => parseUsage(b.usageCount) - parseUsage(a.usageCount));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [tools, selectedCategory, activeBadgeFilter, searchQuery, sortBy]);

  const badgesList = ['all', 'Essential', 'Popular', 'Security', 'Pro', 'Trending'];

  return (
    <section id="all-tools" className="py-12 bg-neutral-50/70 dark:bg-neutral-950/70 min-h-[600px] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Complete PDF Tool Directory</span>
              <span className="text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800/60">
                108 Available
              </span>
            </h2>

            {/* Quick stats */}
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium hidden sm:inline">
              Showing {filteredTools.length} tools
            </span>
          </div>

          {/* Category Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200/90 dark:border-neutral-800'
                  }`}
                >
                  <DynamicIcon
                    name={cat.icon}
                    className={`w-3.5 h-3.5 ${isActive ? 'text-red-400 dark:text-red-600' : 'text-neutral-500 dark:text-neutral-400'}`}
                  />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-neutral-300 dark:text-neutral-800'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter & Sort Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs mb-6">
          {/* Badge Filter tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium pl-1 mr-1">Filter:</span>
            {badgesList.map((badge) => (
              <button
                key={badge}
                onClick={() => setActiveBadgeFilter(badge)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeBadgeFilter === badge
                    ? 'bg-red-600 text-white font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {badge === 'all' ? 'All Tags' : badge === 'Pro' ? 'Pro (100% Free)' : badge}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor="sort-by" className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort by:</span>
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="rank">Rank (#1 - #108)</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated (★)</option>
              <option value="name">Name (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTools.map((tool) => {
              const isFav = favorites.includes(tool.id);

              return (
                <div
                  key={tool.id}
                  onClick={() => onSelectTool(tool)}
                  className="group relative flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg dark:hover:shadow-black/50 transition-all cursor-pointer"
                >
                  <div>
                    {/* Header with Rank and Tag */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700">
                          #{tool.rank}
                        </span>
                        {tool.badge && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                              tool.badge === 'Pro'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-extrabold'
                                : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-transparent'
                            }`}
                          >
                            {tool.badge === 'Pro' ? (
                              <>
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                FREE PRO
                              </>
                            ) : (
                              tool.badge
                            )}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(tool.id);
                        }}
                        className="p-1 rounded text-neutral-300 dark:text-neutral-600 hover:text-amber-500 transition-colors"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Icon and Title */}
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-tr ${tool.accentColor} flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        <DynamicIcon name={tool.iconName} className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug">
                          {tool.name}
                        </h3>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">
                          {tool.category.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                      {tool.shortDesc}
                    </p>
                  </div>

                  {/* Footer stats */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {tool.rating.toFixed(2)}
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">No matching PDF tools found</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              We couldn't find any tool matching "{searchQuery}". Try searching for keywords like "merge", "split", "compress", or "image".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveBadgeFilter('all');
                onSelectCategory('all');
              }}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

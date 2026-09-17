import React from 'react';
import { ToolItem } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { Star, Flame, Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface TopRankedGridProps {
  tools: ToolItem[];
  onSelectTool: (tool: ToolItem) => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
}

export const TopRankedGrid: React.FC<TopRankedGridProps> = ({
  tools,
  onSelectTool,
  favorites,
  onToggleFavorite,
}) => {
  // Get top 12 tools for the prominent home screen showcase
  const topTools = tools.slice(0, 12);

  return (
    <section className="py-10 bg-white dark:bg-neutral-950 border-b border-neutral-200/60 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Most Popular & Essential</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Top Ranked PDF Tools
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              The 12 most frequently used tools, ranked by community usage and efficiency.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              High Speed • In-Browser
            </span>
          </div>
        </div>

        {/* 12 Prominent Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {topTools.map((tool) => {
            const isFav = favorites.includes(tool.id);
            const isTop3 = tool.rank <= 3;

            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-red-400 dark:hover:border-red-500 hover:shadow-xl hover:shadow-red-500/5 dark:hover:shadow-black/50 transition-all cursor-pointer"
              >
                {/* Top bar with Rank Badge and Favorite Button */}
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2">
                    {/* Rank Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                        tool.rank === 1
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 shadow-xs'
                          : tool.rank === 2
                          ? 'bg-slate-200 text-slate-900 ring-2 ring-slate-300 shadow-xs'
                          : tool.rank === 3
                          ? 'bg-amber-700/15 text-amber-900 dark:text-amber-300 ring-2 ring-amber-600/30 shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold'
                      }`}
                    >
                      {tool.rank <= 3 && <Trophy className="w-3 h-3" />}
                      #{tool.rank}
                    </span>

                    {/* Quality Badge */}
                    {tool.badge && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                          tool.badge === 'Pro'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-extrabold'
                            : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200/70 dark:border-red-800/60'
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

                  {/* Favorite button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(tool.id);
                    }}
                    className="p-1 rounded-lg text-neutral-300 dark:text-neutral-600 hover:text-amber-500 transition-colors"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isFav ? 'fill-amber-400 text-amber-500' : 'hover:fill-amber-200'
                      }`}
                    />
                  </button>
                </div>

                {/* Main Card Content */}
                <div>
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${tool.accentColor} flex items-center justify-center text-white shadow-md mb-3.5 group-hover:scale-108 transition-transform`}
                  >
                    <DynamicIcon name={tool.iconName} className="w-6 h-6 stroke-[2]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug">
                    {tool.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                    {tool.shortDesc}
                  </p>
                </div>

                {/* Bottom stats & CTA */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {tool.rating.toFixed(2)}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="text-neutral-400 dark:text-neutral-500 font-medium">{tool.usageCount} uses</span>
                  </div>

                  <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400 group-hover:translate-x-0.5 transition-transform">
                    Use
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

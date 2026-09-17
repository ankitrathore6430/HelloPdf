import React from 'react';
import { ToolItem } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { X, Star, Trash2, ArrowRight } from 'lucide-react';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: string[];
  tools: ToolItem[];
  onSelectTool: (tool: ToolItem) => void;
  onToggleFavorite: (toolId: string) => void;
  onClearFavorites: () => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  tools,
  onSelectTool,
  onToggleFavorite,
  onClearFavorites,
}) => {
  if (!isOpen) return null;

  const favoriteTools = tools.filter((t) => favorites.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col justify-between border-l border-neutral-200 dark:border-neutral-800 transition-colors">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            <h3 className="font-extrabold text-neutral-900 dark:text-white text-base">Your Favorite Tools</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
              {favoriteTools.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favoriteTools.length > 0 ? (
            favoriteTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  onClose();
                  onSelectTool(tool);
                }}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-red-400 dark:hover:border-red-500 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-neutral-800"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${tool.accentColor} flex items-center justify-center text-white shrink-0 shadow-2xs`}
                  >
                    <DynamicIcon name={tool.iconName} className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-neutral-900 dark:text-white text-xs group-hover:text-red-600 dark:group-hover:text-red-400 truncate transition-colors">
                        {tool.name}
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        #{tool.rank}
                      </span>
                      {tool.badge === 'Pro' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          FREE PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{tool.shortDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(tool.id);
                    }}
                    className="p-1 text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 px-4">
              <Star className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
              <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">No saved favorites yet</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Click the star icon on any PDF tool card to quickly access it here later.
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {favoriteTools.length > 0 && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900 flex items-center justify-between">
            <button
              onClick={onClearFavorites}
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 font-medium"
            >
              Clear all favorites
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Plus, Ghost } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { AppCard } from './AppCard';
import { AppListView } from './AppListView';

export const MainView: React.FC = () => {
  const {
    games,
    settings,
    setSearchQuery,
    setSelectedTag,
    setSpotlightOpen,
  } = useGameStore();

  const isDark = settings.themeMode === 'dark';

  // Filter & Sort
  const filteredItems = useMemo(() => {
    let list = games.filter((item) => {
      // Hidden filter
      if (item.hidden && !settings.showHidden) return false;

      // Active Filter (sidebar)
      if (settings.activeFilter === 'game' && item.category !== 'game') return false;
      if (settings.activeFilter === 'app' && item.category !== 'app') return false;
      if (settings.activeFilter === 'favorites' && !item.favorite) return false;
      if (settings.activeFilter === 'recent' && !item.lastPlayed) return false;

      // Platform filter
      if (settings.activePlatform !== 'all' && item.platform !== settings.activePlatform) {
        return false;
      }

      // Tag filter
      if (settings.selectedTag && !item.tags.includes(settings.selectedTag)) {
        return false;
      }

      // Search Query
      if (settings.searchQuery.trim()) {
        const q = settings.searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchPlatform = item.platform.toLowerCase().includes(q);
        if (!matchTitle && !matchTag && !matchPlatform) return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      let cmp = 0;
      switch (settings.sortBy) {
        case 'lastPlayed':
          cmp = (b.lastPlayed || 0) - (a.lastPlayed || 0);
          break;
        case 'playCount':
          cmp = (b.playCount || 0) - (a.playCount || 0);
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return settings.sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [games, settings]);

  return (
    <div className="flex-1 overflow-y-auto p-6 transition-colors duration-200">
      {filteredItems.length > 0 ? (
        settings.viewMode === 'list' ? (
          <AppListView items={filteredItems} />
        ) : (
          <motion.div
            layout
            className={`grid gap-5 ${
              settings.viewMode === 'grid-square'
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            }`}
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <AppCard key={item.id} item={item} viewMode={settings.viewMode} />
              ))}
            </AnimatePresence>
          </motion.div>
        )
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-400'
            }`}
          >
            <Ghost className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold mb-1 text-zinc-900 dark:text-zinc-100">
            No items found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-5">
            {settings.searchQuery || settings.selectedTag || settings.activeFilter !== 'all'
              ? 'No games or applications match your current search or filter.'
              : 'Your library is empty. Add desktop programs or scan your game libraries.'}
          </p>

          <div className="flex gap-2.5">
            {(settings.searchQuery || settings.selectedTag) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                Clear Search
              </button>
            )}

            <button
              onClick={() => setSpotlightOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Program</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

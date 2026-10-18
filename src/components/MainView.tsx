import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Ghost } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { AppCard } from './AppCard';
import { AppListView } from './AppListView';
import { AppLogo } from './AppLogo';

export const MainView: React.FC = () => {
  const {
    games,
    settings,
    setSearchQuery,
    setSelectedTag,
    setSpotlightOpen,
  } = useGameStore();

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
    <div className="flex-1 overflow-y-auto p-6 transition-colors duration-200 bg-base">
      {filteredItems.length > 0 ? (
        settings.viewMode === 'list' ? (
          <AppListView items={filteredItems} />
        ) : (
          <motion.div
            layout
            className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
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
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 border border-subtle bg-surface shadow-xs p-3.5">
            <AppLogo className="w-full h-full opacity-70" />
          </div>
          <h3 className="text-sm font-semibold mb-1 text-primary">
            No items found
          </h3>
          <p className="text-xs text-muted max-w-sm mb-5">
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
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-subtle bg-surface text-muted hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors shadow-xs"
              >
                Clear Search
              </button>
            )}

            <button
              onClick={() => setSpotlightOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-accent text-accent-fg hover:bg-accent-hover transition-colors shadow-xs cursor-pointer"
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

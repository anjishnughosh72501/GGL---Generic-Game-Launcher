import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  MoreVertical,
  Star,
  FolderOpen,
  Edit2,
  Trash2,
  EyeOff,
  Flame,
  Clock,
  Loader2,
} from 'lucide-react';
import { GameItem, ViewMode } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { showItemInFolder } from '../services/launcher';
import { resolveAppIcon, getMonogram, getSoftSlateGradient, getKnownCoverUrl } from '../services/artwork';

interface AppCardProps {
  item: GameItem;
  viewMode: ViewMode;
}

export const AppCard: React.FC<AppCardProps> = ({ item, viewMode }) => {
  const {
    settings,
    toggleFavorite,
    toggleHide,
    deleteGame,
    setEditingGame,
    executeLaunch,
    activeLaunch,
  } = useGameStore();

  const isDark = settings.themeMode === 'dark';
  const [imageError, setImageError] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(item.iconUrl || null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isCurrentLaunching = activeLaunch?.item.id === item.id;
  const isRunning = isCurrentLaunching && activeLaunch?.step === 'running';

  // Auto-resolve native icon for apps without cover art
  useEffect(() => {
    if (item.iconUrl) {
      setIconUrl(item.iconUrl);
    } else if (!item.coverUrl && !iconUrl && item.executablePath) {
      resolveAppIcon(item.executablePath).then((resolved) => {
        if (resolved) setIconUrl(resolved);
      });
    }
  }, [item.coverUrl, item.executablePath, item.iconUrl, iconUrl]);

  // Dedicated Play Button Click Handler - ONLY this button launches the game!
  const handlePlayButtonClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection or other card events
    await executeLaunch(item);
  };

  const handleShowInFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    await showItemInFolder(item.executablePath || item.installDir);
  };

  const formatLastPlayed = (timestamp: number | null): string => {
    if (!timestamp) return 'Never launched';
    const diffMs = Date.now() - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const isSquare = viewMode === 'grid-square';
  const effectiveCover = item.coverUrl || getKnownCoverUrl(item.title);
  const hasCover = !imageError && Boolean(effectiveCover);

  return (
    <motion.div
      layout
      whileHover={{ y: -3, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`group relative flex flex-col rounded-2xl border transition-colors duration-200 select-none ${
        isDark
          ? 'bg-zinc-900/90 hover:bg-zinc-800/90 border-zinc-800/80 hover:border-zinc-700/80 shadow-xs hover:shadow-lg hover:shadow-black/40'
          : 'bg-white hover:bg-zinc-50 border-zinc-200/80 hover:border-zinc-300/80 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Artwork Container (strictly contains image / icon with rounded top) */}
      <div
        className={`relative w-full rounded-t-2xl overflow-hidden flex items-center justify-center ${
          isSquare ? 'aspect-square' : 'aspect-[2/3]'
        } ${isDark ? 'bg-zinc-950/60' : 'bg-zinc-100'}`}
      >
        {/* Tier 1 & 3: Cover Image */}
        {hasCover ? (
          <img
            src={effectiveCover!}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : iconUrl ? (
          /* Tier 2: Native Executable Icon with Soft Ambient Backdrop */
          <div
            className="w-full h-full flex flex-col items-center justify-center p-6"
            style={{ background: getSoftSlateGradient(item.title, isDark) }}
          >
            <div className="w-16 h-16 rounded-2xl p-2.5 bg-white/10 dark:bg-black/20 backdrop-blur-md shadow-md border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <img src={iconUrl} alt={item.title} className="w-full h-full object-contain" />
            </div>
            <span
              className={`text-xs font-semibold mt-3 text-center line-clamp-2 px-3 ${
                isDark ? 'text-zinc-200' : 'text-zinc-800'
              }`}
            >
              {item.title}
            </span>
          </div>
        ) : (
          /* Tier 4: Notion / Spotify Monogram Card */
          <div
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
            style={{ background: getSoftSlateGradient(item.title, isDark) }}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg tracking-wider shadow-sm border ${
                isDark
                  ? 'bg-zinc-800/80 text-zinc-100 border-zinc-700/60'
                  : 'bg-white/90 text-zinc-800 border-zinc-200'
              }`}
            >
              {getMonogram(item.title)}
            </div>
            <span
              className={`text-xs font-medium mt-3 line-clamp-2 px-2 ${
                isDark ? 'text-zinc-300' : 'text-zinc-700'
              }`}
            >
              {item.title}
            </span>
          </div>
        )}

        {/* Top Badges (Category & Favorite) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span
            className={`px-2 py-0.5 text-[10px] font-medium tracking-wide rounded-full backdrop-blur-md shadow-xs ${
              isDark
                ? 'bg-black/60 text-zinc-300 border border-white/10'
                : 'bg-white/80 text-zinc-700 border border-black/5'
            }`}
          >
            {item.category === 'game' ? 'Game' : 'App'}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className={`p-1.5 rounded-full transition-all pointer-events-auto backdrop-blur-md shadow-xs cursor-pointer ${
              isDark
                ? 'bg-black/60 hover:bg-black/90 text-zinc-400'
                : 'bg-white/80 hover:bg-white text-zinc-500'
            }`}
            title={item.favorite ? 'Remove Favorite' : 'Mark Favorite'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                item.favorite ? 'fill-amber-400 text-amber-400' : 'hover:text-amber-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating 3-Dot Options Button (Positioned on Card Root, above Artwork) */}
      <div className="absolute top-2.5 right-10 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className={`p-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer shadow-sm ${
            isDark ? 'bg-black/60 hover:bg-black text-zinc-300' : 'bg-white/85 hover:bg-white text-zinc-700'
          }`}
          title="Options"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Context Menu - Zero clipping with full click-outside backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className={`absolute top-11 right-2 w-48 rounded-2xl border p-1.5 shadow-2xl z-50 text-xs backdrop-blur-xl ${
                isDark ? 'bg-zinc-900/98 border-zinc-700 text-zinc-200' : 'bg-white/98 border-zinc-200 text-zinc-800'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  setMenuOpen(false);
                  handlePlayButtonClick(e);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left font-medium cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-emerald-500 shrink-0 fill-current" />
                <span>Play</span>
              </button>
              <button
                onClick={handleShowInFolder}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left font-medium cursor-pointer transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>Show in Explorer</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setEditingGame(item);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left font-medium cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Edit Details</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  toggleHide(item.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left font-medium cursor-pointer transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{item.hidden ? 'Unhide' : 'Hide from View'}</span>
              </button>
              {item.isCustom && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    deleteGame(item.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-500 text-left font-medium cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Remove Item</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Card Info Details with Explicit "Play" Button */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
        <div>
          <h3
            className={`text-xs font-semibold leading-snug line-clamp-1 transition-colors ${
              isDark ? 'text-zinc-100 group-hover:text-emerald-400' : 'text-zinc-900 group-hover:text-emerald-600'
            }`}
            title={item.title}
          >
            {item.title}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{formatLastPlayed(item.lastPlayed)}</span>
          </div>
        </div>

        {/* Footer Area: Platform Pill + Prominent "Play" Button */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>{item.playCount || 0}</span>
          </div>

          {/* Dedicated "Play" Button - The ONLY control that launches the game */}
          <button
            onClick={handlePlayButtonClick}
            disabled={isCurrentLaunching && !isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              isRunning
                ? 'bg-emerald-600 text-white'
                : isCurrentLaunching
                ? 'bg-emerald-500/80 text-black animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95'
            }`}
            title={`Play ${item.title}`}
          >
            {isCurrentLaunching && !isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.2" />
            )}
            <span>{isRunning ? 'Running' : isCurrentLaunching ? 'Launching' : 'Play'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

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
import {
  resolveAppIcon,
  getMonogram,
  getSoftSlateGradient,
  getKnownCoverUrl,
  resolveGameCover,
  getSecondaryCoverUrl,
} from '../services/artwork';

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
    updateGame,
    executeLaunch,
    activeLaunch,
    activeMenuId,
    setActiveMenuId,
  } = useGameStore();

  const isDark = settings.themeMode === 'dark';
  const [coverUrl, setCoverUrl] = useState<string | null>(
    item.coverUrl || getKnownCoverUrl(item.title) || null
  );
  const [triedSecondary, setTriedSecondary] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(item.iconUrl || null);
  const isMenuOpen = activeMenuId === item.id;

  const isCurrentLaunching = activeLaunch?.item.id === item.id;
  const isRunning = isCurrentLaunching && activeLaunch?.step === 'running';

  // Synchronize local coverUrl if item prop updates
  useEffect(() => {
    if (item.coverUrl) {
      setCoverUrl(item.coverUrl);
      setImageError(false);
      setTriedSecondary(false);
    }
  }, [item.coverUrl]);

  // Universal dynamic cover resolver for any game lacking cover art
  useEffect(() => {
    let active = true;
    if (!coverUrl && item.category === 'game') {
      resolveGameCover(item.title, item.installDir).then((resolved) => {
        if (active && resolved) {
          setCoverUrl(resolved);
          setImageError(false);
          updateGame(item.id, { coverUrl: resolved });
        }
      });
    }
    return () => {
      active = false;
    };
  }, [coverUrl, item.id, item.title, item.installDir, item.category, updateGame]);

  // Auto-resolve native icon for apps without icon or cover art
  useEffect(() => {
    let active = true;
    if (item.iconUrl) {
      setIconUrl(item.iconUrl);
    } else if (!iconUrl && item.executablePath) {
      resolveAppIcon(item.executablePath).then((resolved) => {
        if (active && resolved) {
          setIconUrl(resolved);
          if (!item.iconUrl) {
            updateGame(item.id, { iconUrl: resolved });
          }
        }
      });
    }
    return () => {
      active = false;
    };
  }, [item.id, item.iconUrl, item.executablePath, iconUrl, updateGame]);

  const handleImageError = () => {
    if (coverUrl && !triedSecondary) {
      const secondary = getSecondaryCoverUrl(coverUrl);
      if (secondary && secondary !== coverUrl) {
        setTriedSecondary(true);
        setCoverUrl(secondary);
        return;
      }
    }
    setImageError(true);
  };

  // Dedicated Play Button Click Handler - ONLY this button launches the game!
  const handlePlayButtonClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection or other card events
    setActiveMenuId(null);
    await executeLaunch(item);
  };

  const handleShowInFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
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
  const hasCover = !imageError && Boolean(coverUrl);

  return (
    <motion.div
      layout
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-300 ${
        isMenuOpen ? 'z-40 ring-2 ring-accent/50 shadow-2xl' : 'hover:z-20'
      } bg-surface hover:bg-surface-hover border-subtle hover:border-accent/40 shadow-xs hover:shadow-2xl`}
    >
      {/* Artwork Container (strictly contains image / icon with rounded top) */}
      <div
        className={`relative w-full rounded-t-2xl overflow-hidden flex items-center justify-center ${
          isSquare ? 'aspect-square' : 'aspect-[2/3]'
        } bg-base/60`}
      >
        {/* Tier 1 & 3: Cover Image with Smooth Hover Zoom */}
        {hasCover ? (
          <img
            src={coverUrl!}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108 group-hover:brightness-105"
            onError={handleImageError}
            loading="lazy"
          />
        ) : iconUrl ? (
          /* Tier 2: Native Executable Icon with Soft Ambient Backdrop */
          <div
            className="w-full h-full flex flex-col items-center justify-center p-6 transition-transform duration-500 group-hover:scale-105"
            style={{ background: getSoftSlateGradient(item.title, isDark) }}
          >
            <div className="w-16 h-16 rounded-2xl p-2.5 bg-white/10 dark:bg-black/20 backdrop-blur-md shadow-md border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-115 group-hover:shadow-lg">
              <img
                src={iconUrl}
                alt={item.title}
                className="w-full h-full object-contain"
                onError={() => setIconUrl(null)}
              />
            </div>
            <span className="text-xs font-semibold mt-3 text-center line-clamp-2 px-3 transition-colors text-primary group-hover:text-accent">
              {item.title}
            </span>
          </div>
        ) : (
          /* Tier 4: Notion / Spotify Monogram Card */
          <div
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center transition-transform duration-500 group-hover:scale-105"
            style={{ background: getSoftSlateGradient(item.title, isDark) }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg tracking-wider shadow-sm border border-subtle bg-surface text-primary transition-all duration-300 group-hover:scale-115">
              {getMonogram(item.title)}
            </div>
            <span className="text-xs font-medium mt-3 line-clamp-2 px-2 transition-colors text-muted group-hover:text-accent">
              {item.title}
            </span>
          </div>
        )}

        {/* Ambient Hover Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Badges (Category & Favorite) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide rounded-full backdrop-blur-md shadow-xs transition-transform duration-200 group-hover:scale-105 bg-surface/85 text-primary border border-subtle">
            {item.category === 'game' ? 'Game' : 'App'}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className="p-1.5 rounded-full transition-all duration-200 pointer-events-auto backdrop-blur-md shadow-xs cursor-pointer hover:scale-115 active:scale-90 bg-surface/85 hover:bg-surface text-muted hover:text-primary border border-subtle"
            title={item.favorite ? 'Remove Favorite' : 'Mark Favorite'}
          >
            <Star
              className={`w-3.5 h-3.5 transition-colors ${
                item.favorite ? 'fill-amber-400 text-amber-400' : 'hover:text-amber-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating 3-Dot Options Button */}
      <div className="absolute top-2.5 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(isMenuOpen ? null : item.id);
          }}
          className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-sm hover:scale-110 active:scale-90 border border-subtle ${
            isMenuOpen
              ? 'bg-accent text-accent-fg shadow-md'
              : 'bg-surface/85 hover:bg-surface text-muted hover:text-primary'
          }`}
          title="Options"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Context Menu - Only ONE menu open across app, with click-outside dismissal */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute top-10 right-2 w-44 rounded-2xl border border-subtle bg-surface/98 p-1.5 shadow-2xl z-50 text-xs backdrop-blur-2xl text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  setActiveMenuId(null);
                  handlePlayButtonClick(e);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-hover text-left font-medium cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-accent shrink-0 fill-current" />
                <span>Play</span>
              </button>
              <button
                onClick={handleShowInFolder}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-hover text-left font-medium cursor-pointer transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Show in Explorer</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenuId(null);
                  setEditingGame(item);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-hover text-left font-medium cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>Edit Details</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenuId(null);
                  toggleHide(item.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-hover text-left font-medium cursor-pointer transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{item.hidden ? 'Unhide' : 'Hide from View'}</span>
              </button>
              {item.isCustom && (
                <button
                  onClick={() => {
                    setActiveMenuId(null);
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
            className="text-xs font-semibold leading-snug line-clamp-1 transition-colors text-primary group-hover:text-accent"
            title={item.title}
          >
            {item.title}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] text-muted mt-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{formatLastPlayed(item.lastPlayed)}</span>
          </div>
        </div>

        {/* Footer Area: Platform Pill + Prominent "Play" Button */}
        <div className="flex items-center justify-between pt-2 border-t border-subtle">
          <div className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
            <Flame className="w-3.5 h-3.5 text-accent transition-transform duration-200 group-hover:scale-125" />
            <span>{item.playCount || 0}</span>
          </div>

          {/* Dedicated "Play" Button with Micro-Interaction Reaction */}
          <button
            onClick={handlePlayButtonClick}
            disabled={isCurrentLaunching && !isRunning}
            className={`group/btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer ${
              isRunning
                ? 'bg-accent/80 text-accent-fg'
                : isCurrentLaunching
                ? 'bg-accent/60 text-accent-fg animate-pulse'
                : 'bg-accent hover:bg-accent-hover text-accent-fg hover:scale-105 active:scale-95 hover:shadow-lg'
            }`}
            title={`Play ${item.title}`}
          >
            {isCurrentLaunching && !isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.2 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            )}
            <span>{isRunning ? 'Running' : isCurrentLaunching ? 'Launching' : 'Play'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};


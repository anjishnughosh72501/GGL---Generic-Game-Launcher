import React, { useState, useEffect } from 'react';
import { Play, Star, FolderOpen, Edit2, Clock, Flame, Loader2 } from 'lucide-react';
import { GameItem } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { showItemInFolder } from '../services/launcher';
import { getMonogram, getKnownCoverUrl, resolveAppIcon, resolveGameCover } from '../services/artwork';

const ListThumbnail: React.FC<{ item: GameItem }> = ({ item }) => {
  const [src, setSrc] = useState<string | null>(
    item.iconUrl || item.coverUrl || getKnownCoverUrl(item.title) || null
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    if (item.iconUrl) {
      setSrc(item.iconUrl);
      setHasError(false);
    } else if (item.coverUrl) {
      setSrc(item.coverUrl);
      setHasError(false);
    } else if (item.executablePath) {
      resolveAppIcon(item.executablePath).then((extracted) => {
        if (active && extracted) {
          setSrc(extracted);
          setHasError(false);
        }
      });
    } else if (item.category === 'game') {
      resolveGameCover(item.title, item.installDir).then((cover) => {
        if (active && cover) {
          setSrc(cover);
          setHasError(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [item.iconUrl, item.coverUrl, item.executablePath, item.title, item.installDir, item.category]);

  if (!hasError && src) {
    return (
      <img
        src={src}
        alt=""
        className="w-full h-full object-contain p-0.5"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <span className="text-[10px] font-bold font-mono text-muted">
      {getMonogram(item.title)}
    </span>
  );
};

interface AppListViewProps {
  items: GameItem[];
}

export const AppListView: React.FC<AppListViewProps> = ({ items }) => {
  const { toggleFavorite, executeLaunch, activeLaunch, setEditingGame } = useGameStore();

  const formatLastPlayed = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
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

  return (
    <div className="w-full overflow-x-auto select-none bg-base">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-subtle text-[11px] font-semibold uppercase tracking-wider text-muted bg-surface/40">
            <th className="py-2.5 px-4 font-medium w-8"></th>
            <th className="py-2.5 px-4 font-medium">Name</th>
            <th className="py-2.5 px-4 font-medium">Category</th>
            <th className="py-2.5 px-4 font-medium">Platform</th>
            <th className="py-2.5 px-4 font-medium">Last Launched</th>
            <th className="py-2.5 px-4 font-medium">Launches</th>
            <th className="py-2.5 px-4 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {items.map((item) => {
            const isCurrentLaunching = activeLaunch?.item.id === item.id;
            const isRunning = isCurrentLaunching && activeLaunch?.step === 'running';

            return (
              <tr
                key={item.id}
                className="group transition-all duration-200 hover:bg-surface-hover/70 text-primary"
              >
                {/* Favorite Star */}
                <td className="py-2.5 px-4 w-8">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="text-muted hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        item.favorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                </td>

                {/* Title & Icon */}
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-subtle bg-base">
                      <ListThumbnail item={item} />
                    </div>
                    <div>
                      <div className="font-semibold text-primary">
                        {item.title}
                      </div>
                      {item.tags.length > 0 && (
                        <div className="text-[10px] text-muted flex gap-1 mt-0.5">
                          {item.tags.slice(0, 2).map((t, idx) => (
                            <span key={idx}>#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category Pill */}
                <td className="py-2.5 px-4">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      item.category === 'game'
                        ? 'bg-accent/15 text-accent border border-accent/20'
                        : 'bg-muted/15 text-muted border border-subtle'
                    }`}
                  >
                    {item.category === 'game' ? 'Game' : 'App'}
                  </span>
                </td>

                {/* Platform */}
                <td className="py-2.5 px-4">
                  <span className="text-[11px] uppercase font-mono text-muted">
                    {item.platform}
                  </span>
                </td>

                {/* Last Launched */}
                <td className="py-2.5 px-4 text-muted text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatLastPlayed(item.lastPlayed)}</span>
                  </div>
                </td>

                {/* Play Count */}
                <td className="py-2.5 px-4 text-muted text-[11px]">
                  <div className="flex items-center gap-1 font-mono">
                    <Flame className="w-3 h-3 text-accent" />
                    <span>{item.playCount || 0}</span>
                  </div>
                </td>

                {/* Dedicated Action Button Titled "Play" */}
                <td className="py-2.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGame(item);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-primary transition-colors cursor-pointer"
                      title="Edit Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showItemInFolder(item.executablePath || item.installDir);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-accent transition-colors cursor-pointer"
                      title="Show in Explorer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        executeLaunch(item);
                      }}
                      disabled={isCurrentLaunching && !isRunning}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                        isRunning
                          ? 'bg-accent/80 text-accent-fg'
                          : isCurrentLaunching
                          ? 'bg-accent/60 text-accent-fg animate-pulse'
                          : 'bg-accent hover:bg-accent-hover text-accent-fg active:scale-95'
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

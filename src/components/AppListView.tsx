import React from 'react';
import { Play, Star, FolderOpen, Edit2, Clock, Flame, Loader2 } from 'lucide-react';
import { GameItem } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { showItemInFolder } from '../services/launcher';
import { getMonogram, getKnownCoverUrl } from '../services/artwork';

interface AppListViewProps {
  items: GameItem[];
}

export const AppListView: React.FC<AppListViewProps> = ({ items }) => {
  const { settings, toggleFavorite, executeLaunch, activeLaunch, setEditingGame } = useGameStore();
  const isDark = settings.themeMode === 'dark';

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
    <div className="w-full overflow-x-auto select-none">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr
            className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
              isDark
                ? 'border-zinc-800 text-zinc-500 bg-zinc-950/40'
                : 'border-zinc-200 text-zinc-400 bg-zinc-50/50'
            }`}
          >
            <th className="py-2.5 px-4 font-medium w-8"></th>
            <th className="py-2.5 px-4 font-medium">Name</th>
            <th className="py-2.5 px-4 font-medium">Category</th>
            <th className="py-2.5 px-4 font-medium">Platform</th>
            <th className="py-2.5 px-4 font-medium">Last Launched</th>
            <th className="py-2.5 px-4 font-medium">Launches</th>
            <th className="py-2.5 px-4 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {items.map((item) => {
            const isCurrentLaunching = activeLaunch?.item.id === item.id;
            const isRunning = isCurrentLaunching && activeLaunch?.step === 'running';

            return (
              <tr
                key={item.id}
                className={`group transition-all duration-200 ${
                  isDark ? 'hover:bg-zinc-900/90 text-zinc-200' : 'hover:bg-zinc-100/90 text-zinc-800'
                }`}
              >

                {/* Favorite Star */}
                <td className="py-2.5 px-4 w-8">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
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
                    <div
                      className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border ${
                        isDark ? 'bg-zinc-800 border-zinc-700/60' : 'bg-zinc-100 border-zinc-200'
                      }`}
                    >
                      {item.iconUrl || item.coverUrl || getKnownCoverUrl(item.title) ? (
                        <img
                          src={item.iconUrl || item.coverUrl || getKnownCoverUrl(item.title)!}
                          alt=""
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <span className="text-[10px] font-bold font-mono text-zinc-400">
                          {getMonogram(item.title)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </div>
                      {item.tags.length > 0 && (
                        <div className="text-[10px] text-zinc-400 flex gap-1 mt-0.5">
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
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}
                  >
                    {item.category === 'game' ? 'Game' : 'App'}
                  </span>
                </td>

                {/* Platform */}
                <td className="py-2.5 px-4">
                  <span className="text-[11px] uppercase font-mono text-zinc-400">
                    {item.platform}
                  </span>
                </td>

                {/* Last Launched */}
                <td className="py-2.5 px-4 text-zinc-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatLastPlayed(item.lastPlayed)}</span>
                  </div>
                </td>

                {/* Play Count */}
                <td className="py-2.5 px-4 text-zinc-400 text-[11px]">
                  <div className="flex items-center gap-1 font-mono">
                    <Flame className="w-3 h-3 text-orange-500" />
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
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Edit Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showItemInFolder(item.executablePath || item.installDir);
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-sky-400 transition-colors cursor-pointer"
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

import React from 'react';
import { X, Trophy, Flame, Layers, Clock, CheckCircle2, Gamepad2, LayoutGrid } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const StatsModal: React.FC = () => {
  const { isStatsOpen, setStatsOpen, games, scanSummary, settings } = useGameStore();

  if (!isStatsOpen) return null;
  const isDark = settings.themeMode === 'dark';

  const totalItems = games.length;
  const gameItems = games.filter((g) => g.category === 'game');
  const appItems = games.filter((g) => g.category === 'app');
  const favItems = games.filter((g) => g.favorite);
  const totalLaunches = games.reduce((sum, g) => sum + (g.playCount || 0), 0);

  const topPlayed = [...games]
    .filter((g) => (g.playCount || 0) > 0)
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-semibold">Library Telemetry & Insights</h2>
          </div>
          <button
            onClick={() => setStatsOpen(false)}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold text-zinc-400">Total Items</div>
              <div className="text-2xl font-bold mt-1 font-mono text-zinc-900 dark:text-zinc-100">
                {totalItems}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold text-zinc-400">Total Launches</div>
              <div className="text-2xl font-bold mt-1 font-mono text-emerald-500">
                {totalLaunches}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold text-zinc-400">Games</div>
              <div className="text-2xl font-bold mt-1 font-mono text-amber-500">
                {gameItems.length}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold text-zinc-400">Applications</div>
              <div className="text-2xl font-bold mt-1 font-mono text-sky-500">
                {appItems.length}
              </div>
            </div>
          </div>

          {/* Ratio Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2 text-zinc-400">
              <span>Games ({gameItems.length})</span>
              <span>Applications ({appItems.length})</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex bg-zinc-200 dark:bg-zinc-800">
              <div
                style={{ width: `${(gameItems.length / (totalItems || 1)) * 100}%` }}
                className="bg-amber-500 h-full"
              />
              <div
                style={{ width: `${(appItems.length / (totalItems || 1)) * 100}%` }}
                className="bg-sky-500 h-full"
              />
            </div>
          </div>

          {/* Top Launched Ranking */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2.5 text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              Most Frequently Launched
            </h3>
            {topPlayed.length > 0 ? (
              <div className="space-y-1.5">
                {topPlayed.map((g, idx) => (
                  <div
                    key={g.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-mono font-bold text-zinc-400">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{g.title}</span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-500">
                      {g.playCount} launches
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-400 italic">No launch telemetry recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

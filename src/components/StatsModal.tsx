import React from 'react';
import { X, Trophy, Flame, Layers } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { AppLogo } from './AppLogo';

export const StatsModal: React.FC = () => {
  const { isStatsOpen, setStatsOpen, games } = useGameStore();

  if (!isStatsOpen) return null;

  const totalItems = games.length;
  const gameItems = games.filter((g) => g.category === 'game');
  const appItems = games.filter((g) => g.category === 'app');
  const totalLaunches = games.reduce((sum, g) => sum + (g.playCount || 0), 0);

  const topPlayed = [...games]
    .filter((g) => (g.playCount || 0) > 0)
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl rounded-2xl border border-subtle bg-surface text-primary shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-zinc-200">
              <AppLogo className="w-full h-full" variant="app" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary">GGL Telemetry & Insights</h2>
              <p className="text-[10px] text-muted font-mono">Generic Game Launcher Metrics</p>
            </div>
          </div>
          <button
            onClick={() => setStatsOpen(false)}
            className="p-1 rounded-lg hover:bg-surface-hover text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-subtle bg-base/60">
              <div className="text-[10px] uppercase font-semibold text-muted">Total Items</div>
              <div className="text-2xl font-bold mt-1 font-mono text-primary">
                {totalItems}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-subtle bg-base/60">
              <div className="text-[10px] uppercase font-semibold text-muted">Total Launches</div>
              <div className="text-2xl font-bold mt-1 font-mono text-accent">
                {totalLaunches}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-subtle bg-base/60">
              <div className="text-[10px] uppercase font-semibold text-muted">Games</div>
              <div className="text-2xl font-bold mt-1 font-mono text-accent">
                {gameItems.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-subtle bg-base/60">
              <div className="text-[10px] uppercase font-semibold text-muted">Applications</div>
              <div className="text-2xl font-bold mt-1 font-mono text-muted">
                {appItems.length}
              </div>
            </div>
          </div>

          {/* Ratio Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2 text-muted">
              <span>Games ({gameItems.length})</span>
              <span>Applications ({appItems.length})</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex bg-base border border-subtle">
              <div
                style={{ width: `${(gameItems.length / (totalItems || 1)) * 100}%` }}
                className="bg-accent h-full"
              />
              <div
                style={{ width: `${(appItems.length / (totalItems || 1)) * 100}%` }}
                className="bg-muted h-full opacity-40"
              />
            </div>
          </div>

          {/* Top Launched Ranking */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2.5 text-muted flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-accent" />
              Most Frequently Launched
            </h3>
            {topPlayed.length > 0 ? (
              <div className="space-y-1.5">
                {topPlayed.map((g, idx) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-subtle bg-base/60 text-xs hover:bg-base transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-mono font-bold text-muted">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-primary">{g.title}</span>
                    </div>
                    <span className="font-mono font-semibold text-accent">
                      {g.playCount} launches
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted italic">No launch telemetry recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

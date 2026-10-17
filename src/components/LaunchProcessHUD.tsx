import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Play,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getMonogram } from '../services/artwork';

export const LaunchProcessHUD: React.FC = () => {
  const { activeLaunch, dismissLaunchProcess, settings } = useGameStore();

  if (!activeLaunch) return null;

  const isDark = settings.themeMode === 'dark';
  const { item, step, stepMessage, progress, details } = activeLaunch;
  const isComplete = step === 'running';
  const isError = step === 'error';

  const stepsList = [
    {
      id: 'preparing',
      label: 'Verifying Program & Environment',
      completed: step === 'resolving' || step === 'spawning' || step === 'running',
      current: step === 'preparing',
    },
    {
      id: 'resolving',
      label: item.launchUrl ? 'Resolving Protocol URI Scheme' : 'Allocating Working Directory',
      completed: step === 'spawning' || step === 'running',
      current: step === 'resolving',
    },
    {
      id: 'spawning',
      label: 'Spawning Detached Process Handle',
      completed: step === 'running',
      current: step === 'spawning',
    },
    {
      id: 'running',
      label: isError ? 'Launch Interrupted' : 'Process Running in Windows',
      completed: step === 'running',
      current: step === 'running' || step === 'error',
    },
  ];

  const durationMs = details.completedAt
    ? details.completedAt - details.startedAt
    : Date.now() - details.startedAt;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className={`w-96 rounded-2xl border shadow-2xl p-4.5 backdrop-blur-xl pointer-events-auto overflow-hidden ${
            isDark
              ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-black/60'
              : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-300/60'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border shadow-xs ${
                  isDark ? 'bg-zinc-800 border-zinc-700/60' : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                {item.coverUrl || item.iconUrl ? (
                  <img
                    src={item.coverUrl || item.iconUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold font-mono text-zinc-400">
                    {getMonogram(item.title)}
                  </span>
                )}
              </div>

              <div className="overflow-hidden">
                <div className="text-xs font-bold truncate">{item.title}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span className="capitalize">{step === 'running' ? 'Running' : 'Initializing process'}</span>
                  <span>•</span>
                  <span>{durationMs}ms</span>
                </div>
              </div>
            </div>

            <button
              onClick={dismissLaunchProcess}
              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-3.5">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                isError ? 'bg-red-500' : isComplete ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step-by-Step Progress Checklist */}
          <div className="space-y-2 mb-3">
            {stepsList.map((s, idx) => {
              return (
                <div key={idx} className="flex items-center gap-2.5 text-xs">
                  {s.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : s.current ? (
                    isError ? (
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-sky-500 animate-spin shrink-0" />
                    )
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full border border-dashed flex items-center justify-center shrink-0 ${
                        isDark ? 'border-zinc-700' : 'border-zinc-300'
                      }`}
                    >
                      <div className="w-1 h-1 rounded-full bg-zinc-400" />
                    </div>
                  )}

                  <span
                    className={`text-[11px] font-medium leading-tight ${
                      s.completed
                        ? 'text-zinc-300 dark:text-zinc-200'
                        : s.current
                        ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Technical Info Box */}
          <div
            className={`p-2.5 rounded-xl border text-[10px] font-mono space-y-1 ${
              isError
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : isDark
                ? 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="uppercase text-[9px] font-bold text-zinc-500">Method:</span>
              <span className="text-zinc-300 font-semibold uppercase">{details.method}</span>
            </div>
            <div className="truncate">
              <span className="uppercase text-[9px] font-bold text-zinc-500 mr-1.5">Target:</span>
              <span className="truncate">{details.target}</span>
            </div>
            {details.args && (
              <div className="truncate">
                <span className="uppercase text-[9px] font-bold text-zinc-500 mr-1.5">Args:</span>
                <span className="truncate">{details.args}</span>
              </div>
            )}
            <div className="pt-1 border-t border-zinc-200/40 dark:border-zinc-800/60 text-zinc-300 font-sans text-[11px]">
              {stepMessage}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

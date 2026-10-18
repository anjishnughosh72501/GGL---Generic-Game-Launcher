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
import { AppLogo } from './AppLogo';

export const LaunchProcessHUD: React.FC = () => {
  const { activeLaunch, dismissLaunchProcess } = useGameStore();

  if (!activeLaunch) return null;

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
          className="w-96 rounded-2xl border border-subtle shadow-2xl p-4.5 backdrop-blur-xl pointer-events-auto overflow-hidden bg-surface/95 text-primary"
        >
          {/* Top Tag & Header Bar */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-subtle">
            <div className="flex items-center gap-1.5">
              <AppLogo className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-accent">
                GGL Process Dispatcher
              </span>
            </div>
            <button
              onClick={dismissLaunchProcess}
              className="p-1 rounded-lg hover:bg-surface-hover text-muted hover:text-primary transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-subtle bg-base shadow-xs">
                {item.coverUrl || item.iconUrl ? (
                  <img
                    src={item.coverUrl || item.iconUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold font-mono text-muted">
                    {getMonogram(item.title)}
                  </span>
                )}
              </div>

              <div className="overflow-hidden">
                <div className="text-xs font-bold truncate text-primary">{item.title}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted">
                  <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span className="capitalize">{step === 'running' ? 'Running' : 'Initializing process'}</span>
                  <span>•</span>
                  <span>{durationMs}ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-surface-hover mb-3.5">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                isError ? 'bg-red-500' : isComplete ? 'bg-emerald-500' : 'bg-accent'
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
                      <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
                    )
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-subtle border-dashed flex items-center justify-center shrink-0">
                      <div className="w-1 h-1 rounded-full bg-muted" />
                    </div>
                  )}

                  <span
                    className={`text-[11px] leading-tight ${
                      s.completed
                        ? 'text-primary font-medium'
                        : s.current
                        ? 'text-accent font-semibold'
                        : 'text-muted'
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
                : 'bg-base/80 border-subtle text-muted'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="uppercase text-[9px] font-bold text-muted">Method:</span>
              <span className="text-primary font-semibold uppercase">{details.method}</span>
            </div>
            <div className="truncate">
              <span className="uppercase text-[9px] font-bold text-muted mr-1.5">Target:</span>
              <span className="truncate text-primary">{details.target}</span>
            </div>
            {details.args && (
              <div className="truncate">
                <span className="uppercase text-[9px] font-bold text-muted mr-1.5">Args:</span>
                <span className="truncate text-primary">{details.args}</span>
              </div>
            )}
            <div className="pt-1 border-t border-subtle text-primary font-sans text-[11px]">
              {stepMessage}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

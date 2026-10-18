import React from 'react';
import { useGameStore } from '../store/gameStore';
import { resolveEffectiveMode } from '../styles/themes';

interface AppLogoProps {
  className?: string;
  variant?: 'auto' | 'white' | 'dark';
  alt?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-6 h-6',
  variant = 'auto',
  alt = 'GGL Logo',
}) => {
  const { settings } = useGameStore();
  const isDark = resolveEffectiveMode(settings.themeMode) === 'dark';

  const src =
    variant === 'white'
      ? '/logo-white.png'
      : variant === 'dark'
      ? '/logo-dark.png'
      : isDark
      ? '/logo-white.png'
      : '/logo-dark.png';

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none pointer-events-none shrink-0 ${className}`}
      draggable={false}
    />
  );
};

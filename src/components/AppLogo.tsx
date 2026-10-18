import React from 'react';
import { useGameStore } from '../store/gameStore';
import { resolveEffectiveMode } from '../styles/themes';
import logoApp from '../assets/logo.png';
import logoDark from '../assets/logo-dark.png';
import logoWhite from '../assets/logo-white.png';

interface AppLogoProps {
  className?: string;
  variant?: 'auto' | 'white' | 'dark' | 'app';
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
    variant === 'app'
      ? logoApp
      : variant === 'white'
      ? logoWhite
      : variant === 'dark'
      ? logoDark
      : isDark
      ? logoWhite
      : logoDark;

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none pointer-events-none shrink-0 ${className}`}
      draggable={false}
    />
  );
};

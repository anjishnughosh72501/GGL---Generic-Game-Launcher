export interface ThemeTokens {
  '--bg-base': string;
  '--bg-surface': string;
  '--bg-surface-hover': string;
  '--border-subtle': string;
  '--text-primary': string;
  '--text-muted': string;
  '--accent': string;
  '--accent-hover': string;
  '--accent-fg': string;
}

export type ThemePalette = 'zinc' | 'spotify' | 'notion' | 'oneui' | 'glacier';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeDefinition {
  id: ThemePalette;
  name: string;
  styleLabel: string;
  swatch: string;
  dark: ThemeTokens;
  light: ThemeTokens;
}

export const THEMES: Record<ThemePalette, ThemeDefinition> = {
  zinc: {
    id: 'zinc',
    name: 'Studio Zinc',
    styleLabel: 'Apple / Linear',
    swatch: '#3B82F6',
    dark: {
      '--bg-base': '#09090B',
      '--bg-surface': '#18181B',
      '--bg-surface-hover': '#27272A',
      '--border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--text-primary': '#FAFAFA',
      '--text-muted': '#A1A1AA',
      '--accent': '#3B82F6',
      '--accent-hover': '#2563EB',
      '--accent-fg': '#FFFFFF',
    },
    light: {
      '--bg-base': '#FAFAFA',
      '--bg-surface': '#FFFFFF',
      '--bg-surface-hover': '#F4F4F5',
      '--border-subtle': 'rgba(0, 0, 0, 0.06)',
      '--text-primary': '#09090B',
      '--text-muted': '#71717A',
      '--accent': '#09090B',
      '--accent-hover': '#27272A',
      '--accent-fg': '#FFFFFF',
    },
  },
  spotify: {
    id: 'spotify',
    name: 'Atmospheric Dark',
    styleLabel: 'Spotify Green',
    swatch: '#1ED760',
    dark: {
      '--bg-base': '#121212',
      '--bg-surface': '#1E1E1E',
      '--bg-surface-hover': '#282828',
      '--border-subtle': 'rgba(255, 255, 255, 0.06)',
      '--text-primary': '#FFFFFF',
      '--text-muted': '#B3B3B3',
      '--accent': '#1ED760',
      '--accent-hover': '#1DB954',
      '--accent-fg': '#000000',
    },
    light: {
      '--bg-base': '#F8F9FA',
      '--bg-surface': '#FFFFFF',
      '--bg-surface-hover': '#E9ECEF',
      '--border-subtle': '#E9ECEF',
      '--text-primary': '#121212',
      '--text-muted': '#6C757D',
      '--accent': '#059669',
      '--accent-hover': '#047857',
      '--accent-fg': '#FFFFFF',
    },
  },
  notion: {
    id: 'notion',
    name: 'Warm Paper',
    styleLabel: 'Notion Warmth',
    swatch: '#E09F3E',
    dark: {
      '--bg-base': '#191919',
      '--bg-surface': '#202020',
      '--bg-surface-hover': '#2B2B2B',
      '--border-subtle': 'rgba(255, 255, 255, 0.07)',
      '--text-primary': '#EAEAEA',
      '--text-muted': '#999999',
      '--accent': '#E09F3E',
      '--accent-hover': '#C47D1A',
      '--accent-fg': '#000000',
    },
    light: {
      '--bg-base': '#FBFBFA',
      '--bg-surface': '#FFFFFF',
      '--bg-surface-hover': '#F1F1EF',
      '--border-subtle': '#ECECEE',
      '--text-primary': '#222222',
      '--text-muted': '#787774',
      '--accent': '#C47D1A',
      '--accent-hover': '#A06213',
      '--accent-fg': '#FFFFFF',
    },
  },
  oneui: {
    id: 'oneui',
    name: 'Fluid Indigo',
    styleLabel: 'Samsung One UI',
    swatch: '#6366F1',
    dark: {
      '--bg-base': '#0E0F14',
      '--bg-surface': '#161722',
      '--bg-surface-hover': '#1E202F',
      '--border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--text-primary': '#F1F2F6',
      '--text-muted': '#8A8FA3',
      '--accent': '#6366F1',
      '--accent-hover': '#4F46E5',
      '--accent-fg': '#FFFFFF',
    },
    light: {
      '--bg-base': '#F5F6FA',
      '--bg-surface': '#FFFFFF',
      '--bg-surface-hover': '#EDEFF6',
      '--border-subtle': '#E5E7EB',
      '--text-primary': '#111827',
      '--text-muted': '#6B7280',
      '--accent': '#4F46E5',
      '--accent-hover': '#4338CA',
      '--accent-fg': '#FFFFFF',
    },
  },
  glacier: {
    id: 'glacier',
    name: 'Frosted Glacier',
    styleLabel: 'macOS Sequoia',
    swatch: '#38BDF8',
    dark: {
      '--bg-base': '#0B0F14',
      '--bg-surface': 'rgba(255, 255, 255, 0.04)',
      '--bg-surface-hover': 'rgba(255, 255, 255, 0.08)',
      '--border-subtle': 'rgba(255, 255, 255, 0.12)',
      '--text-primary': '#F0F9FF',
      '--text-muted': '#94A3B8',
      '--accent': '#38BDF8',
      '--accent-hover': '#0EA5E9',
      '--accent-fg': '#0B0F14',
    },
    light: {
      '--bg-base': '#F0F4F8',
      '--bg-surface': 'rgba(255, 255, 255, 0.75)',
      '--bg-surface-hover': 'rgba(255, 255, 255, 0.9)',
      '--border-subtle': 'rgba(0, 0, 0, 0.08)',
      '--text-primary': '#0F172A',
      '--text-muted': '#64748B',
      '--accent': '#0284C7',
      '--accent-hover': '#0369A1',
      '--accent-fg': '#FFFFFF',
    },
  },
};

/**
 * Resolves effective mode based on user preference and system scheme
 */
export function resolveEffectiveMode(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return mode;
}

/**
 * Injects CSS variables onto document.documentElement without layout reload
 */
export function applyThemeTokens(palette: ThemePalette, mode: ThemeMode): 'dark' | 'light' {
  const effectiveMode = resolveEffectiveMode(mode);
  const themeDef = THEMES[palette] || THEMES.zinc;
  const tokens = themeDef[effectiveMode];

  const root = document.documentElement;

  // Set semantic CSS variable tokens
  Object.entries(tokens).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  // Toggle .dark class for Tailwind dark variant compatibility
  if (effectiveMode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  return effectiveMode;
}

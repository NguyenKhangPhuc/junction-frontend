/**
 * Design Tokens - KoJaPu News
 * Single source of truth for colors, typography, spacing, and styling tokens.
 * Enforced by redesign-skill rules: no hardcoded colors in component files.
 */

export const colors = {
  primary: {
    DEFAULT: '#29ecdb',
    hover: '#1cd6c5',
    active: '#14bdae',
    subtle: 'rgba(41, 236, 219, 0.12)',
    border: 'rgba(41, 236, 219, 0.3)',
    glow: '0 0 16px rgba(41, 236, 219, 0.35)',
  },
  neutral: {
    bg: '#ffffff',
    surface: '#ffffff',
    surfaceSubtle: '#f8fafc',
    border: '#e2e8f0',
    borderSubtle: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
  },
  dark: {
    bg: '#090d16',
    surface: '#0f172a',
    surfaceSubtle: '#1e293b',
    border: '#1e293b',
    borderSubtle: '#334155',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
  },
  accent: {
    live: '#ef4444',
    badge: '#29ecdb',
  },
} as const;

export const typography = {
  logo: {
    fontFamily: 'var(--font-sans)',
    size: 'text-2xl sm:text-3xl',
    weight: 'font-extrabold',
    tracking: 'tracking-tight',
  },
  navLink: {
    desktop: 'text-sm font-semibold tracking-wider uppercase',
    mobile: 'text-xs font-medium',
  },
  meta: {
    size: 'text-xs',
    weight: 'font-medium',
    tracking: 'tracking-wide',
  },
} as const;

export const radii = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
} as const;

export const layoutTokens = {
  headerHeight: 'h-auto',
  mobileBottomNavHeight: 'h-16',
  mobilePaddingBottom: 'pb-20 md:pb-0',
} as const;

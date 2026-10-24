/**
 * Design Tokens - Nordic Broadsheet Editorial System (Pohjola Post / KoJaPu)
 * Single source of truth for colors, typography scale, spacing tokens, and radii.
 * Enforced by redesign-skill rules: No hardcoded colors in component files.
 */

export const colors = {
  primary: {
    DEFAULT: '#000000',
    on: '#ffffff',
    container: '#1c1b1b',
    onContainer: '#858383',
  },
  secondary: {
    DEFAULT: '#5e5e5e',
    on: '#ffffff',
    container: '#e2e2e2',
    onContainer: '#646464',
  },
  surface: {
    DEFAULT: '#f9f9f9',
    bright: '#f9f9f9',
    dim: '#dadada',
    containerLowest: '#ffffff',
    containerLow: '#f3f3f3',
    container: '#eeeeee',
    containerHigh: '#e8e8e8',
    containerHighest: '#e2e2e2',
  },
  onSurface: {
    DEFAULT: '#1a1c1c',
    variant: '#444748',
    muted: '#747878',
  },
  outline: {
    DEFAULT: '#747878',
    variant: '#c4c7c7',
  },
  background: {
    DEFAULT: '#f9f9f9',
    on: '#1a1c1c',
  },
  status: {
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    live: '#000000',
    pulse: '#000000',
  },
} as const;

export const spacingTokens = {
  gutter: '1.5rem',       // 24px
  gutterMobile: '1rem',   // 16px
  margin: '3rem',         // 48px
  marginMobile: '1.25rem',// 20px
  xs: '0.25rem',          // 4px
  sm: '0.5rem',           // 8px
  md: '1rem',             // 16px
  lg: '1.5rem',           // 24px
  xl: '2.5rem',           // 40px
} as const;

export const typography = {
  headline: {
    displayHero: 'font-headline text-[36px] md:text-[56px] leading-[42px] md:leading-[64px] tracking-tight font-normal',
    xl: 'font-headline text-[28px] md:text-[40px] leading-[34px] md:leading-[48px] tracking-tight font-normal',
    lg: 'font-headline text-[32px] leading-[38px] tracking-tight font-normal',
    md: 'font-headline text-[24px] leading-[30px] tracking-tight font-medium',
    sm: 'font-headline text-[19px] leading-[26px] tracking-tight font-medium',
  },
  body: {
    lead: 'font-headline text-[20px] leading-[32px] tracking-normal font-normal',
    md: 'font-body text-[16px] leading-[26px] tracking-normal font-normal',
    sm: 'font-body text-[14px] leading-[22px] tracking-normal font-normal',
  },
  label: {
    lg: 'font-body text-[13px] leading-[18px] tracking-wider uppercase font-semibold',
    md: 'font-body text-[11px] leading-[16px] tracking-widest uppercase font-semibold',
  },
  caption: 'font-body text-[12px] leading-[18px] tracking-normal font-normal',
} as const;

export const radii = {
  default: 'rounded',     // 0.25rem
  lg: 'rounded-lg',       // 0.5rem
  xl: 'rounded-xl',       // 0.75rem
  '2xl': 'rounded-2xl',   // 1rem
  full: 'rounded-full',   // 9999px
} as const;

export const layoutTokens = {
  headerHeight: 'h-20',
  maxWidth: 'max-w-[1440px]',
  mobileBottomNavHeight: 'h-16',
  mobilePaddingBottom: 'pb-20 md:pb-0',
} as const;

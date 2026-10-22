export const colors = {
  bg: '#0B0F1A',
  surface: '#141A2B',
  surfaceElevated: '#1C2440',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.04)',

  primary: '#7C5CFF', // Violet
  primaryLight: '#9A82FF',
  primaryGlow: 'rgba(124, 92, 255, 0.35)',

  accent: '#2EE6A6', // Mint (repaid / positive)
  accentLight: '#63F5C3',
  accentGlow: 'rgba(46, 230, 166, 0.25)',

  danger: '#FF5C7A', // Coral (overdue)
  dangerLight: '#FF8A5C',
  dangerGlow: 'rgba(255, 92, 122, 0.35)',

  warning: '#FFB547', // Amber (due soon <= 3 days)
  warningGlow: 'rgba(255, 181, 71, 0.25)',

  text: '#F2F5FF',
  textMuted: '#8A93B2',
  textDim: '#5A627D',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 20,
  card: 24,
  lg: 28,
  full: 9999,
} as const;

export const shadows = {
  glowPrimary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  glowDanger: {
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  glowAccent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

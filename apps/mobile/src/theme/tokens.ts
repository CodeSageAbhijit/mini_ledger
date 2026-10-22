export const colors = {
  bg: '#F6F8FA', // Apple Music light background canvas
  surface: '#FFFFFF', // Pure white liquid cards
  surfaceElevated: '#FFFFFF',
  surfaceBorder: 'rgba(0, 0, 0, 0.06)', // Razor-thin iOS hairline border
  surfaceHighlight: 'rgba(255, 255, 255, 0.95)',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)', // Frosted acrylic glass

  primary: '#FA233B', // Signature Apple Music Crimson/Pink
  primaryLight: '#FF4D62',
  primaryGlow: 'rgba(250, 35, 59, 0.25)',
  primarySoft: 'rgba(250, 35, 59, 0.08)',

  accent: '#34C759', // Apple iOS Green (repaid / positive)
  accentLight: '#30D158',
  accentGlow: 'rgba(52, 199, 89, 0.22)',
  accentSoft: 'rgba(52, 199, 89, 0.10)',

  danger: '#FF3B30', // Apple iOS Red (overdue)
  dangerLight: '#FF6961',
  dangerGlow: 'rgba(255, 59, 48, 0.24)',
  dangerSoft: 'rgba(255, 59, 48, 0.08)',

  warning: '#FF9500', // Apple Amber
  warningGlow: 'rgba(255, 149, 0, 0.20)',
  warningSoft: 'rgba(255, 149, 0, 0.10)',

  text: '#1C1C1E', // Apple SF Pro near-black label
  textMuted: '#8E8E93', // iOS secondary label
  textDim: '#C7C7CC', // iOS tertiary separator/placeholder

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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 5,
  },
  glowDanger: {
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 4,
  },
  glowAccent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  card: {
    shadowColor: '#1A2035',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
} as const;

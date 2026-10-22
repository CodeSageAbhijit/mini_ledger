import { TextStyle } from 'react-native';

export const typography = {
  fontFamily: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  sizes: {
    hero: 34,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 15,
    caption: 13,
    small: 11,
  },
} as const;

export const textStyles: Record<string, TextStyle> = {
  hero: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes.hero,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  h1: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.h1,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.h2,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.h3,
    lineHeight: 24,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    lineHeight: 22,
  },
  caption: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
  },
  tabularAmount: {
    fontFamily: typography.fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
};

import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { snappySpring } from '../../theme/motion';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
  badgeColor?: string;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onPress,
  count,
  badgeColor,
  style,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, snappySpring);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, snappySpring);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        selected && shadows.glowPrimary,
        style,
        animatedStyle,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {count !== undefined ? (
        <Animated.View
          style={[
            styles.badge,
            selected && styles.badgeSelected,
            badgeColor ? { backgroundColor: badgeColor } : null,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              badgeColor ? { color: colors.white } : selected ? styles.badgeTextSelected : null,
            ]}
          >
            {count}
          </Text>
        </Animated.View>
      ) : null}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  label: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.text,
    fontWeight: '700',
  },
  badge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    ...textStyles.small,
    color: colors.textMuted,
    fontWeight: '700',
  },
  badgeTextSelected: {
    color: colors.text,
  },
});

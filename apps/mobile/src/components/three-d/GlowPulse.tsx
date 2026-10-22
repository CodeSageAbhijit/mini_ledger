import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface GlowPulseProps {
  color?: string;
  style?: ViewStyle;
}

export const GlowPulse: React.FC<GlowPulseProps> = ({
  color = colors.danger,
  style,
}) => {
  const opacity = useSharedValue(0.2);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.3;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1200 }),
        withTiming(0.15, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          borderColor: color,
          shadowColor: color,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
});

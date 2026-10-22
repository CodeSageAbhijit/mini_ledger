import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ConfettiProps {
  count?: number;
}

const PARTICLE_COLORS = [colors.accent, '#FFD700', colors.primaryLight, '#FF5C7A', '#FFFFFF'];

export const Confetti: React.FC<ConfettiProps> = ({ count = 28 }) => {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
};

const Particle: React.FC<{ index: number }> = ({ index }) => {
  const progress = useSharedValue(0);

  // Random angle, distance, size, and spin
  const angle = (index * (360 / 28) + (index % 3) * 15) * (Math.PI / 180);
  const distance = 80 + (index % 5) * 35;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance + 50; // gravity pull downward
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
  const size = 6 + (index % 4) * 2;

  useEffect(() => {
    progress.value = withDelay(
      (index % 4) * 30,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: 1 - p * 0.9,
      transform: [
        { translateX: targetX * p },
        { translateY: targetY * p },
        { rotate: `${p * 540}deg` },
        { scale: 1 - p * 0.4 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size * 1.5,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderRadius: 2,
  },
});

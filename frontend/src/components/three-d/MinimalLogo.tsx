import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface MinimalLogoProps {
  size?: number;
}

const AnimatedView = Animated.View;

export const MinimalLogo: React.FC<MinimalLogoProps> = ({ size = 96 }) => {
  const floatY = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    // Gentle float
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Subtle shimmer pulse on the ring
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [reducedMotion, floatY, shimmer]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.15, 0.4]),
    transform: [{ scale: interpolate(shimmer.value, [0, 1], [0.85, 1.1]) }],
  }));

  const halfSize = size / 2;
  const strokeWidth = size * 0.03;

  return (
    <View style={[styles.wrapper, { width: size * 1.4, height: size * 1.4 }]}>
      {/* Ambient glow behind logo */}
      <AnimatedView
        style={[
          styles.glow,
          {
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: size * 0.55,
          },
          glowStyle,
        ]}
      />

      <AnimatedView style={floatStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FA233B" />
              <Stop offset="50%" stopColor="#FF4D62" />
              <Stop offset="100%" stopColor="#FA233B" />
            </LinearGradient>
            <LinearGradient id="symbolGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#1C1C1E" />
              <Stop offset="100%" stopColor="#3A3A3C" />
            </LinearGradient>
          </Defs>

          {/* Minimal ledger mark */}
          <Circle
            cx={halfSize}
            cy={halfSize}
            r={halfSize - strokeWidth * 2}
            stroke="url(#ringGrad)"
            strokeWidth={strokeWidth * 1.5}
            fill="#FFFFFF"
          />

          <Rect x={size * 0.27} y={size * 0.32} width={size * 0.46} height={size * 0.1} rx={size * 0.05} fill="url(#symbolGrad)" />
          <Rect x={size * 0.27} y={size * 0.47} width={size * 0.32} height={size * 0.1} rx={size * 0.05} fill="url(#symbolGrad)" />
          <Circle cx={size * 0.72} cy={size * 0.52} r={size * 0.07} fill="#FA233B" />
        </Svg>
      </AnimatedView>

      {/* Floor shadow */}
      <AnimatedView
        style={[
          styles.shadow,
          {
            width: size * 0.5,
            height: 8,
            bottom: size * 0.08,
          },
          useAnimatedStyle(() => ({
            opacity: interpolate(floatY.value, [-8, 0], [0.08, 0.2]),
            transform: [{ scaleX: interpolate(floatY.value, [-8, 0], [0.8, 1]) }],
          })),
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(250, 35, 59, 0.15)',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 100,
  },
});

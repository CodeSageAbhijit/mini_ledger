import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { radius } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FloatingCoinProps {
  size?: number;
}

export const FloatingCoin: React.FC<FloatingCoinProps> = ({ size = 96 }) => {
  const rotateY = useSharedValue(0);
  const translateY = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    // Smooth continuous 3D rotation
    rotateY.value = withRepeat(
      withTiming(360, { duration: 5000, easing: Easing.linear }),
      -1,
      false,
    );

    // Floating vertical oscillation
    translateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [reducedMotion, rotateY, translateY]);

  const animatedCoinStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateY: translateY.value },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => {
    const shadowScale = 1 - Math.abs(translateY.value) * 0.02;
    return {
      transform: [{ scale: shadowScale }],
      opacity: 0.3 + shadowScale * 0.2,
    };
  });

  return (
    <View style={[styles.wrapper, { width: size * 1.5, height: size * 1.5 }]}>
      {/* 3D Floating Coin */}
      <Animated.View
        style={[
          styles.coin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedCoinStyle,
        ]}
      >
        {/* Coin Inner Rim */}
        <View
          style={[
            styles.coinInner,
            {
              width: size - 16,
              height: size - 16,
              borderRadius: (size - 16) / 2,
            },
          ]}
        >
          <Text style={[styles.symbol, { fontSize: size * 0.44 }]}>₹</Text>
        </View>
      </Animated.View>

      {/* Floating Floor Shadow */}
      <Animated.View
        style={[
          styles.shadow,
          {
            width: size * 0.8,
            height: 12,
            bottom: 4,
          },
          animatedShadowStyle,
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
  coin: {
    backgroundColor: '#FFD700', // Gold
    borderWidth: 4,
    borderColor: '#FFF275',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  coinInner: {
    borderWidth: 2,
    borderColor: '#C69200',
    backgroundColor: '#F5BE00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    ...textStyles.tabularAmount,
    color: '#5C3800',
    fontWeight: '900',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: radius.full,
  },
});

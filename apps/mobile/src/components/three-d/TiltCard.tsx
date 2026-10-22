import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { colors, radius, shadows } from '../../theme/tokens';
import { useTilt } from '../../hooks/useTilt';

interface TiltCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxTiltDeg?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  style,
  maxTiltDeg = 8,
}) => {
  const { tiltX, tiltY } = useTilt(maxTiltDeg);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${-tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const specularStyle = useAnimatedStyle(() => {
    // Dynamic specular highlight reflection across the card based on tilt
    const posX = 50 + tiltY.value * 5;
    const posY = 50 - tiltX.value * 5;
    return {
      opacity: 0.15 + (Math.abs(tiltX.value) + Math.abs(tiltY.value)) * 0.02,
      transform: [
        { translateX: (posX - 50) * 2 },
        { translateY: (posY - 50) * 2 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.card, shadows.card, animatedStyle, style]}>
      {/* Specular light highlight */}
      <Animated.View style={[styles.specular, specularStyle]} pointerEvents="none" />
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  specular: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.card,
  },
});

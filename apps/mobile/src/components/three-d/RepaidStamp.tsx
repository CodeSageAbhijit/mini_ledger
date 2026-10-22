import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { snappySpring } from '../../theme/motion';

interface RepaidStampProps {
  onComplete?: () => void;
}

export const RepaidStamp: React.FC<RepaidStampProps> = ({ onComplete }) => {
  const scale = useSharedValue(2.8);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(-25);

  useEffect(() => {
    // Heavy haptic thud when stamp lands
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    opacity.value = withTiming(1, { duration: 100 });
    scale.value = withSequence(
      withSpring(1, snappySpring),
      withTiming(1, { duration: 800 }, () => {
        if (onComplete) onComplete();
      }),
    );
    rotate.value = withSpring(-12, snappySpring);
  }, [opacity, scale, rotate, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { perspective: 800 },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.stamp, animatedStyle]} pointerEvents="none">
      <Text style={styles.stampText}>PAID IN FULL</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 4,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(46, 230, 166, 0.15)',
    alignSelf: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  stampText: {
    ...textStyles.h2,
    color: colors.accent,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

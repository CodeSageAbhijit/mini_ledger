import React, { useRef, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { snappySpring } from '../../theme/motion';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
  length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  error = false,
  length = 6,
}) => {
  const inputRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);

  // Trigger error shake animation & error haptic when error changes to true
  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [error, shakeX]);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (cleaned.length === length) {
      onComplete?.(cleaned);
    }
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={length}
          style={styles.hiddenInput}
          autoFocus
        />

        {Array.from({ length }).map((_, idx) => {
          const char = value[idx] || '';
          const isFocused = value.length === idx;
          const isFilled = Boolean(char);

          return (
            <OtpBox
              key={idx}
              char={char}
              isFocused={isFocused}
              isFilled={isFilled}
              hasError={error}
            />
          );
        })}
      </Animated.View>
    </Pressable>
  );
};

interface OtpBoxProps {
  char: string;
  isFocused: boolean;
  isFilled: boolean;
  hasError: boolean;
}

const OtpBox: React.FC<OtpBoxProps> = ({ char, isFocused, isFilled, hasError }) => {
  const rotateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (char) {
      // 3D Drop-in flip animation
      rotateX.value = withSequence(
        withTiming(-30, { duration: 50 }),
        withSpring(0, snappySpring),
      );
      scale.value = withSequence(
        withTiming(1.15, { duration: 80 }),
        withSpring(1, snappySpring),
      );
    }
  }, [char, rotateX, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${rotateX.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.box,
        isFocused && styles.boxFocused,
        isFilled && styles.boxFilled,
        hasError && styles.boxError,
        animatedStyle,
      ]}
    >
      <Text style={styles.charText}>{char}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: spacing.md,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    ...shadows.glowPrimary,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  boxError: {
    borderColor: colors.danger,
    ...shadows.glowDanger,
  },
  charText: {
    ...textStyles.h2,
    color: colors.text,
  },
});

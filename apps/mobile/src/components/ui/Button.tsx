import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { snappySpring } from '../../theme/motion';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, snappySpring);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, snappySpring);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
      minHeight: size === 'sm' ? 40 : size === 'lg' ? 56 : 48,
      paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
    };

    if (disabled) {
      return { ...base, backgroundColor: 'rgba(0, 0, 0, 0.06)', opacity: 0.6 };
    }

    switch (variant) {
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.danger,
          ...shadows.glowDanger,
        };
      case 'accent':
        return {
          ...base,
          backgroundColor: colors.accent,
          ...shadows.glowAccent,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: colors.transparent,
        };
      case 'primary':
      default:
        return {
          ...base,
          backgroundColor: colors.primary,
          ...shadows.glowPrimary,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      ...textStyles.bodyMedium,
      fontWeight: '700',
    };

    if (variant === 'accent') {
      return { ...base, color: colors.white };
    }
    if (variant === 'danger') {
      return { ...base, color: colors.white };
    }
    if (variant === 'secondary') {
      return { ...base, color: colors.text };
    }
    if (variant === 'ghost') {
      return { ...base, color: colors.primary };
    }
    return { ...base, color: colors.white };
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[getContainerStyle(), animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' || variant === 'secondary' ? colors.primary : colors.white} />
      ) : (
        <>
          {icon ? <Animated.View style={{ marginRight: spacing.sm }}>{icon}</Animated.View> : null}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
};

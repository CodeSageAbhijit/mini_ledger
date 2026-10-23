import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { colors, radius, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  prefix,
  suffix,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focusedWrapper,
          Boolean(error) && styles.errorWrapper,
        ]}
      >
        {prefix ? <View style={styles.prefixContainer}>{prefix}</View> : null}

        <TextInput
          placeholderTextColor={colors.textDim}
          style={[styles.input, style]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={colors.primaryLight}
          {...rest}
        />

        {suffix ? <View style={styles.suffixContainer}>{suffix}</View> : null}
      </View>

      {error ? (
        <Animated.View entering={FadeInDown.duration(150)} exiting={FadeOutUp.duration(150)}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    minHeight: 52,
    paddingHorizontal: spacing.base,
  },
  focusedWrapper: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  errorWrapper: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  prefixContainer: {
    marginRight: spacing.sm,
  },
  suffixContainer: {
    marginLeft: spacing.sm,
  },
  errorText: {
    ...textStyles.small,
    color: colors.danger,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

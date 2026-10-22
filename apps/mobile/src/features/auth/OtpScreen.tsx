import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { OtpInput } from '../../components/ui/OtpInput';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { extractErrorMessage } from '../../utils/errors';

export const OtpScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const phone = route.params?.phone || '';
  const initialCooldown = route.params?.resendAfterSeconds || 30;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);

  const setSession = useAuthStore((state) => state.setSession);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev: number) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerify = async (otpCode = code) => {
    if (otpCode.length !== 6 || loading) return;

    setError(null);
    setHasError(false);
    setLoading(true);

    try {
      const response = await authApi.verifyOtp({ phone, code: otpCode });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });
    } catch (err) {
      setHasError(true);
      setError(extractErrorMessage(err, 'Invalid or expired verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setHasError(false);
    setLoading(true);

    try {
      const res = await authApi.requestOtp({ phone });
      setCooldown(res.resendAfterSeconds);
      setCode('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to resend verification code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            A 6-digit code has been sent to{' '}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>

          {/* 3D Drop-in Animated OTP Input */}
          <OtpInput
            value={code}
            onChange={(val) => {
              setCode(val);
              if (error) {
                setError(null);
                setHasError(false);
              }
            }}
            onComplete={handleVerify}
            error={hasError}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title="Verify & Continue"
            onPress={() => handleVerify(code)}
            loading={loading}
            disabled={code.length !== 6}
            style={styles.verifyBtn}
          />

          {/* Resend and change phone actions */}
          <View style={styles.footerRow}>
            <Button
              title={
                cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'
              }
              variant="ghost"
              onPress={handleResend}
              disabled={cooldown > 0 || loading}
              size="sm"
            />

            <Button
              title="Change Number"
              variant="ghost"
              onPress={() => navigation.goBack()}
              size="sm"
              textStyle={{ color: colors.textMuted }}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  title: {
    ...textStyles.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  phoneHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
  errorText: {
    ...textStyles.caption,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  verifyBtn: {
    marginTop: spacing.md,
  },
  footerRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { requestOtpSchema, normalizeToE164 } from '@miniledger/shared';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FloatingCoin } from '../../components/three-d/FloatingCoin';
import { colors, radius, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { extractErrorMessage } from '../../utils/errors';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    setError(null);

    const validation = requestOtpSchema.safeParse({ phone });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please enter a valid phone number');
      return;
    }

    const normalizedPhone = normalizeToE164(phone);
    setLoading(true);

    try {
      const res = await authApi.requestOtp({ phone: normalizedPhone });
      navigation.navigate('Otp', {
        phone: normalizedPhone,
        resendAfterSeconds: res.resendAfterSeconds,
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send verification code.'));
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
        {/* 3D Floating Hero */}
        <View style={styles.heroContainer}>
          <FloatingCoin size={100} />
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandSubtitle}>
            Track loans to friends with zero awkwardness
          </Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Log in or Sign up</Text>
          <Text style={styles.cardSubtext}>
            We will send a 6-digit verification code to your phone.
          </Text>

          <Input
            label="Phone Number"
            placeholder="98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(val) => {
              setPhone(val);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            prefix={
              <View style={styles.countryChip}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.countryCode}>+91</Text>
              </View>
            }
          />

          <Button
            title="Send Verification Code"
            onPress={handleRequestOtp}
            loading={loading}
            style={styles.submitBtn}
          />

          <Text style={styles.securityNote}>
            🔒 Secured with HMAC-SHA256 OTP authentication
          </Text>
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
  heroContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandTitle: {
    ...textStyles.hero,
    color: colors.text,
    marginTop: spacing.sm,
  },
  brandSubtitle: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardHeader: {
    ...textStyles.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtext: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.surfaceBorder,
  },
  flag: {
    fontSize: 16,
    marginRight: 4,
  },
  countryCode: {
    ...textStyles.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  securityNote: {
    ...textStyles.small,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.base,
  },
});

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { updateProfileSchema } from '@miniledger/shared';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MinimalLogo } from '../../components/three-d/MinimalLogo';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { extractErrorMessage } from '../../utils/errors';

export const ProfileSetupScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const validation = updateProfileSchema.safeParse({ name, username, email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Please check your details');
      return;
    }

    setLoading(true);
    try {
      const profile = await authApi.updateProfile(validation.data);
      await updateUser(profile);
    } catch (err) {
      setError(extractErrorMessage(err, 'We could not save your details. Please try again.'));
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
        <View style={styles.brand}>
          <MinimalLogo size={64} />
          <Text style={styles.title}>Let&apos;s set up your profile</Text>
          <Text style={styles.subtitle}>This helps us personalize MiniLedger for you.</Text>
        </View>

        <View style={styles.card}>
          <Input label="Your name" placeholder="Aarav Sharma" value={name} onChangeText={setName} />
          <Input
            label="Username"
            placeholder="aarav_sharma"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <Input
            label="Email address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Continue" onPress={handleSubmit} loading={loading} style={styles.button} />
          <Text style={styles.note}>Your phone number is already verified.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  title: { ...textStyles.h2, color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
  subtitle: { ...textStyles.caption, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  error: { ...textStyles.caption, color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
  button: { marginTop: spacing.xs },
  note: { ...textStyles.small, color: colors.textDim, textAlign: 'center', marginTop: spacing.md },
});

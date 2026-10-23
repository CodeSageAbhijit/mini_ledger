import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { createLoanSchema } from '@miniledger/shared';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { colors, radius, shadows, spacing } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { getOffsetIsoDate } from '../../utils/dates';
import { rupeesToPaise, formatLiveRupeeInput } from '../../utils/money';

interface AddLoanSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (loanData: {
    friendName: string;
    amountPaise: number;
    dueDate: string;
    note?: string;
    receipt?: {
      uri: string;
      mimeType: string;
      fileName: string;
    };
  }) => Promise<void>;
  loading?: boolean;
}

export const AddLoanSheet: React.FC<AddLoanSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [friendName, setFriendName] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [dueDate, setDueDate] = useState(getOffsetIsoDate(15)); // Default +15 days
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<{ uri: string; mimeType: string; fileName: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAmountChange = (text: string) => {
    const formatted = formatLiveRupeeInput(text);
    setRawAmount(formatted);
    if (errors.amountPaise) {
      setErrors((prev) => ({ ...prev, amountPaise: '' }));
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      const fileName = asset.fileName || asset.uri.split('/').pop() || 'receipt';
      const declaredMimeType = asset.mimeType?.toLowerCase();
      const extension = fileName.split('?')[0].split('.').pop()?.toLowerCase();
      const mimeType = declaredMimeType === 'image/jpg'
        ? 'image/jpeg'
        : declaredMimeType || (
          extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
          extension === 'png' ? 'image/png' :
          extension === 'webp' ? 'image/webp' :
          undefined
        );

      if (!mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        Alert.alert('Unsupported image', 'Choose a JPEG, PNG, or WebP receipt image.');
        return;
      }

      setReceipt({ uri: asset.uri, mimeType, fileName });
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    const amountPaise = rupeesToPaise(rawAmount);

    const validation = createLoanSchema.safeParse({
      friendName,
      amountPaise,
      dueDate,
      note: note.trim() || undefined,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onSubmit({
      friendName: validation.data.friendName,
      amountPaise: validation.data.amountPaise,
      dueDate: validation.data.dueDate,
      note: validation.data.note,
      receipt: receipt ?? undefined,
    });

    // Reset fields on success
    setFriendName('');
    setRawAmount('');
    setNote('');
    setReceipt(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <Text style={styles.title}>Record Money Lent</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Friend Name */}
            <Input
              label="Friend's Name"
              placeholder="e.g. Rahul Sharma"
              value={friendName}
              onChangeText={(val) => {
                setFriendName(val);
                if (errors.friendName) setErrors((prev) => ({ ...prev, friendName: '' }));
              }}
              error={errors.friendName}
            />

            {/* Rupee Amount with live Indian formatting */}
            <Input
              label="Amount Lent"
              placeholder="0"
              keyboardType="number-pad"
              value={rawAmount}
              onChangeText={handleAmountChange}
              error={errors.amountPaise}
              prefix={<Text style={styles.rupeeSymbol}>₹</Text>}
            />

            {/* Quick Due Date Chips */}
            <Text style={styles.sectionLabel}>Due Date</Text>
            <View style={styles.chipsRow}>
              <Chip
                label="+7 Days"
                selected={dueDate === getOffsetIsoDate(7)}
                onPress={() => setDueDate(getOffsetIsoDate(7))}
              />
              <Chip
                label="+15 Days (Default)"
                selected={dueDate === getOffsetIsoDate(15)}
                onPress={() => setDueDate(getOffsetIsoDate(15))}
              />
              <Chip
                label="+1 Month"
                selected={dueDate === getOffsetIsoDate(30)}
                onPress={() => setDueDate(getOffsetIsoDate(30))}
              />
            </View>

            {/* Custom Due Date Input */}
            <Input
              label="Or enter custom date (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              error={errors.dueDate}
            />

            {/* Optional Note */}
            <Input
              label="Note (Optional)"
              placeholder="e.g. Dinner split, concert tickets"
              value={note}
              onChangeText={setNote}
              error={errors.note}
            />

            {/* Optional Receipt Photo */}
            <Text style={styles.sectionLabel}>Receipt Photo (Optional)</Text>
            {receipt ? (
              <View style={styles.receiptPreviewContainer}>
                <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} />
                <Button
                  title="Remove"
                  variant="ghost"
                  size="sm"
                  onPress={() => setReceipt(null)}
                />
              </View>
            ) : (
              <Button
                title="📎 Attach Photo / Receipt"
                variant="secondary"
                onPress={handlePickImage}
                style={styles.attachBtn}
              />
            )}

            {/* Action Buttons */}
            <Button
              title="Save Entry"
              onPress={handleSubmit}
              loading={loading}
              style={styles.saveBtn}
            />

            <Button
              title="Cancel"
              variant="ghost"
              onPress={onClose}
              style={styles.cancelBtn}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  dragHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#D1D1D6',
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  title: {
    ...textStyles.h2,
    color: colors.text,
    marginBottom: spacing.base,
  },
  rupeeSymbol: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: '700',
    marginRight: 4,
  },
  sectionLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  receiptPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  receiptPreview: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    marginRight: spacing.base,
  },
  attachBtn: {
    marginBottom: spacing.base,
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
  cancelBtn: {
    marginTop: spacing.xs,
  },
});

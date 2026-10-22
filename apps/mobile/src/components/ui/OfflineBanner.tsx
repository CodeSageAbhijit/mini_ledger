import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { useOnline } from '../../hooks/useOnline';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnline();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const height = useSharedValue(0);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      height.value = withTiming(38, { duration: 300 });
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        height.value = withTiming(0, { duration: 300 }, () => {
          setShowReconnected(false);
          setWasOffline(false);
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: height.value > 0 ? 1 : 0,
  }));

  if (isOnline && !showReconnected) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        showReconnected ? styles.reconnected : styles.offline,
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>
        {showReconnected
          ? '✓ Back online · Data synced'
          : '⚡ You are offline · Showing saved data'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  offline: {
    backgroundColor: colors.danger,
  },
  reconnected: {
    backgroundColor: colors.accent,
  },
  text: {
    ...textStyles.caption,
    color: colors.white,
    fontWeight: '700',
  },
});

import { useEffect } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { useReducedMotion } from './useReducedMotion';

export function useTilt(maxTiltDeg = 8) {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      tiltX.value = 0;
      tiltY.value = 0;
      return;
    }

    let isMounted = true;
    DeviceMotion.setUpdateInterval(50); // 20 fps smooth sensor reading

    const subscription = DeviceMotion.addListener((data) => {
      if (!isMounted || !data.rotation) return;

      // gamma is left-to-right tilt in radians; beta is front-to-back tilt in radians
      const gamma = data.rotation.gamma ?? 0;
      const beta = data.rotation.beta ?? 0;

      // Convert to degrees and clamp
      const rawDegX = (beta * 180) / Math.PI;
      const rawDegY = (gamma * 180) / Math.PI;

      const clampedX = Math.max(-maxTiltDeg, Math.min(maxTiltDeg, rawDegX * 0.2));
      const clampedY = Math.max(-maxTiltDeg, Math.min(maxTiltDeg, rawDegY * 0.3));

      tiltX.value = withSpring(clampedX, { damping: 20, stiffness: 120 });
      tiltY.value = withSpring(clampedY, { damping: 20, stiffness: 120 });
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [maxTiltDeg, reducedMotion, tiltX, tiltY]);

  return { tiltX, tiltY };
}

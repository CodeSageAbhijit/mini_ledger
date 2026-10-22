import { WithSpringConfig, WithTimingConfig, Easing } from 'react-native-reanimated';

export const springConfig: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const snappySpring: WithSpringConfig = {
  damping: 18,
  stiffness: 220,
  mass: 0.8,
};

export const gentleSpring: WithSpringConfig = {
  damping: 20,
  stiffness: 100,
  mass: 1.2,
};

export const timingConfig: WithTimingConfig = {
  duration: 250,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

export const slowTiming: WithTimingConfig = {
  duration: 400,
  easing: Easing.out(Easing.exp),
};

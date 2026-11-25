/**
 * Motion helpers built on React Native's Animated — no extra dependency.
 *
 * `useHeartbeat` returns a scale value for a gentle heart pulse; `usePulse`
 * returns a 0→1→0 value for a dot. Both run on the native driver and stop when
 * the component unmounts.
 */
import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** Gentle heartbeat: 1 → 1.12 → 1, then a rest. */
export function useHeartbeat() {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1_200,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [scale]);

  return scale;
}

/** 0 → 1 → 0 loop for a pulsing dot. */
export function usePulse() {
  const [value] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [value]);

  return value;
}

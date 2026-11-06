import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme';

interface AnimatedLoaderProps {
  size?: number;
  color?: string;
}

/** A lightweight branded spinner shared by buttons, lists and session restoration. */
export function AnimatedLoader({ size = 28, color }: AnimatedLoaderProps) {
  const { colors } = useTheme();
  const [rotation] = useState(() => new Animated.Value(0));
  const resolvedColor = color ?? colors.spinner;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const borderWidth = Math.max(2, Math.round(size / 10));
  const dotSize = Math.max(3, size * 0.18);
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: colors.border,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderTopColor: resolvedColor,
            borderRightColor: resolvedColor,
            transform: [{
              rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
            }],
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            left: (size - dotSize) / 2,
            top: (size - dotSize) / 2,
            borderRadius: size,
            backgroundColor: resolvedColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  ring: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  dot: { position: 'absolute' },
});

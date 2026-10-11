import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import Svg, { G, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedGroup = Animated.createAnimatedComponent(G);

const ECG_PATH = 'M0 30 H26 L32 30 L38 14 L46 46 L53 8 L60 38 L64 30 H84';
const HEART_PATH = 'M100 44 C100 44 84 34 84 24 C84 18 88 14 93 14 C96 14 99 16 100 19 C101 16 104 14 107 14 C112 14 116 18 116 24 C116 34 100 44 100 44 Z';
const ECG_PATH_LENGTH = 180.46;

const bannerStyles = StyleSheet.create({
  shadow: {
    marginHorizontal: 6,
    marginBottom: 10,
    borderRadius: 20,
    shadowColor: '#C8102E',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  container: {
    minHeight: 128,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    backgroundColor: '#C8102E',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoBox: {
    width: 84,
    height: 84,
    flexShrink: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 16,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '600',
  },
  message: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 17,
  },
  visual: {
    width: 120,
    flexShrink: 0,
    alignItems: 'center',
  },
  svg: {
    width: '100%',
    height: 56,
  },
  taglineDivider: {
    width: '70%',
    height: 1,
    marginHorizontal: 8,
    marginTop: 6,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default function WelcomeBanner({ username }: { username: string }) {
  const { width: windowWidth } = useWindowDimensions();
  const compactFactor = Math.max(0, Math.min(1, (windowWidth - 360) / 70));
  const horizontalPadding = 12 + (4 * compactFactor);
  const columnGap = 8 + (4 * compactFactor);
  const visualWidth = 90 + (30 * compactFactor);
  const [reduceMotion, setReduceMotion] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;
  const dashLength = Platform.OS === 'web' ? 100 : ECG_PATH_LENGTH;

  const dashOffset = useMemo(
    () => progress.interpolate({
      inputRange: [0, 0.55, 1],
      outputRange: [dashLength, 0, 0],
    }),
    [dashLength, progress],
  );
  const lineOpacity = useMemo(
    () => progress.interpolate({
      inputRange: [0, 0.85, 1],
      outputRange: [1, 1, 0],
    }),
    [progress],
  );
  const heartScale = useMemo(
    () => progress.interpolate({
      inputRange: [0, 0.52, 0.58, 0.64, 0.7, 0.8, 1],
      outputRange: [1, 1, 1.22, 1, 1.22, 1, 1],
    }),
    [progress],
  );

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (active) setReduceMotion(enabled);
    }).catch(() => {
      if (active) setReduceMotion(false);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(0.85);
      return;
    }

    progress.setValue(0);
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, [progress, reduceMotion]);

  return (
    <View style={bannerStyles.shadow}>
      <View
        style={[
          bannerStyles.container,
          { paddingHorizontal: horizontalPadding, gap: columnGap },
        ]}
      >
        <View style={bannerStyles.logoBox}>
          <Image
            source={require('../../../../assets/verification-banner-logo.png')}
            resizeMode="cover"
            accessible
            accessibilityLabel="BloodConnect logo"
            style={bannerStyles.logo}
          />
        </View>
        <View style={bannerStyles.copy}>
          <Text style={bannerStyles.greeting}>Welcome back,</Text>
          <Text style={bannerStyles.username} numberOfLines={1} ellipsizeMode="tail">
            {username}
          </Text>
          <Text style={bannerStyles.message} numberOfLines={2}>
            Helping to save lives,{`\n`}one verification at a time.
          </Text>
        </View>
        <View style={[bannerStyles.visual, { width: visualWidth }]}>
          <Svg
            viewBox="0 0 120 56"
            width="100%"
            height={56}
            style={bannerStyles.svg}
            aria-hidden={true}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <AnimatedPath
              id="ecg-line"
              d={ECG_PATH}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dashLength}
              strokeDashoffset={dashOffset as unknown as number}
              opacity={lineOpacity as unknown as number}
              {...(Platform.OS === 'web' ? { pathLength: 100 } as object : {})}
            />
            <AnimatedGroup
              origin={[100, 29]}
              scaleX={heartScale as unknown as number}
              scaleY={heartScale as unknown as number}
            >
              <Path
                d={HEART_PATH}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </AnimatedGroup>
          </Svg>
          <View style={bannerStyles.taglineDivider} />
          <Text style={bannerStyles.tagline}>Together{`\n`}We Save Lives</Text>
        </View>
      </View>
    </View>
  );
}

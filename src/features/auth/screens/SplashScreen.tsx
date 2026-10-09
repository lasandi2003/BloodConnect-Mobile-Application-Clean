import React from 'react';

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  COLORS,
} from '../../../constants/colors';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../../assets/bloodconnect-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        BloodConnect
      </Text>

      <Text style={styles.tagline}>
        Donate Blood. Save Lives.
      </Text>

      <ActivityIndicator
        size="small"
        color={COLORS.white}
        style={styles.loader}
      />

      <Text style={styles.footer}>
        Connecting donors when every second matters
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 30,
  },

  logoContainer: {
    width: 205,
    height: 205,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 20,
  },

  logo: {
    width: 205,
    height: 205,

    borderRadius: 28,
  },

  title: {
    fontSize: 34,
    fontWeight: '900',

    color: COLORS.white,

    letterSpacing: 0.3,

    textAlign: 'center',
  },

  tagline: {
    marginTop: 9,

    fontSize: 15,
    fontWeight: '500',

    color: '#FBE7E9',

    textAlign: 'center',
  },

  loader: {
    marginTop: 38,
  },

  footer: {
    position: 'absolute',
    bottom: 42,

    fontSize: 11,

    color: '#EFC8CD',

    textAlign: 'center',
  },
});
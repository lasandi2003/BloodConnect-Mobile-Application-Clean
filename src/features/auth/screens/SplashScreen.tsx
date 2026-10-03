import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  COLORS,
} from '../../../constants/colors';

export default function SplashScreen() {
  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.logo
        }
      >
        <Ionicons
          name="water"
          size={78}
          color={
            COLORS.white
          }
        />

        <Ionicons
          name="heart"
          size={40}
          color={
            COLORS.white
          }
          style={
            styles.heart
          }
        />
      </View>

      <Text
        style={
          styles.title
        }
      >
        BloodConnect
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Donate Blood,
        Save Lives
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.primaryDark,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    logo: {
      width: 130,
      height: 130,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    heart: {
      position:
        'absolute',
    },

    title: {
      marginTop: 18,
      color:
        COLORS.white,
      fontSize: 29,
      fontWeight: '800',
    },

    subtitle: {
      marginTop: 7,
      color:
        COLORS.white,
      fontSize: 14,
    },
  });
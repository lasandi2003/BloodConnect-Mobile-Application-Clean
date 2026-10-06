import React from 'react';

import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  COLORS,
} from '../../../constants/colors';

interface Props {
  children:
    React.ReactNode;
}

export default function DonorScreenShell({
  children,
}: Props) {
  return (
    <View
      style={
        styles.page
      }
    >
      <SafeAreaView
        style={
          styles.frame
        }
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    page: {
      flex: 1,

      backgroundColor:
        Platform.OS ===
        'web'
          ? '#EEF1F5'
          : COLORS.background,

      alignItems:
        'center',
    },

    frame: {
      flex: 1,

      width: '100%',

      maxWidth: 460,

      backgroundColor:
        COLORS.background,

      ...Platform.select({
        web: {
          boxShadow:
            '0 0 20px rgba(0,0,0,0.06)',
        },
      }),
    },
  });
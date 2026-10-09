import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  COLORS,
} from '../../../constants/colors';

interface Props {
  value:
    string | number;

  label: string;
}

export default function StatCard({
  value,
  label,
}: Props) {
  return (
    <View
      style={styles.card}
    >
      <Text
        style={
          styles.value
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.label
        }
      >
        {label}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    card: {
      flex: 1,

      minHeight: 66,

      backgroundColor:
        COLORS.white,

      borderRadius: 13,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    value: {
      fontSize: 19,

      fontWeight:
        '900',

      color:
        COLORS.primary,
    },

    label: {
      marginTop: 3,

      fontSize: 10,

      color:
        COLORS.textSecondary,

      textAlign:
        'center',
    },
  });
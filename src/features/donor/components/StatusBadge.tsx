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
  status: string;
}

export default function StatusBadge({
  status,
}: Props) {
  const normalized =
    status.toLowerCase();

  const success =
    normalized ===
      'completed' ||
    normalized ===
      'accepted';

  const warning =
    normalized ===
      'pending' ||
    normalized ===
      'urgent';

  const danger =
    normalized ===
      'declined' ||
    normalized ===
      'withdrawn' ||
    normalized ===
      'critical';

  return (
    <View
      style={[
        styles.badge,

        success &&
          styles.success,

        warning &&
          styles.warning,

        danger &&
          styles.danger,
      ]}
    >
      <Text
        style={[
          styles.text,

          success &&
            styles.successText,

          warning &&
            styles.warningText,

          danger &&
            styles.dangerText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    badge: {
      paddingHorizontal: 9,

      paddingVertical: 4,

      borderRadius: 20,

      backgroundColor:
        '#F0F0F0',
    },

    text: {
      fontSize: 10,

      fontWeight:
        '700',

      textTransform:
        'capitalize',

      color:
        COLORS.textSecondary,
    },

    success: {
      backgroundColor:
        '#E8F7EF',
    },

    successText: {
      color:
        COLORS.success,
    },

    warning: {
      backgroundColor:
        '#FFF4DD',
    },

    warningText: {
      color:
        '#A96800',
    },

    danger: {
      backgroundColor:
        COLORS.primaryLight,
    },

    dangerText: {
      color:
        COLORS.primary,
    },
  });
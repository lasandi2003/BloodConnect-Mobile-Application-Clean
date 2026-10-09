import React from 'react';

import {
  Pressable,
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

import type {
  EmergencyRequest,
} from '../types/donor';

import StatusBadge from './StatusBadge';

interface Props {
  request:
    EmergencyRequest;

  onPress: () => void;
}

export default function RequestCard({
  request,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.card,

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.bloodCircle
        }
      >
        <Text
          style={
            styles.bloodText
          }
        >
          {
            request.bloodGroup
          }
        </Text>
      </View>

      <View
        style={
          styles.content
        }
      >
        <View
          style={
            styles.topRow
          }
        >
          <Text
            numberOfLines={
              1
            }
            style={
              styles.hospital
            }
          >
            {
              request.hospitalName
            }
          </Text>

          <StatusBadge
            status={
              request.urgency
            }
          />
        </View>

        <Text
          style={
            styles.location
          }
          numberOfLines={1}
        >
          {
            request.location
          }
        </Text>

        <View
          style={
            styles.metaRow
          }
        >
          <Ionicons
            name="water-outline"
            size={13}
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.meta
            }
          >
            {
              request.unitsRequired
            }{' '}
            unit
            {request.unitsRequired !==
            1
              ? 's'
              : ''}
          </Text>

          <View
            style={
              styles.dot
            }
          />

          <Text
            style={
              styles.meta
            }
          >
            {
              request.requiredDate
            }
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={
          COLORS.textMuted
        }
      />
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    card: {
      minHeight: 84,

      backgroundColor:
        COLORS.white,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      padding: 13,

      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 10,
    },

    pressed: {
      opacity: 0.8,
    },

    bloodCircle: {
      width: 45,
      height: 45,

      borderRadius:
        23,

      backgroundColor:
        COLORS.primaryLight,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 11,
    },

    bloodText: {
      color:
        COLORS.primary,

      fontWeight:
        '900',

      fontSize: 13,
    },

    content: {
      flex: 1,
    },

    topRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,
    },

    hospital: {
      flex: 1,

      fontSize: 13,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    location: {
      marginTop: 4,

      fontSize: 11,

      color:
        COLORS.textSecondary,
    },

    metaRow: {
      marginTop: 6,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    meta: {
      marginLeft: 3,

      fontSize: 10,

      color:
        COLORS.textMuted,
    },

    dot: {
      width: 3,
      height: 3,

      borderRadius: 2,

      marginHorizontal: 6,

      backgroundColor:
        COLORS.textMuted,
    },
  });
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
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import type {
  DonorStackParamList,
} from '../navigation/types';

import {
  COLORS,
} from '../../../constants/colors';

type Navigation =
  NativeStackNavigationProp<
    DonorStackParamList
  >;

export type DonorTab =
  | 'Home'
  | 'Requests'
  | 'History'
  | 'Profile';

interface Props {
  active: DonorTab;
}

interface NavItem {
  label: DonorTab;

  icon:
    | 'home-outline'
    | 'water-outline'
    | 'time-outline'
    | 'person-outline';

  activeIcon:
    | 'home'
    | 'water'
    | 'time'
    | 'person';

  screen:
    | 'DonorDashboard'
    | 'BloodRequests'
    | 'DonationHistory'
    | 'DonorProfile';
}

const navItems: NavItem[] = [
  {
    label: 'Home',

    icon:
      'home-outline',

    activeIcon:
      'home',

    screen:
      'DonorDashboard',
  },

  {
    label:
      'Requests',

    icon:
      'water-outline',

    activeIcon:
      'water',

    screen:
      'BloodRequests',
  },

  {
    label:
      'History',

    icon:
      'time-outline',

    activeIcon:
      'time',

    screen:
      'DonationHistory',
  },

  {
    label:
      'Profile',

    icon:
      'person-outline',

    activeIcon:
      'person',

    screen:
      'DonorProfile',
  },
];

export default function DonorBottomNav({
  active,
}: Props) {
  const navigation =
    useNavigation<
      Navigation
    >();

  return (
    <View
      style={
        styles.container
      }
    >
      {navItems.map(
        item => {
          const selected =
            active ===
            item.label;

          return (
            <Pressable
              key={
                item.label
              }
              style={
                styles.item
              }
              onPress={() =>
                navigation.navigate(
                  item.screen,
                )
              }
            >
              <Ionicons
                name={
                  selected
                    ? item.activeIcon
                    : item.icon
                }
                size={22}
                color={
                  selected
                    ? COLORS.primary
                    : COLORS.textMuted
                }
              />

              <Text
                style={[
                  styles.label,

                  selected &&
                    styles.activeLabel,
                ]}
              >
                {
                  item.label
                }
              </Text>
            </Pressable>
          );
        },
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      height: 70,

      flexDirection:
        'row',

      backgroundColor:
        COLORS.white,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,
    },

    item: {
      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',

      gap: 3,
    },

    label: {
      fontSize: 10,

      fontWeight:
        '600',

      color:
        COLORS.textMuted,
    },

    activeLabel: {
      color:
        COLORS.primary,
    },
  });
import React, {
  type ComponentProps,
} from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  AuthStackParamList,
} from '../../../navigation/types';

import type {
  RegistrationRole,
} from '../../../types/auth';

import {
  COLORS,
} from '../../../constants/colors';

type Props =
  NativeStackScreenProps<
    AuthStackParamList,
    'RoleSelection'
  >;

type IconName =
  ComponentProps<
    typeof Ionicons
  >['name'];

interface RoleOption {
  role:
    RegistrationRole;

  title: string;

  description: string;

  icon:
    IconName;
}

const roles: RoleOption[] = [
  {
    role: 'donor',
    title: 'Donor',
    description:
      'Donate blood & save lives',
    icon: 'water-outline',
  },

  {
    role: 'requester',
    title:
      'Hospital / Requester',
    description:
      'Request blood for patients',
    icon: 'business-outline',
  },

  {
    role: 'healthcare',
    title:
      'Healthcare Staff',
    description:
      'Verify & manage requests',
    icon: 'medkit-outline',
  },

  {
    role: 'bloodBank',
    title:
      'Blood Bank / Admin',
    description:
      'Manage inventory & logs',
    icon: 'server-outline',
  },
];

export default function RoleSelectionScreen({
  navigation,
  route,
}: Props) {
  function selectRole(
    role:
      RegistrationRole,
  ) {
    navigation.navigate(
      'Register',
      {
        role,
        mode: route.params?.mode ?? 'email',
      },
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >
      <Pressable
        style={
          styles.backButton
        }
        onPress={() =>
          navigation.goBack()
        }
      >
        <Ionicons
          name="chevron-back"
          size={22}
          color={
            COLORS.text
          }
        />
      </Pressable>

      <Text
        style={
          styles.smallHeading
        }
      >
        Select Your Role
      </Text>

      <View
        style={
          styles.headingContainer
        }
      >
        <Text
          style={
            styles.title
          }
        >
          Who are you?
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Select your primary
          role to customize your
          experience on
          BloodConnect.
        </Text>
      </View>

      <View
        style={
          styles.grid
        }
      >
        {roles.map(
          item => (
            <Pressable
              key={
                item.role
              }
              style={
                styles.card
              }
              onPress={() =>
                selectRole(
                  item.role,
                )
              }
            >
              <View
                style={
                  styles.iconCircle
                }
              >
                <Ionicons
                  name={
                    item.icon
                  }
                  size={23}
                  color={
                    item.role ===
                    'donor'
                      ? COLORS.primary
                      : COLORS.text
                  }
                />
              </View>

              <Text
                style={
                  styles.cardTitle
                }
              >
                {item.title}
              </Text>

              <Text
                style={
                  styles.cardDescription
                }
              >
                {
                  item.description
                }
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <Text
        style={
          styles.adminNote
        }
      >
        System administrator
        accounts are created
        separately and cannot be
        self-registered.
      </Text>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor:
        COLORS.softBackground,
      paddingHorizontal: 22,
      paddingTop: 58,
      paddingBottom: 30,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        COLORS.white,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    smallHeading: {
      position:
        'absolute',
      top: 68,
      left: 76,
      color:
        COLORS.text,
      fontWeight: '700',
    },

    headingContainer: {
      marginTop: 68,
      marginBottom: 24,
    },

    title: {
      fontSize: 28,
      fontWeight: '800',
      color:
        COLORS.text,
    },

    subtitle: {
      marginTop: 9,
      maxWidth: 280,
      fontSize: 14,
      lineHeight: 20,
      color:
        COLORS.textSecondary,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'space-between',
      gap: 12,
    },

    card: {
      width: '48%',
      minHeight: 155,
      padding: 15,
      backgroundColor:
        COLORS.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    iconCircle: {
      width: 39,
      height: 39,
      borderRadius: 20,
      backgroundColor:
        '#F5F5F5',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginBottom: 15,
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color:
        COLORS.text,
    },

    cardDescription: {
      marginTop: 5,
      fontSize: 12,
      lineHeight: 17,
      color:
        COLORS.textSecondary,
    },

    adminNote: {
      marginTop: 24,
      textAlign:
        'center',
      color:
        COLORS.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
  });
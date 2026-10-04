import React, {
  type ComponentProps,
  useState,
} from 'react';

import {
  Platform,
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
  role: RegistrationRole;
  title: string;
  description: string;
  icon: IconName;
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
    title: 'Blood Bank',
    description:
      'Manage inventory & logs',
    icon: 'server-outline',
  },
];

export default function RoleSelectionScreen({
  navigation,
}: Props) {
  const [
    hoveredRole,
    setHoveredRole,
  ] = useState<
    RegistrationRole | null
  >(null);

  function selectRole(
    role: RegistrationRole,
  ) {
    navigation.navigate(
      'Register',
      {
        role,
      },
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* Top Header */}
      <View style={styles.topRow}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,

            pressed &&
              styles.backButtonPressed,
          ]}
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={COLORS.text}
          />
        </Pressable>

        <Text
          style={
            styles.smallHeading
          }
        >
          Select Your Role
        </Text>
      </View>

      {/* Main Heading */}
      <View
        style={
          styles.headingContainer
        }
      >
        <Text
          style={styles.title}
        >
          Who are you?
        </Text>

        <Text
          style={styles.subtitle}
        >
          Select your primary
          role to customize your
          experience on
          BloodConnect.
        </Text>
      </View>

      {/* Role Cards */}
      <View style={styles.grid}>
        {roles.map(item => {
          const isHovered =
            hoveredRole ===
            item.role;

          return (
            <Pressable
              key={item.role}
              onPress={() =>
                selectRole(
                  item.role,
                )
              }
              onHoverIn={() =>
                setHoveredRole(
                  item.role,
                )
              }
              onHoverOut={() =>
                setHoveredRole(
                  null,
                )
              }
              style={({ pressed }) => {
                const isActive =
                  isHovered ||
                  pressed;

                return [
                  styles.card,

                  isActive &&
                    styles.cardActive,

                  pressed &&
                    styles.cardPressed,
                ];
              }}
            >
              {({
                pressed,
              }) => {
                const isActive =
                  isHovered ||
                  pressed;

                return (
                  <>
                    {/* Icon */}
                    <View
                      style={[
                        styles.iconCircle,

                        isActive &&
                          styles.iconCircleActive,
                      ]}
                    >
                      <Ionicons
                        name={
                          item.icon
                        }
                        size={22}
                        color={
                          isActive
                            ? COLORS.primary
                            : COLORS.text
                        }
                      />
                    </View>

                    {/* Role Title */}
                    <Text
                      style={[
                        styles.cardTitle,

                        isActive &&
                          styles.cardTitleActive,
                      ]}
                    >
                      {item.title}
                    </Text>

                    {/* Role Description */}
                    <Text
                      style={
                        styles.cardDescription
                      }
                    >
                      {
                        item.description
                      }
                    </Text>
                  </>
                );
              }}
            </Pressable>
          );
        })}
      </View>

      {/* Admin Notice */}
      <View
        style={
          styles.adminInfo
        }
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={17}
          color={
            COLORS.primary
          }
        />

        <Text
          style={
            styles.adminNote
          }
        >
          System administrator
          accounts are created
          separately and cannot
          be self-registered.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,

      backgroundColor:
        COLORS.softBackground,

      paddingHorizontal: 24,
      paddingTop: 55,
      paddingBottom: 40,
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    backButton: {
      width: 42,
      height: 42,

      borderRadius: 21,

      backgroundColor:
        COLORS.white,

      justifyContent:
        'center',

      alignItems:
        'center',

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    backButtonPressed: {
      backgroundColor:
        COLORS.primaryLight,
    },

    smallHeading: {
      marginLeft: 14,

      color:
        COLORS.text,

      fontSize: 15,

      fontWeight: '800',
    },

    headingContainer: {
      marginTop: 66,
      marginBottom: 26,
    },

    title: {
      color:
        COLORS.text,

      fontSize: 30,

      fontWeight: '900',

      letterSpacing: -0.5,
    },

    subtitle: {
      marginTop: 9,

      maxWidth: 290,

      color:
        COLORS.textSecondary,

      fontSize: 14,

      lineHeight: 21,
    },

    grid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      justifyContent:
        'space-between',

      rowGap: 14,
    },

    card: {
      width: '48%',

      minHeight: 172,

      padding: 16,

      borderRadius: 15,

      backgroundColor:
        COLORS.white,

      borderWidth: 1.5,

      borderColor:
        COLORS.border,

      ...Platform.select({
        web: {
          cursor: 'pointer',

          transitionDuration:
            '180ms',

          transitionProperty:
            'border-color, background-color, transform, box-shadow',
        },
      }),
    },

    cardActive: {
      borderColor:
        COLORS.primary,

      backgroundColor:
        '#FFF9F9',

      shadowColor:
        COLORS.primaryDark,

      shadowOpacity: 0.12,

      shadowRadius: 10,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      elevation: 4,

      ...Platform.select({
        web: {
          transform: [
            {
              translateY: -3,
            },
          ],
        },
      }),
    },

    cardPressed: {
      opacity: 0.9,

      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    iconCircle: {
      width: 42,
      height: 42,

      borderRadius: 21,

      backgroundColor:
        '#F5F5F5',

      justifyContent:
        'center',

      alignItems:
        'center',

      marginBottom: 17,
    },

    iconCircleActive: {
      backgroundColor:
        COLORS.primaryLight,
    },

    cardTitle: {
      color:
        COLORS.text,

      fontSize: 16,

      fontWeight: '800',

      lineHeight: 20,

      paddingRight: 8,
    },

    cardTitleActive: {
      color:
        COLORS.primaryDark,
    },

    cardDescription: {
      marginTop: 6,

      color:
        COLORS.textSecondary,

      fontSize: 12,

      lineHeight: 17,
    },

    adminInfo: {
      marginTop: 30,

      flexDirection: 'row',

      alignItems:
        'center',

      paddingHorizontal: 14,

      paddingVertical: 12,

      borderRadius: 12,

      backgroundColor:
        'rgba(255, 255, 255, 0.60)',

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    adminNote: {
      flex: 1,

      marginLeft: 8,

      color:
        COLORS.textSecondary,

      fontSize: 11,

      lineHeight: 17,

      textAlign: 'center',
    },
  });
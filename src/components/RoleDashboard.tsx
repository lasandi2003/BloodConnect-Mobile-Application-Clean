import React, {
  type ComponentProps,
} from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  COLORS,
} from '../constants/colors';

import {
  useAuth,
} from '../features/auth/context/AuthContext';

type IconName =
  ComponentProps<
    typeof Ionicons
  >['name'];

export interface DashboardItem {
  title: string;

  description: string;

  icon:
    IconName;
}

interface Props {
  title: string;

  subtitle: string;

  items:
    DashboardItem[];
}

export default function RoleDashboard({
  title,
  subtitle,
  items,
}: Props) {
  const {
    profile,
    logout,
  } =
    useAuth();

  function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Logout',
          style: 'destructive',
          onPress:
            logout,
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safe
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <View
          style={
            styles.header
          }
        >
          <View>
            <Text
              style={
                styles.welcome
              }
            >
              Welcome back,
            </Text>

            <Text
              style={
                styles.name
              }
            >
              {profile
                ?.fullName ??
                'User'}
            </Text>
          </View>

          <Pressable
            style={
              styles.logoutButton
            }
            onPress={
              handleLogout
            }
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={
                COLORS.primary
              }
            />
          </Pressable>
        </View>

        <View
          style={
            styles.hero
          }
        >
          <Text
            style={
              styles.title
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {subtitle}
          </Text>
        </View>

        <View
          style={
            styles.grid
          }
        >
          {items.map(
            item => (
              <View
                key={
                  item.title
                }
                style={
                  styles.card
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
                    size={25}
                    color={
                      COLORS.primary
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
              </View>
            ),
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        '#FAFAFA',
    },

    container: {
      padding: 20,
      paddingBottom: 40,
    },

    header: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 24,
    },

    welcome: {
      fontSize: 13,
      color:
        COLORS.textSecondary,
    },

    name: {
      marginTop: 3,
      fontSize: 22,
      fontWeight: '800',
      color:
        COLORS.text,
    },

    logoutButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.white,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    hero: {
      padding: 21,
      borderRadius: 16,
      backgroundColor:
        COLORS.primary,
      marginBottom: 24,
    },

    title: {
      fontSize: 23,
      fontWeight: '800',
      color:
        COLORS.white,
    },

    subtitle: {
      marginTop: 7,
      fontSize: 13,
      lineHeight: 19,
      color:
        '#FFEAEA',
    },

    grid: {
      gap: 12,
    },

    card: {
      padding: 18,
      backgroundColor:
        COLORS.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        '#FFF0F0',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginBottom: 12,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color:
        COLORS.text,
    },

    cardDescription: {
      marginTop: 5,
      color:
        COLORS.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
  });
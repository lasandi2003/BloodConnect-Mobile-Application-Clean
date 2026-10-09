import React, {
  type ComponentProps,
  useState,
} from 'react';

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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

type IconName = ComponentProps<
  typeof Ionicons
>['name'];

export interface DashboardItem {
  title: string;
  description: string;
  icon: IconName;
}

interface Props {
  title: string;
  subtitle: string;
  items: DashboardItem[];
}

export default function RoleDashboard({
  title,
  subtitle,
  items,
}: Props) {
  const {
    profile,
    logout,
  } = useAuth();

  const [
    logoutModalVisible,
    setLogoutModalVisible,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  function openLogoutModal() {
    setLogoutModalVisible(true);
  }

  function closeLogoutModal() {
    if (loggingOut) {
      return;
    }

    setLogoutModalVisible(false);
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logout();

      /*
       * RootNavigator detects:
       * user = null
       * profile = null
       *
       * and automatically returns
       * the user to Login.
       */
    } catch (error) {
      console.error(
        'Logout error:',
        error,
      );
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* Header */}
        <View
          style={styles.header}
        >
          {/* User information */}
          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.welcome
              }
            >
              Welcome back,
            </Text>

            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {profile?.fullName ??
                'User'}
            </Text>
          </View>

          {/* Logout button */}
          <Pressable
            style={
              styles.logoutButton
            }
            onPress={
              openLogoutModal
            }
          >
            <Ionicons
              name="log-out-outline"
              size={21}
              color={
                COLORS.primary
              }
            />
          </Pressable>
        </View>

        {/* Hero section */}
        <View
          style={styles.hero}
        >
          <Text
            style={styles.title}
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

        {/* Dashboard cards */}
        <View
          style={styles.grid}
        >
          {items.map(item => (
            <View
              key={item.title}
              style={styles.card}
            >
              <View
                style={
                  styles.iconCircle
                }
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={
                    COLORS.primary
                  }
                />
              </View>

              <View
                style={
                  styles.cardText
                }
              >
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
                  {item.description}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#B9B9B9"
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Logout confirmation modal */}
      <Modal
        visible={
          logoutModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeLogoutModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalIcon
              }
            >
              <Ionicons
                name="log-out-outline"
                size={30}
                color={
                  COLORS.primary
                }
              />
            </View>

            <Text
              style={
                styles.modalTitle
              }
            >
              Logout
            </Text>

            <Text
              style={
                styles.modalMessage
              }
            >
              Are you sure you want
              to sign out of
              BloodConnect?
            </Text>

            <View
              style={
                styles.modalButtons
              }
            >
              <Pressable
                style={
                  styles.cancelButton
                }
                disabled={
                  loggingOut
                }
                onPress={
                  closeLogoutModal
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.signOutButton,

                  loggingOut &&
                    styles.disabledButton,
                ]}
                disabled={
                  loggingOut
                }
                onPress={
                  handleLogout
                }
              >
                <Text
                  style={
                    styles.signOutButtonText
                  }
                >
                  {loggingOut
                    ? 'Signing out...'
                    : 'Sign Out'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    container: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 24,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 18,
    },

    headerText: {
      flex: 1,
      paddingRight: 12,
    },

    welcome: {
      fontSize: 12,
      color:
        COLORS.textSecondary,
    },

    name: {
      marginTop: 2,
      fontSize: 19,
      fontWeight: '800',
      color:
        COLORS.text,
    },

    logoutButton: {
      width: 42,
      height: 42,
      borderRadius: 21,

      backgroundColor:
        COLORS.primaryLight,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    hero: {
      padding: 20,
      borderRadius: 18,

      backgroundColor:
        COLORS.primary,

      marginBottom: 18,

      shadowColor:
        COLORS.primaryDark,

      shadowOpacity: 0.12,

      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 3,
    },

    title: {
      fontSize: 22,
      fontWeight: '800',
      color:
        COLORS.white,
    },

    subtitle: {
      marginTop: 7,

      fontSize: 13,
      lineHeight: 19,

      color: '#FFEAEA',
    },

    grid: {
      gap: 10,
    },

    card: {
      minHeight: 88,

      padding: 15,

      backgroundColor:
        COLORS.white,

      borderRadius: 14,

      borderWidth: 1,
      borderColor:
        COLORS.border,

      flexDirection: 'row',
      alignItems: 'center',
    },

    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,

      backgroundColor:
        COLORS.primaryLight,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 12,
    },

    cardText: {
      flex: 1,
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color:
        COLORS.text,
    },

    cardDescription: {
      marginTop: 4,

      fontSize: 12,
      lineHeight: 17,

      color:
        COLORS.textSecondary,
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0, 0, 0, 0.45)',

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal: 25,
    },

    modalCard: {
      width: '100%',
      maxWidth: 360,

      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      paddingHorizontal: 24,
      paddingVertical: 28,

      alignItems:
        'center',
    },

    modalIcon: {
      width: 58,
      height: 58,

      borderRadius: 29,

      backgroundColor:
        COLORS.primaryLight,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginBottom: 16,
    },

    modalTitle: {
      fontSize: 21,
      fontWeight: '800',

      color:
        COLORS.text,
    },

    modalMessage: {
      marginTop: 8,

      fontSize: 14,
      lineHeight: 20,

      color:
        COLORS.textSecondary,

      textAlign:
        'center',
    },

    modalButtons: {
      width: '100%',

      flexDirection: 'row',

      gap: 10,

      marginTop: 24,
    },

    cancelButton: {
      flex: 1,

      height: 48,

      borderRadius: 10,

      borderWidth: 1,
      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    cancelButtonText: {
      fontSize: 14,
      fontWeight: '700',

      color:
        COLORS.text,
    },

    signOutButton: {
      flex: 1,

      height: 48,

      borderRadius: 10,

      backgroundColor:
        COLORS.primary,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    signOutButtonText: {
      fontSize: 14,
      fontWeight: '700',

      color:
        COLORS.white,
    },

    disabledButton: {
      opacity: 0.6,
    },
  });
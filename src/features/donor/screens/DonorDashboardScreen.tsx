import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  auth,
} from '../../../config/firebase';

import {
  COLORS,
} from '../../../constants/colors';

import {
  useAuth,
} from '../../auth/context/AuthContext';

import DonorScreenShell from '../components/DonorScreenShell';
import DonorBottomNav from '../components/DonorBottomNav';
import RequestCard from '../components/RequestCard';
import StatCard from '../components/StatCard';

import type {
  DonorStackParamList,
} from '../navigation/types';

import type {
  DonorProfile,
  DonorResponse,
  EmergencyRequest,
} from '../types/donor';

import {
  getCompatibleRequests,
  getDonorProfile,
  getDonorResponses,
  updateDonorAvailability,
} from '../services/donorService';

type Navigation =
  NativeStackNavigationProp<
    DonorStackParamList
  >;

export default function DonorDashboardScreen() {
  const navigation =
    useNavigation<Navigation>();

  const {
    profile: authProfile,
    logout,
  } = useAuth();

  const [
    donor,
    setDonor,
  ] = useState<DonorProfile | null>(
    null,
  );

  const [
    requests,
    setRequests,
  ] = useState<EmergencyRequest[]>(
    [],
  );

  const [
    responses,
    setResponses,
  ] = useState<DonorResponse[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    updatingAvailability,
    setUpdatingAvailability,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const [
    logoutModalVisible,
    setLogoutModalVisible,
  ] = useState(false);

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  const loadDashboard =
    useCallback(
      async () => {
        const user =
          auth.currentUser;

        if (!user) {
          return;
        }

        try {
          setLoading(true);

          const donorData =
            await getDonorProfile(
              user.uid,
            );

          setDonor(
            donorData,
          );

          const responseData =
            await getDonorResponses(
              user.uid,
            );

          setResponses(
            responseData,
          );

          if (
            donorData.bloodGroup &&
            donorData.isAvailable
          ) {
            const requestData =
              await getCompatibleRequests(
                donorData.bloodGroup,
              );

            setRequests(
              requestData,
            );
          } else {
            setRequests([]);
          }
        } catch (error) {
          console.error(
            'Dashboard load error:',
            error,
          );

          Alert.alert(
            'Unable to load',
            'We could not load your donor information. Please try again.',
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  // ==========================================
  // UPDATE DONOR AVAILABILITY
  // ==========================================

  async function toggleAvailability(
    value: boolean,
  ) {
    const user =
      auth.currentUser;

    if (
      !user ||
      !donor
    ) {
      return;
    }

    const previousValue =
      donor.isAvailable;

    try {
      setUpdatingAvailability(
        true,
      );

      setDonor({
        ...donor,
        isAvailable: value,
      });

      await updateDonorAvailability(
        user.uid,
        value,
      );

      if (
        value &&
        donor.bloodGroup
      ) {
        const requestData =
          await getCompatibleRequests(
            donor.bloodGroup,
          );

        setRequests(
          requestData,
        );
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error(
        'Availability update error:',
        error,
      );

      setDonor({
        ...donor,
        isAvailable:
          previousValue,
      });

      Alert.alert(
        'Update failed',
        'Your availability could not be updated. Please try again.',
      );
    } finally {
      setUpdatingAvailability(
        false,
      );
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  function handleLogout() {
    setLogoutModalVisible(
      true,
    );
  }

  function cancelLogout() {
    if (loggingOut) {
      return;
    }

    setLogoutModalVisible(
      false,
    );
  }

  async function performLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await logout();

      setLogoutModalVisible(
        false,
      );
    } catch (error) {
      console.error(
        'Donor logout error:',
        error,
      );

      Alert.alert(
        'Sign out failed',
        'Unable to sign out. Please try again.',
      );
    } finally {
      setLoggingOut(false);
    }
  }

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const completed =
    responses.filter(
      item =>
        item.status ===
        'completed',
    ).length;

  const accepted =
    responses.filter(
      item =>
        item.status ===
          'accepted' ||
        item.status ===
          'completed',
    ).length;

  const displayName =
    donor?.fullName ||
    authProfile?.fullName ||
    'Donor';

  // ==========================================
  // UI
  // ==========================================

  return (
    <DonorScreenShell>
      <View
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* HEADER */}

          <View
            style={styles.header}
          >
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
                style={
                  styles.name
                }
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>

            <Pressable
              onPress={
                handleLogout
              }
              disabled={
                loggingOut
              }
              hitSlop={10}
              style={({
                pressed,
              }) => [
                styles.logout,
                pressed &&
                  styles.logoutPressed,
                loggingOut &&
                  styles.logoutDisabled,
              ]}
            >
              {loggingOut ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.primary
                  }
                />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color={
                    COLORS.primary
                  }
                />
              )}
            </Pressable>
          </View>

          <Pressable
            style={styles.centreShortcut}
            onPress={() => navigation.navigate('FindDonationCentres')}
            accessibilityRole="button"
            accessibilityLabel="Find nearby donation centres"
          >
            <Ionicons name="location-outline" size={25} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.centreShortcutTitle}>Find Nearby Donation Centres</Text>
              <Text style={styles.centreShortcutDescription}>Search locations and plan your visit</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </Pressable>

          {/* LOADING */}

          {loading ? (
            <View
              style={
                styles.loading
              }
            >
              <ActivityIndicator
                size="large"
                color={
                  COLORS.primary
                }
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading your donor dashboard...
              </Text>
            </View>
          ) : (
            <>
              {/* COMPLETE PROFILE WARNING */}

              {!donor?.profileCompleted && (
                <Pressable
                  style={
                    styles.profileBanner
                  }
                  onPress={() =>
                    navigation.navigate(
                      'DonorProfile',
                    )
                  }
                >
                  <View
                    style={
                      styles.profileBannerIcon
                    }
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={21}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.profileBannerText
                    }
                  >
                    <Text
                      style={
                        styles.profileBannerTitle
                      }
                    >
                      Complete your donor profile
                    </Text>

                    <Text
                      style={
                        styles.profileBannerSubtitle
                      }
                    >
                      Add your blood group and location to receive compatible requests.
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={
                      COLORS.primary
                    }
                  />
                </Pressable>
              )}

              {/* ACTIVE DONOR CARD */}

              <View
                style={
                  styles.donorCard
                }
              >
                <View
                  style={
                    styles.bloodBadge
                  }
                >
                  <Text
                    style={
                      styles.bloodBadgeText
                    }
                  >
                    {donor?.bloodGroup ??
                      '--'}
                  </Text>
                </View>

                <View
                  style={
                    styles.donorCardContent
                  }
                >
                  <Text
                    style={
                      styles.activeTitle
                    }
                  >
                    {donor?.isAvailable
                      ? 'Active Donor'
                      : 'Currently Unavailable'}
                  </Text>

                  <Text
                    style={
                      styles.activeSubtitle
                    }
                  >
                    {donor?.isAvailable
                      ? 'You are eligible to receive compatible requests'
                      : 'Turn availability on when you are ready to donate'}
                  </Text>
                </View>

                <Switch
                  value={
                    donor?.isAvailable ??
                    false
                  }
                  disabled={
                    updatingAvailability
                  }
                  onValueChange={
                    toggleAvailability
                  }
                  trackColor={{
                    false:
                      '#D6D6D6',
                    true:
                      '#8EC5A6',
                  }}
                  thumbColor={
                    donor?.isAvailable
                      ? COLORS.success
                      : '#FFFFFF'
                  }
                />
              </View>

              {/* STATISTICS */}

              <View
                style={styles.stats}
              >
                <StatCard
                  value={completed}
                  label="Donations"
                />

                <StatCard
                  value={accepted}
                  label="Accepted"
                />

                <StatCard
                  value={
                    responses.length
                  }
                  label="Responses"
                />
              </View>

              {/* EMERGENCY REQUESTS */}

              <View
                style={
                  styles.sectionHeader
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Emergency Requests
                </Text>

                <Pressable
                  onPress={() =>
                    navigation.navigate(
                      'BloodRequests',
                    )
                  }
                >
                  <Text
                    style={
                      styles.seeAll
                    }
                  >
                    See All
                  </Text>
                </Pressable>
              </View>

              {/* NO BLOOD GROUP */}

              {!donor?.bloodGroup ? (
                <View
                  style={
                    styles.emptyCard
                  }
                >
                  <Ionicons
                    name="water-outline"
                    size={31}
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    Blood group required
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Complete your profile before we can find compatible requests.
                  </Text>

                  <Pressable
                    style={
                      styles.smallButton
                    }
                    onPress={() =>
                      navigation.navigate(
                        'DonorProfile',
                      )
                    }
                  >
                    <Text
                      style={
                        styles.smallButtonText
                      }
                    >
                      Complete Profile
                    </Text>
                  </Pressable>
                </View>
              ) : !donor?.isAvailable ? (
                <View
                  style={
                    styles.emptyCard
                  }
                >
                  <Ionicons
                    name="pause-circle-outline"
                    size={31}
                    color={
                      COLORS.textMuted
                    }
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    Availability is off
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Turn on your availability to view compatible emergency requests.
                  </Text>
                </View>
              ) : requests.length ===
                0 ? (
                <View
                  style={
                    styles.emptyCard
                  }
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={31}
                    color={
                      COLORS.success
                    }
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No compatible requests
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    There are currently no verified requests matching your blood group.
                  </Text>
                </View>
              ) : (
                requests
                  .slice(
                    0,
                    3,
                  )
                  .map(
                    request => (
                      <RequestCard
                        key={
                          request.id
                        }
                        request={
                          request
                        }
                        onPress={() =>
                          navigation.navigate(
                            'RequestDetails',
                            {
                              requestId:
                                request.id,
                            },
                          )
                        }
                      />
                    ),
                  )
              )}
            </>
          )}
        </ScrollView>

        <DonorBottomNav
          active="Home"
        />

        {/* LOGOUT CONFIRMATION MODAL */}

        <Modal
          visible={
            logoutModalVisible
          }
          transparent
          animationType="fade"
          onRequestClose={
            cancelLogout
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
                Sign Out
              </Text>

              <Text
                style={
                  styles.modalMessage
                }
              >
                Are you sure you want to sign out of BloodConnect?
              </Text>

              <View
                style={
                  styles.modalButtons
                }
              >
                <Pressable
                  onPress={
                    cancelLogout
                  }
                  disabled={
                    loggingOut
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.cancelButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
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
                  onPress={() => {
                    void performLogout();
                  }}
                  disabled={
                    loggingOut
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.signOutButton,
                    pressed &&
                      styles.buttonPressed,
                    loggingOut &&
                      styles.logoutDisabled,
                  ]}
                >
                  {loggingOut ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.white
                      }
                    />
                  ) : (
                    <Text
                      style={
                        styles.signOutButtonText
                      }
                    >
                      Sign Out
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </DonorScreenShell>
  );
}

const styles =
  StyleSheet.create({
    centreShortcut: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 18, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
    centreShortcutTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
    centreShortcutDescription: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5, lineHeight: 18 },
    screen: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 30,
    },

    // HEADER

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 17,
    },

    headerText: {
      flex: 1,
      paddingRight: 10,
    },

    welcome: {
      fontSize: 12,
      color:
        COLORS.textSecondary,
    },

    name: {
      marginTop: 2,
      fontSize: 19,
      fontWeight: '900',
      color: COLORS.text,
    },

    logout: {
      width: 43,
      height: 43,
      borderRadius: 22,

      backgroundColor:
        COLORS.primaryLight,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    logoutPressed: {
      opacity: 0.7,

      transform: [
        {
          scale: 0.96,
        },
      ],
    },

    logoutDisabled: {
      opacity: 0.55,
    },

    // LOADING

    loading: {
      paddingVertical: 80,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 12,
      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    // PROFILE WARNING

    profileBanner: {
      flexDirection: 'row',
      alignItems: 'center',

      padding: 13,

      backgroundColor:
        '#FFF3F4',

      borderWidth: 1,

      borderColor:
        COLORS.primaryLight,

      borderRadius: 14,

      marginBottom: 13,
    },

    profileBannerIcon: {
      width: 39,
      height: 39,

      borderRadius: 20,

      backgroundColor:
        COLORS.white,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 10,
    },

    profileBannerText: {
      flex: 1,
    },

    profileBannerTitle: {
      fontSize: 12,
      fontWeight: '800',

      color:
        COLORS.primaryDark,
    },

    profileBannerSubtitle: {
      marginTop: 3,

      fontSize: 10,
      lineHeight: 15,

      color:
        COLORS.textSecondary,
    },

    // DONOR STATUS CARD

    donorCard: {
      padding: 15,
      minHeight: 82,

      borderRadius: 16,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      flexDirection: 'row',

      alignItems:
        'center',
    },

    bloodBadge: {
      width: 50,
      height: 50,

      borderRadius: 25,

      justifyContent:
        'center',

      alignItems:
        'center',

      backgroundColor:
        COLORS.primaryLight,

      marginRight: 12,
    },

    bloodBadgeText: {
      color:
        COLORS.primary,

      fontSize: 15,
      fontWeight: '900',
    },

    donorCardContent: {
      flex: 1,
      paddingRight: 7,
    },

    activeTitle: {
      fontSize: 14,
      fontWeight: '800',

      color:
        COLORS.text,
    },

    activeSubtitle: {
      marginTop: 4,

      fontSize: 10,
      lineHeight: 15,

      color:
        COLORS.textSecondary,
    },

    // STATISTICS

    stats: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 11,
    },

    // EMERGENCY REQUESTS

    sectionHeader: {
      marginTop: 22,
      marginBottom: 10,

      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    sectionTitle: {
      fontSize: 15,
      fontWeight: '900',

      color:
        COLORS.text,
    },

    seeAll: {
      color:
        COLORS.primary,

      fontSize: 11,
      fontWeight: '700',
    },

    // EMPTY STATES

    emptyCard: {
      minHeight: 155,

      padding: 20,

      borderRadius: 15,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyTitle: {
      marginTop: 9,

      fontSize: 14,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    emptyText: {
      marginTop: 5,

      maxWidth: 280,

      fontSize: 11,

      lineHeight: 17,

      textAlign:
        'center',

      color:
        COLORS.textSecondary,
    },

    smallButton: {
      marginTop: 14,

      paddingHorizontal: 18,

      paddingVertical: 9,

      borderRadius: 8,

      backgroundColor:
        COLORS.primary,
    },

    smallButtonText: {
      color:
        COLORS.white,

      fontSize: 11,

      fontWeight:
        '800',
    },

    // LOGOUT MODAL

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0, 0, 0, 0.45)',

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal: 24,
    },

    modalCard: {
      width: '100%',

      maxWidth: 340,

      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      paddingHorizontal: 22,

      paddingTop: 24,

      paddingBottom: 20,

      alignItems:
        'center',

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.18,

      shadowRadius: 12,

      elevation: 7,
    },

    modalIcon: {
      width: 58,
      height: 58,

      borderRadius: 29,

      backgroundColor:
        COLORS.primaryLight,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 14,
    },

    modalTitle: {
      fontSize: 19,

      fontWeight:
        '900',

      color:
        COLORS.text,

      textAlign:
        'center',
    },

    modalMessage: {
      marginTop: 8,

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.textSecondary,

      textAlign:
        'center',

      maxWidth: 260,
    },

    modalButtons: {
      width: '100%',

      flexDirection:
        'row',

      gap: 10,

      marginTop: 22,
    },

    cancelButton: {
      flex: 1,

      minHeight: 44,

      borderRadius: 10,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    cancelButtonText: {
      fontSize: 13,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    signOutButton: {
      flex: 1,

      minHeight: 44,

      borderRadius: 10,

      backgroundColor:
        COLORS.primary,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    signOutButtonText: {
      fontSize: 13,

      fontWeight:
        '800',

      color:
        COLORS.white,
    },

    buttonPressed: {
      opacity: 0.75,
    },
  });

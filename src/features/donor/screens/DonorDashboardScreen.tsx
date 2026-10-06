import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
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
    useNavigation<
      Navigation
    >();

  const {
    profile:
      authProfile,
    logout,
  } = useAuth();

  const [
    donor,
    setDonor,
  ] =
    useState<
      DonorProfile | null
    >(null);

  const [
    requests,
    setRequests,
  ] =
    useState<
      EmergencyRequest[]
    >([]);

  const [
    responses,
    setResponses,
  ] =
    useState<
      DonorResponse[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    updatingAvailability,
    setUpdatingAvailability,
  ] =
    useState(false);

  const loadDashboard =
    useCallback(
      async () => {
        const user =
          auth.currentUser;

        if (!user) {
          return;
        }

        try {
          setLoading(
            true,
          );

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
        } catch (
          error
        ) {
          console.error(
            'Dashboard load error:',
            error,
          );

          Alert.alert(
            'Unable to load',
            'We could not load your donor information. Please try again.',
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );

  useFocusEffect(
  useCallback(() => {
    void loadDashboard();
  }, [loadDashboard]),
);

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

    try {
      setUpdatingAvailability(
        true,
      );

      setDonor({
        ...donor,

        isAvailable:
          value,
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
    } catch {
      setDonor({
        ...donor,

        isAvailable:
          !value,
      });

      Alert.alert(
        'Update failed',
        'Your availability could not be updated.',
      );
    } finally {
      setUpdatingAvailability(
        false,
      );
    }
  }

  function handleLogout() {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        {
          text:
            'Cancel',

          style:
            'cancel',
        },

        {
          text:
            'Sign Out',

          style:
            'destructive',

          onPress:
            async () => {
              await logout();
            },
        },
      ],
    );
  }

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

  return (
    <DonorScreenShell>
      <View
        style={
          styles.screen
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.header
            }
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
                numberOfLines={
                  1
                }
              >
                {
                  displayName
                }
              </Text>
            </View>

            <Pressable
              onPress={
                handleLogout
              }
              style={
                styles.logout
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

              <View
                style={
                  styles.stats
                }
              >
                <StatCard
                  value={
                    completed
                  }
                  label="Donations"
                />

                <StatCard
                  value={
                    accepted
                  }
                  label="Accepted"
                />

                <StatCard
                  value={
                    responses.length
                  }
                  label="Responses"
                />
              </View>

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
      </View>
    </DonorScreenShell>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    content: {
      paddingHorizontal:
        18,

      paddingTop: 12,

      paddingBottom: 30,
    },

    header: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        17,
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

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    logout: {
      width: 43,
      height: 43,

      borderRadius:
        22,

      backgroundColor:
        COLORS.primaryLight,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    loading: {
      paddingVertical:
        80,

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

    profileBanner: {
      flexDirection:
        'row',

      alignItems:
        'center',

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

      borderRadius:
        20,

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

      fontWeight:
        '800',

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

    donorCard: {
      padding: 15,

      minHeight: 82,

      borderRadius:
        16,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    bloodBadge: {
      width: 50,
      height: 50,

      borderRadius:
        25,

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

      fontWeight:
        '900',
    },

    donorCardContent: {
      flex: 1,

      paddingRight: 7,
    },

    activeTitle: {
      fontSize: 14,

      fontWeight:
        '800',

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

    stats: {
      flexDirection:
        'row',

      gap: 8,

      marginTop: 11,
    },

    sectionHeader: {
      marginTop: 22,

      marginBottom: 10,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    sectionTitle: {
      fontSize: 15,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    seeAll: {
      color:
        COLORS.primary,

      fontSize: 11,

      fontWeight:
        '700',
    },

    emptyCard: {
      minHeight: 155,

      padding: 20,

      borderRadius:
        15,

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

      paddingHorizontal:
        18,

      paddingVertical:
        9,

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
  });
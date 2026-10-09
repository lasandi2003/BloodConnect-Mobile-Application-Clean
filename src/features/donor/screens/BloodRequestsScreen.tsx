import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

import DonorBottomNav from '../components/DonorBottomNav';

import DonorScreenShell from '../components/DonorScreenShell';

import RequestCard from '../components/RequestCard';

import type {
  DonorStackParamList,
} from '../navigation/types';

import type {
  DonorProfile,
  EmergencyRequest,
  RequestUrgency,
} from '../types/donor';

import {
  getCompatibleRequests,
  getDonorProfile,
} from '../services/donorService';

type Navigation =
  NativeStackNavigationProp<
    DonorStackParamList
  >;

type FilterType =
  | 'all'
  | RequestUrgency;

export default function BloodRequestsScreen() {
  const navigation =
    useNavigation<Navigation>();

  const [
    donor,
    setDonor,
  ] = useState<
    DonorProfile | null
  >(null);

  const [
    requests,
    setRequests,
  ] = useState<
    EmergencyRequest[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<FilterType>(
      'all',
    );

  // ==========================================
  // LOAD REQUESTS
  // ==========================================

  const loadRequests =
    useCallback(
      async () => {
        const user =
          auth.currentUser;

        if (!user) {
          setLoading(false);

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

          if (
            !donorData.bloodGroup ||
            !donorData.isAvailable
          ) {
            setRequests([]);

            return;
          }

          const result =
            await getCompatibleRequests(
              donorData.bloodGroup,
            );

          setRequests(
            result,
          );
        } catch (
          error
        ) {
          console.error(
            'Blood requests error:',
            error,
          );

          setRequests([]);
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const filteredRequests =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return requests.filter(
        request => {
          const matchesFilter =
            selectedFilter ===
              'all' ||
            request.urgency ===
              selectedFilter;

          const matchesSearch =
            query.length === 0 ||
            request.hospitalName
              .toLowerCase()
              .includes(
                query,
              ) ||
            request.location
              .toLowerCase()
              .includes(
                query,
              ) ||
            request.patientName
              .toLowerCase()
              .includes(
                query,
              ) ||
            request.bloodGroup
              .toLowerCase()
              .includes(
                query,
              );

          return (
            matchesFilter &&
            matchesSearch
          );
        },
      );
    }, [
      requests,
      search,
      selectedFilter,
    ]);

  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  const filters: {
    label: string;
    value: FilterType;
  }[] = [
    {
      label: 'All',
      value: 'all',
    },
    {
      label: 'Critical',
      value:
        'critical',
    },
    {
      label: 'Urgent',
      value: 'urgent',
    },
    {
      label: 'Normal',
      value: 'normal',
    },
  ];

  // ==========================================
  // UI
  // ==========================================

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
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}

          <View
            style={
              styles.header
            }
          >
            <View>
              <Text
                style={
                  styles.title
                }
              >
                Blood Requests
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Verified requests
                compatible with
                your blood group.
              </Text>
            </View>

            <View
              style={
                styles.bloodBadge
              }
            >
              <Text
                style={
                  styles.bloodText
                }
              >
                {donor?.bloodGroup ??
                  '--'}
              </Text>
            </View>
          </View>

          {/* SEARCH */}

          <View
            style={
              styles.searchBox
            }
          >
            <Ionicons
              name="search-outline"
              size={19}
              color={
                COLORS.textMuted
              }
            />

            <TextInput
              value={search}
              onChangeText={
                setSearch
              }
              placeholder="Search hospital, location..."
              placeholderTextColor={
                COLORS.textMuted
              }
              style={
                styles.searchInput
              }
            />

            {search.length >
            0 ? (
              <Pressable
                hitSlop={8}
                onPress={() =>
                  setSearch('')
                }
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={
                    COLORS.textMuted
                  }
                />
              </Pressable>
            ) : null}
          </View>

          {/* URGENCY FILTERS */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filters
            }
          >
            {filters.map(
              filter => {
                const active =
                  selectedFilter ===
                  filter.value;

                return (
                  <Pressable
                    key={
                      filter.value
                    }
                    onPress={() =>
                      setSelectedFilter(
                        filter.value,
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.filter,

                      active &&
                        styles.activeFilter,

                      pressed &&
                        styles.filterPressed,
                    ]}
                  >
                    {active && (
                      <View
                        style={
                          styles.activeDot
                        }
                      />
                    )}

                    <Text
                      style={[
                        styles.filterText,

                        active &&
                          styles.activeFilterText,
                      ]}
                    >
                      {
                        filter.label
                      }
                    </Text>
                  </Pressable>
                );
              },
            )}
          </ScrollView>

          {/* CONTENT */}

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
                Finding compatible
                requests...
              </Text>
            </View>
          ) : !donor?.bloodGroup ? (
            <View
              style={
                styles.empty
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="water-outline"
                  size={29}
                  color={
                    COLORS.primary
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Complete your
                donor profile
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Add your blood group
                before we can find
                compatible emergency
                requests.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,

                  pressed &&
                    styles.primaryButtonPressed,
                ]}
                onPress={() =>
                  navigation.navigate(
                    'DonorProfile',
                  )
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Complete Profile
                </Text>
              </Pressable>
            </View>
          ) : !donor.isAvailable ? (
            <View
              style={
                styles.empty
              }
            >
              <View
                style={[
                  styles.emptyIcon,

                  styles.emptyIconMuted,
                ]}
              >
                <Ionicons
                  name="pause-circle-outline"
                  size={29}
                  color={
                    COLORS.textMuted
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                You are unavailable
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Turn availability on
                from your profile or
                dashboard to receive
                compatible requests.
              </Text>
            </View>
          ) : filteredRequests.length ===
            0 ? (
            <View
              style={
                styles.empty
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="search-outline"
                  size={28}
                  color={
                    COLORS.primary
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No matching requests found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Try changing your search
                or urgency filter.
              </Text>

              {(search.length >
                0 ||
                selectedFilter !==
                  'all') && (
                <Pressable
                  style={({ pressed }) => [
                    styles.resetButton,

                    pressed &&
                      styles.resetButtonPressed,
                  ]}
                  onPress={() => {
                    setSearch('');

                    setSelectedFilter(
                      'all',
                    );
                  }}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={15}
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.resetButtonText
                    }
                  >
                    Reset Filters
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View>
              <Text
                style={
                  styles.resultCount
                }
              >
                {
                  filteredRequests.length
                }{' '}
                compatible request
                {filteredRequests.length !==
                1
                  ? 's'
                  : ''}
              </Text>

              {filteredRequests.map(
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
              )}
            </View>
          )}
        </ScrollView>

        <DonorBottomNav
          active="Requests"
        />
      </View>
    </DonorScreenShell>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    content: {
      paddingHorizontal:
        18,

      paddingTop: 17,

      paddingBottom: 30,
    },

    // ======================================
    // HEADER
    // ======================================

    header: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 18,
    },

    title: {
      fontSize: 22,

      fontWeight: '900',

      color: COLORS.text,
    },

    subtitle: {
      marginTop: 4,

      maxWidth: 270,

      fontSize: 11,

      lineHeight: 16,

      color:
        COLORS.textSecondary,
    },

    bloodBadge: {
      width: 45,
      height: 45,

      borderRadius: 23,

      backgroundColor:
        COLORS.primaryLight,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    bloodText: {
      color:
        COLORS.primary,

      fontWeight: '900',

      fontSize: 13,
    },

    // ======================================
    // SEARCH
    // ======================================

    searchBox: {
      height: 48,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 13,

      flexDirection: 'row',

      alignItems:
        'center',
    },

    searchInput: {
      flex: 1,

      marginLeft: 8,

      fontSize: 13,

      color: COLORS.text,
    },

    // ======================================
    // FILTERS
    // ======================================

    filters: {
      gap: 8,

      paddingVertical: 14,
    },

    filter: {
      minHeight: 36,

      paddingHorizontal: 15,

      paddingVertical: 8,

      borderRadius: 20,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 6,
    },

    activeFilter: {
      backgroundColor:
        COLORS.primary,

      borderColor:
        COLORS.primary,

      borderWidth: 1.5,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.12,

      shadowRadius: 3,

      elevation: 2,
    },

    filterPressed: {
      opacity: 0.8,

      transform: [
        {
          scale: 0.97,
        },
      ],
    },

    activeDot: {
      width: 5,

      height: 5,

      borderRadius: 3,

      backgroundColor:
        COLORS.white,
    },

    filterText: {
      fontSize: 11,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

    activeFilterText: {
      color: COLORS.white,

      fontWeight: '900',
    },

    resultCount: {
      marginBottom: 9,

      fontSize: 11,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

    // ======================================
    // LOADING
    // ======================================

    loading: {
      paddingVertical: 80,

      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 12,

      color:
        COLORS.textSecondary,

      fontSize: 12,
    },

    // ======================================
    // EMPTY STATE
    // ======================================

    empty: {
      marginTop: 20,

      minHeight: 230,

      padding: 25,

      backgroundColor:
        COLORS.white,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    emptyIcon: {
      width: 56,

      height: 56,

      borderRadius: 28,

      backgroundColor:
        COLORS.primaryLight,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyIconMuted: {
      backgroundColor:
        '#F4F4F4',
    },

    emptyTitle: {
      marginTop: 12,

      fontSize: 15,

      fontWeight: '800',

      color: COLORS.text,

      textAlign: 'center',
    },

    emptyText: {
      marginTop: 6,

      maxWidth: 290,

      textAlign: 'center',

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.textSecondary,
    },

    // ======================================
    // BUTTONS
    // ======================================

    primaryButton: {
      marginTop: 16,

      paddingHorizontal: 20,

      paddingVertical: 10,

      borderRadius: 9,

      backgroundColor:
        COLORS.primary,
    },

    primaryButtonPressed: {
      opacity: 0.8,
    },

    primaryButtonText: {
      color: COLORS.white,

      fontSize: 11,

      fontWeight: '800',
    },

    resetButton: {
      minHeight: 40,

      marginTop: 17,

      paddingHorizontal: 15,

      borderRadius: 9,

      borderWidth: 1,

      borderColor:
        COLORS.primary,

      backgroundColor:
        COLORS.white,

      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 6,
    },

    resetButtonPressed: {
      backgroundColor:
        COLORS.primaryLight,
    },

    resetButtonText: {
      fontSize: 11,

      fontWeight: '800',

      color:
        COLORS.primary,
    },
  });
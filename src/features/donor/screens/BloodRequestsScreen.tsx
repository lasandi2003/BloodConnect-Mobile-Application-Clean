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
                    style={[
                      styles.filter,

                      active &&
                        styles.activeFilter,
                    ]}
                  >
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
              <Ionicons
                name="water-outline"
                size={36}
                color={
                  COLORS.primary
                }
              />

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
                style={
                  styles.primaryButton
                }
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
              <Ionicons
                name="pause-circle-outline"
                size={36}
                color={
                  COLORS.textMuted
                }
              />

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
              <Ionicons
                name="search-outline"
                size={35}
                color={
                  COLORS.textMuted
                }
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No requests found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                There are no verified
                compatible requests
                matching your current
                filters.
              </Text>
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

    filters: {
      gap: 8,

      paddingVertical: 14,
    },

    filter: {
      paddingHorizontal: 15,

      paddingVertical: 8,

      borderRadius: 20,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    activeFilter: {
      backgroundColor:
        COLORS.primary,

      borderColor:
        COLORS.primary,
    },

    filterText: {
      fontSize: 11,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

    activeFilterText: {
      color: COLORS.white,
    },

    resultCount: {
      marginBottom: 9,

      fontSize: 11,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

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

    emptyTitle: {
      marginTop: 12,

      fontSize: 15,

      fontWeight: '800',

      color: COLORS.text,
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

    primaryButton: {
      marginTop: 16,

      paddingHorizontal: 20,

      paddingVertical: 10,

      borderRadius: 9,

      backgroundColor:
        COLORS.primary,
    },

    primaryButtonText: {
      color: COLORS.white,

      fontSize: 11,

      fontWeight: '800',
    },
  });
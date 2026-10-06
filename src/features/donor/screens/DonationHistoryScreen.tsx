import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
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

import StatusBadge from '../components/StatusBadge';

import type {
  DonorStackParamList,
} from '../navigation/types';

import type {
  DonorResponse,
} from '../types/donor';

import {
  deleteDonorResponse,
  getDonorResponses,
  withdrawDonorResponse,
} from '../services/donorService';

type Navigation =
  NativeStackNavigationProp<
    DonorStackParamList
  >;

type HistoryFilter =
  | 'all'
  | 'accepted'
  | 'completed'
  | 'declined'
  | 'withdrawn';

export default function DonationHistoryScreen() {
  const navigation =
    useNavigation<Navigation>();

  const [
    responses,
    setResponses,
  ] = useState<
    DonorResponse[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    filter,
    setFilter,
  ] =
    useState<HistoryFilter>(
      'all',
    );

  const loadHistory =
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

          const result =
            await getDonorResponses(
              user.uid,
            );

          setResponses(
            result,
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const visibleResponses =
    useMemo(() => {
      if (
        filter ===
        'all'
      ) {
        return responses;
      }

      return responses.filter(
        item =>
          item.status ===
          filter,
      );
    }, [
      responses,
      filter,
    ]);

  function confirmAction(
    title: string,
    message: string,
    action: () =>
      Promise<void>,
  ) {
    if (
      Platform.OS === 'web' &&
      typeof window !==
        'undefined'
    ) {
      const confirmed =
        window.confirm(
          `${title}\n\n${message}`,
        );

      if (
        confirmed
      ) {
        void action();
      }

      return;
    }

    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',

          style:
            'cancel',
        },

        {
          text:
            'Confirm',

          style:
            'destructive',

          onPress: () =>
            void action(),
        },
      ],
    );
  }

  async function withdraw(
    responseId: string,
  ) {
    try {
      await withdrawDonorResponse(
        responseId,
      );

      await loadHistory();
    } catch (
      error
    ) {
      console.error(
        error,
      );
    }
  }

  async function remove(
    responseId: string,
  ) {
    try {
      await deleteDonorResponse(
        responseId,
      );

      await loadHistory();
    } catch (
      error
    ) {
      console.error(
        error,
      );
    }
  }

  const filters: {
    label: string;
    value: HistoryFilter;
  }[] = [
    {
      label: 'All',
      value: 'all',
    },
    {
      label: 'Accepted',
      value:
        'accepted',
    },
    {
      label: 'Completed',
      value:
        'completed',
    },
    {
      label: 'Declined',
      value:
        'declined',
    },
    {
      label: 'Withdrawn',
      value:
        'withdrawn',
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
        >
          <Text
            style={
              styles.title
            }
          >
            Donation History
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Review your previous
            responses and completed
            donations.
          </Text>

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
              item => {
                const active =
                  filter ===
                  item.value;

                return (
                  <Pressable
                    key={
                      item.value
                    }
                    style={[
                      styles.filter,

                      active &&
                        styles.activeFilter,
                    ]}
                    onPress={() =>
                      setFilter(
                        item.value,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,

                        active &&
                          styles.activeFilterText,
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
            </View>
          ) : visibleResponses.length ===
            0 ? (
            <View
              style={
                styles.empty
              }
            >
              <Ionicons
                name="time-outline"
                size={39}
                color={
                  COLORS.textMuted
                }
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No donation history
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Your emergency
                request responses
                will appear here.
              </Text>
            </View>
          ) : (
            visibleResponses.map(
              response => {
                const snapshot =
                  response.requestSnapshot;

                const canWithdraw =
                  response.status ===
                  'accepted';

                const canDelete =
                  response.status ===
                    'declined' ||
                  response.status ===
                    'withdrawn';

                return (
                  <View
                    key={
                      response.id
                    }
                    style={
                      styles.card
                    }
                  >
                    <Pressable
                      style={
                        styles.cardMain
                      }
                      onPress={() =>
                        navigation.navigate(
                          'RequestDetails',
                          {
                            requestId:
                              response.requestId,
                          },
                        )
                      }
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
                            snapshot?.bloodGroup ??
                            '--'
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.cardContent
                        }
                      >
                        <View
                          style={
                            styles.cardTop
                          }
                        >
                          <Text
                            style={
                              styles.hospital
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              snapshot?.hospitalName ??
                              'Hospital'
                            }
                          </Text>

                          <StatusBadge
                            status={
                              response.status
                            }
                          />
                        </View>

                        <Text
                          style={
                            styles.location
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            snapshot?.location ??
                            'Location'
                          }
                        </Text>

                        <Text
                          style={
                            styles.meta
                          }
                        >
                          Required:{' '}
                          {
                            snapshot?.requiredDate ??
                            'Not specified'
                          }
                        </Text>
                      </View>
                    </Pressable>

                    {canWithdraw ||
                    canDelete ? (
                      <View
                        style={
                          styles.cardActions
                        }
                      >
                        {canWithdraw ? (
                          <Pressable
                            style={
                              styles.withdrawButton
                            }
                            onPress={() =>
                              confirmAction(
                                'Withdraw response',
                                'Are you sure you want to withdraw your acceptance?',
                                () =>
                                  withdraw(
                                    response.id,
                                  ),
                              )
                            }
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={16}
                              color={
                                COLORS.primary
                              }
                            />

                            <Text
                              style={
                                styles.withdrawText
                              }
                            >
                              Withdraw
                            </Text>
                          </Pressable>
                        ) : null}

                        {canDelete ? (
                          <Pressable
                            style={
                              styles.deleteButton
                            }
                            onPress={() =>
                              confirmAction(
                                'Delete record',
                                'Delete this response from your history?',
                                () =>
                                  remove(
                                    response.id,
                                  ),
                              )
                            }
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color={
                                COLORS.primary
                              }
                            />

                            <Text
                              style={
                                styles.deleteText
                              }
                            >
                              Delete
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              },
            )
          )}
        </ScrollView>

        <DonorBottomNav
          active="History"
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

      paddingTop: 18,

      paddingBottom: 30,
    },

    title: {
      fontSize: 22,

      fontWeight: '900',

      color: COLORS.text,
    },

    subtitle: {
      marginTop: 4,

      fontSize: 11,

      color:
        COLORS.textSecondary,
    },

    filters: {
      gap: 8,

      paddingVertical: 17,
    },

    filter: {
      paddingHorizontal: 14,

      paddingVertical: 7,

      borderRadius: 20,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,
    },

    activeFilter: {
      backgroundColor:
        COLORS.primary,

      borderColor:
        COLORS.primary,
    },

    filterText: {
      fontSize: 10,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

    activeFilterText: {
      color: COLORS.white,
    },

    loading: {
      paddingVertical: 90,

      alignItems:
        'center',
    },

    empty: {
      minHeight: 250,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 16,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    emptyTitle: {
      marginTop: 12,

      fontSize: 15,

      fontWeight: '800',

      color: COLORS.text,
    },

    emptyText: {
      marginTop: 5,

      fontSize: 11,

      color:
        COLORS.textSecondary,
    },

    card: {
      marginBottom: 11,

      borderRadius: 15,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      overflow: 'hidden',
    },

    cardMain: {
      padding: 13,

      flexDirection: 'row',

      alignItems:
        'center',
    },

    bloodCircle: {
      width: 44,
      height: 44,

      borderRadius: 22,

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

      fontSize: 12,

      fontWeight: '900',
    },

    cardContent: {
      flex: 1,
    },

    cardTop: {
      flexDirection: 'row',

      alignItems:
        'center',

      gap: 8,
    },

    hospital: {
      flex: 1,

      color: COLORS.text,

      fontSize: 13,

      fontWeight: '800',
    },

    location: {
      marginTop: 4,

      color:
        COLORS.textSecondary,

      fontSize: 10,
    },

    meta: {
      marginTop: 5,

      color:
        COLORS.textMuted,

      fontSize: 9,
    },

    cardActions: {
      borderTopWidth: 1,

      borderTopColor:
        COLORS.divider,

      flexDirection: 'row',

      justifyContent:
        'flex-end',

      paddingHorizontal: 12,

      paddingVertical: 8,

      gap: 8,
    },

    withdrawButton: {
      flexDirection: 'row',

      alignItems:
        'center',

      gap: 4,

      paddingHorizontal: 10,

      paddingVertical: 6,

      borderRadius: 8,

      backgroundColor:
        '#FFF2F3',
    },

    withdrawText: {
      color:
        COLORS.primary,

      fontSize: 10,

      fontWeight: '700',
    },

    deleteButton: {
      flexDirection: 'row',

      alignItems:
        'center',

      gap: 4,

      paddingHorizontal: 10,

      paddingVertical: 6,

      borderRadius: 8,

      backgroundColor:
        COLORS.primaryLight,
    },

    deleteText: {
      color:
        COLORS.primary,

      fontSize: 10,

      fontWeight: '700',
    },
  });
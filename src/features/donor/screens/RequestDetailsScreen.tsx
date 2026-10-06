import React, {
  useCallback,
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

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  auth,
} from '../../../config/firebase';

import {
  COLORS,
} from '../../../constants/colors';

import DonorScreenShell from '../components/DonorScreenShell';

import StatusBadge from '../components/StatusBadge';

import type {
  DonorStackParamList,
} from '../navigation/types';

import type {
  DonorResponse,
  DonorResponseChoice,
  EmergencyRequest,
} from '../types/donor';

import {
  getDonorResponseForRequest,
  getEmergencyRequestById,
  saveDonorResponse,
} from '../services/donorService';

type Props =
  NativeStackScreenProps<
    DonorStackParamList,
    'RequestDetails'
  >;

export default function RequestDetailsScreen({
  route,
  navigation,
}: Props) {
  const {
    requestId,
  } = route.params;

  const [
    request,
    setRequest,
  ] = useState<
    EmergencyRequest | null
  >(null);

  const [
    currentResponse,
    setCurrentResponse,
  ] = useState<
    DonorResponse | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  function showMessage(
    title: string,
    message: string,
  ) {
    if (
      Platform.OS === 'web' &&
      typeof window !==
        'undefined'
    ) {
      window.alert(
        `${title}\n\n${message}`,
      );

      return;
    }

    Alert.alert(
      title,
      message,
    );
  }

  const loadRequest =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const result =
            await getEmergencyRequestById(
              requestId,
            );

          setRequest(
            result,
          );

          const user =
            auth.currentUser;

          if (
            user &&
            result
          ) {
            const response =
              await getDonorResponseForRequest(
                user.uid,
                requestId,
              );

            setCurrentResponse(
              response,
            );
          }
        } catch (
          error
        ) {
          console.error(
            'Request details error:',
            error,
          );
        } finally {
          setLoading(false);
        }
      },
      [requestId],
    );

  useFocusEffect(
    useCallback(() => {
      void loadRequest();
    }, [loadRequest]),
  );

  async function submitResponse(
    response:
      DonorResponseChoice,
  ) {
    const user =
      auth.currentUser;

    if (
      !user ||
      !request
    ) {
      return;
    }

    try {
      setSubmitting(true);

      await saveDonorResponse(
        user.uid,
        request,
        response,
      );

      navigation.replace(
        'DonationConfirmation',
        {
          requestId:
            request.id,

          response,
        },
      );
    } catch (
      error
    ) {
      console.error(
        'Response error:',
        error,
      );

      showMessage(
        'Unable to respond',
        'Your response could not be saved. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DonorScreenShell>
        <View
          style={
            styles.center
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
            Loading request...
          </Text>
        </View>
      </DonorScreenShell>
    );
  }

  if (!request) {
    return (
      <DonorScreenShell>
        <View
          style={
            styles.center
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.notFoundTitle
            }
          >
            Request unavailable
          </Text>

          <Text
            style={
              styles.notFoundText
            }
          >
            This request may have
            been removed or closed.
          </Text>

          <Pressable
            style={
              styles.backHomeButton
            }
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.backHomeText
              }
            >
              Go Back
            </Text>
          </Pressable>
        </View>
      </DonorScreenShell>
    );
  }

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
              styles.topBar
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
                styles.pageTitle
              }
            >
              Request Details
            </Text>
          </View>

          <View
            style={
              styles.requestHero
            }
          >
            <View
              style={
                styles.largeBloodBadge
              }
            >
              <Text
                style={
                  styles.largeBloodText
                }
              >
                {
                  request.bloodGroup
                }
              </Text>
            </View>

            <StatusBadge
              status={
                request.urgency
              }
            />

            <Text
              style={
                styles.urgentLabel
              }
            >
              BLOOD REQUIREMENT
            </Text>

            <Text
              style={
                styles.patientName
              }
            >
              {
                request.patientName
              }
            </Text>
          </View>

          {request.verified ? (
            <View
              style={
                styles.verified
              }
            >
              <Ionicons
                name="shield-checkmark"
                size={17}
                color={
                  COLORS.success
                }
              />

              <Text
                style={
                  styles.verifiedText
                }
              >
                Verified emergency
                request
              </Text>
            </View>
          ) : null}

          <DetailCard
            icon="business-outline"
            label="Hospital"
            value={
              request.hospitalName
            }
          />

          <DetailCard
            icon="location-outline"
            label="Location"
            value={
              request.location
            }
          />

          <View
            style={
              styles.twoColumns
            }
          >
            <SmallDetail
              label="Blood Group"
              value={
                request.bloodGroup
              }
            />

            <SmallDetail
              label="Units Required"
              value={`${request.unitsRequired}`}
            />
          </View>

          <View
            style={
              styles.twoColumns
            }
          >
            <SmallDetail
              label="Required Date"
              value={
                request.requiredDate
              }
            />

            <SmallDetail
              label="Urgency"
              value={
                request.urgency
              }
            />
          </View>

          {request.notes ? (
            <View
              style={
                styles.notesCard
              }
            >
              <Text
                style={
                  styles.detailLabel
                }
              >
                Additional Notes
              </Text>

              <Text
                style={
                  styles.notes
                }
              >
                {request.notes}
              </Text>
            </View>
          ) : null}

          {request.contactName ||
          request.contactPhone ? (
            <View
              style={
                styles.contactCard
              }
            >
              <Text
                style={
                  styles.contactTitle
                }
              >
                Contact Information
              </Text>

              {request.contactName ? (
                <View
                  style={
                    styles.contactRow
                  }
                >
                  <Ionicons
                    name="person-outline"
                    size={17}
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.contactText
                    }
                  >
                    {
                      request.contactName
                    }
                  </Text>
                </View>
              ) : null}

              {request.contactPhone ? (
                <View
                  style={
                    styles.contactRow
                  }
                >
                  <Ionicons
                    name="call-outline"
                    size={17}
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.contactText
                    }
                  >
                    {
                      request.contactPhone
                    }
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {currentResponse ? (
            <View
              style={
                styles.responseInfo
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={
                  COLORS.primary
                }
              />

              <Text
                style={
                  styles.responseInfoText
                }
              >
                You previously{' '}
                <Text
                  style={
                    styles.responseStrong
                  }
                >
                  {
                    currentResponse.response
                  }
                </Text>{' '}
                this request. You
                can update your
                response below.
              </Text>
            </View>
          ) : null}

          <View
            style={
              styles.safetyNote
            }
          >
            <Ionicons
              name="heart-outline"
              size={18}
              color={
                COLORS.primary
              }
            />

            <Text
              style={
                styles.safetyText
              }
            >
              Only accept if you
              are currently
              available and able
              to donate safely.
            </Text>
          </View>
        </ScrollView>

        <View
          style={
            styles.actions
          }
        >
          <Pressable
            disabled={
              submitting
            }
            style={[
              styles.declineButton,

              submitting &&
                styles.disabled,
            ]}
            onPress={() =>
              submitResponse(
                'declined',
              )
            }
          >
            <Text
              style={
                styles.declineText
              }
            >
              Decline
            </Text>
          </Pressable>

          <Pressable
            disabled={
              submitting
            }
            style={[
              styles.acceptButton,

              submitting &&
                styles.disabled,
            ]}
            onPress={() =>
              submitResponse(
                'accepted',
              )
            }
          >
            <Text
              style={
                styles.acceptText
              }
            >
              {submitting
                ? 'Saving...'
                : 'Accept Request'}
            </Text>
          </Pressable>
        </View>
      </View>
    </DonorScreenShell>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon:
    | 'business-outline'
    | 'location-outline';

  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.detailCard
      }
    >
      <View
        style={
          styles.detailIcon
        }
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            COLORS.primary
          }
        />
      </View>

      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={
            styles.detailLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.detailValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function SmallDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.smallDetail
      }
    >
      <Text
        style={
          styles.detailLabel
        }
      >
        {label}
      </Text>

      <Text
        style={[
          styles.detailValue,
          {
            textTransform:
              label ===
              'Urgency'
                ? 'capitalize'
                : 'none',
          },
        ]}
      >
        {value}
      </Text>
    </View>
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

      paddingBottom: 25,
    },

    topBar: {
      flexDirection: 'row',

      alignItems: 'center',

      marginBottom: 22,
    },

    backButton: {
      width: 41,
      height: 41,

      borderRadius: 21,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 12,
    },

    pageTitle: {
      fontSize: 16,

      fontWeight: '800',

      color: COLORS.text,
    },

    requestHero: {
      alignItems: 'center',

      paddingBottom: 20,
    },

    largeBloodBadge: {
      width: 74,
      height: 74,

      borderRadius: 37,

      backgroundColor:
        COLORS.primaryLight,

      alignItems: 'center',

      justifyContent:
        'center',

      marginBottom: 10,
    },

    largeBloodText: {
      fontSize: 24,

      fontWeight: '900',

      color:
        COLORS.primary,
    },

    urgentLabel: {
      marginTop: 10,

      fontSize: 9,

      letterSpacing: 1,

      fontWeight: '800',

      color:
        COLORS.primary,
    },

    patientName: {
      marginTop: 5,

      fontSize: 20,

      fontWeight: '900',

      color: COLORS.text,
    },

    verified: {
      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 6,

      paddingVertical: 10,

      borderRadius: 11,

      backgroundColor:
        '#EAF8F0',

      marginBottom: 12,
    },

    verifiedText: {
      color:
        COLORS.success,

      fontSize: 11,

      fontWeight: '700',
    },

    detailCard: {
      minHeight: 70,

      padding: 13,

      backgroundColor:
        COLORS.white,

      borderRadius: 13,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      flexDirection: 'row',

      alignItems:
        'center',

      marginBottom: 10,
    },

    detailIcon: {
      width: 40,
      height: 40,

      borderRadius: 20,

      backgroundColor:
        COLORS.primaryLight,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 11,
    },

    detailLabel: {
      fontSize: 10,

      color:
        COLORS.textMuted,

      fontWeight: '600',
    },

    detailValue: {
      marginTop: 4,

      fontSize: 13,

      color: COLORS.text,

      fontWeight: '700',
    },

    twoColumns: {
      flexDirection: 'row',

      gap: 10,

      marginBottom: 10,
    },

    smallDetail: {
      flex: 1,

      minHeight: 68,

      padding: 13,

      borderRadius: 13,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      justifyContent:
        'center',
    },

    notesCard: {
      padding: 14,

      borderRadius: 13,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      marginBottom: 10,
    },

    notes: {
      marginTop: 7,

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.textSecondary,
    },

    contactCard: {
      padding: 14,

      borderRadius: 13,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      marginBottom: 10,
    },

    contactTitle: {
      fontSize: 12,

      fontWeight: '800',

      color: COLORS.text,

      marginBottom: 9,
    },

    contactRow: {
      flexDirection: 'row',

      alignItems:
        'center',

      gap: 8,

      marginTop: 6,
    },

    contactText: {
      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    responseInfo: {
      flexDirection: 'row',

      gap: 9,

      padding: 13,

      borderRadius: 12,

      backgroundColor:
        COLORS.primaryLight,

      marginTop: 2,
    },

    responseInfoText: {
      flex: 1,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.textSecondary,
    },

    responseStrong: {
      fontWeight: '900',

      color:
        COLORS.primary,

      textTransform:
        'capitalize',
    },

    safetyNote: {
      marginTop: 12,

      flexDirection: 'row',

      gap: 8,

      alignItems:
        'center',

      padding: 12,

      borderRadius: 11,

      backgroundColor:
        '#FFF5F5',
    },

    safetyText: {
      flex: 1,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.textSecondary,
    },

    actions: {
      paddingHorizontal:
        18,

      paddingVertical: 12,

      backgroundColor:
        COLORS.white,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,

      flexDirection: 'row',

      gap: 10,
    },

    declineButton: {
      flex: 1,

      height: 49,

      borderRadius: 10,

      borderWidth: 1.5,

      borderColor:
        COLORS.primary,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    declineText: {
      color:
        COLORS.primary,

      fontSize: 13,

      fontWeight: '800',
    },

    acceptButton: {
      flex: 1.4,

      height: 49,

      borderRadius: 10,

      backgroundColor:
        COLORS.primary,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    acceptText: {
      color: COLORS.white,

      fontSize: 13,

      fontWeight: '800',
    },

    disabled: {
      opacity: 0.55,
    },

    center: {
      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',

      padding: 25,
    },

    loadingText: {
      marginTop: 12,

      color:
        COLORS.textSecondary,
    },

    notFoundTitle: {
      marginTop: 12,

      fontWeight: '800',

      fontSize: 17,

      color: COLORS.text,
    },

    notFoundText: {
      marginTop: 6,

      color:
        COLORS.textSecondary,

      textAlign: 'center',
    },

    backHomeButton: {
      marginTop: 20,

      backgroundColor:
        COLORS.primary,

      borderRadius: 9,

      paddingHorizontal: 20,

      paddingVertical: 10,
    },

    backHomeText: {
      color: COLORS.white,

      fontWeight: '800',
    },
  });
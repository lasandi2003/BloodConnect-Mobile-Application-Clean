import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
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
  COLORS,
} from '../../../constants/colors';

import DonorScreenShell from '../components/DonorScreenShell';

import type {
  DonorStackParamList,
} from '../navigation/types';

import type {
  EmergencyRequest,
} from '../types/donor';

import {
  getEmergencyRequestById,
} from '../services/donorService';

type Props =
  NativeStackScreenProps<
    DonorStackParamList,
    'DonationConfirmation'
  >;

export default function DonationConfirmationScreen({
  route,
  navigation,
}: Props) {
  const {
    requestId,
    response,
  } = route.params;

  const [
    request,
    setRequest,
  ] = useState<
    EmergencyRequest | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const accepted =
    response ===
    'accepted';

  useEffect(() => {
    async function load() {
      try {
        const result =
          await getEmergencyRequestById(
            requestId,
          );

        setRequest(
          result,
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [requestId]);

  return (
    <DonorScreenShell>
      <View
        style={
          styles.container
        }
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={
              COLORS.primary
            }
          />
        ) : (
          <>
            <View
              style={[
                styles.iconCircle,

                !accepted &&
                  styles.declineCircle,
              ]}
            >
              <Ionicons
                name={
                  accepted
                    ? 'checkmark'
                    : 'close'
                }
                size={43}
                color={
                  accepted
                    ? COLORS.success
                    : COLORS.primary
                }
              />
            </View>

            <Text
              style={
                styles.title
              }
            >
              {accepted
                ? 'Thank You!'
                : 'Response Saved'}
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              {accepted
                ? 'Donation request accepted. The hospital will be able to view your response.'
                : 'You have declined this request. Your response has been saved successfully.'}
            </Text>

            {request ? (
              <View
                style={
                  styles.summary
                }
              >
                <View
                  style={
                    styles.summaryHeader
                  }
                >
                  <View
                    style={
                      styles.blood
                    }
                  >
                    <Text
                      style={
                        styles.bloodText
                      }
                    >
                      {
                        request.bloodGroup
                      }
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.hospital
                      }
                    >
                      {
                        request.hospitalName
                      }
                    </Text>

                    <Text
                      style={
                        styles.location
                      }
                    >
                      {
                        request.location
                      }
                    </Text>
                  </View>
                </View>

                <SummaryRow
                  label="Patient"
                  value={
                    request.patientName
                  }
                />

                <SummaryRow
                  label="Required Date"
                  value={
                    request.requiredDate
                  }
                />

                <SummaryRow
                  label="Units Needed"
                  value={`${request.unitsRequired}`}
                />
              </View>
            ) : null}

            {accepted ? (
              <View
                style={
                  styles.notice
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
                    styles.noticeText
                  }
                >
                  Remember to carry
                  valid identification
                  and follow the
                  hospital's donation
                  instructions.
                </Text>
              </View>
            ) : null}

            <Pressable
              style={
                styles.primaryButton
              }
              onPress={() =>
                navigation.reset({
                  index: 0,

                  routes: [
                    {
                      name:
                        'DonorDashboard',
                    },
                  ],
                })
              }
            >
              <Text
                style={
                  styles.primaryText
                }
              >
                Back to Home
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.secondaryButton
              }
              onPress={() =>
                navigation.navigate(
                  'DonationHistory',
                )
              }
            >
              <Text
                style={
                  styles.secondaryText
                }
              >
                View Donation History
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </DonorScreenShell>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.summaryRow
      }
    >
      <Text
        style={
          styles.summaryLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.summaryValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      justifyContent:
        'center',

      paddingHorizontal:
        24,

      paddingVertical: 30,
    },

    iconCircle: {
      alignSelf: 'center',

      width: 88,
      height: 88,

      borderRadius: 44,

      backgroundColor:
        '#E6F7EE',

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    declineCircle: {
      backgroundColor:
        COLORS.primaryLight,
    },

    title: {
      marginTop: 18,

      textAlign: 'center',

      fontSize: 24,

      fontWeight: '900',

      color: COLORS.text,
    },

    subtitle: {
      marginTop: 8,

      textAlign: 'center',

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.textSecondary,
    },

    summary: {
      marginTop: 25,

      padding: 16,

      borderRadius: 15,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,
    },

    summaryHeader: {
      flexDirection: 'row',

      alignItems:
        'center',

      marginBottom: 13,
    },

    blood: {
      width: 44,
      height: 44,

      borderRadius: 22,

      backgroundColor:
        COLORS.primaryLight,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 11,
    },

    bloodText: {
      color:
        COLORS.primary,

      fontWeight: '900',
    },

    hospital: {
      fontWeight: '800',

      color: COLORS.text,

      fontSize: 13,
    },

    location: {
      marginTop: 3,

      fontSize: 10,

      color:
        COLORS.textSecondary,
    },

    summaryRow: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      paddingVertical: 8,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.divider,
    },

    summaryLabel: {
      color:
        COLORS.textSecondary,

      fontSize: 11,
    },

    summaryValue: {
      color: COLORS.text,

      fontSize: 11,

      fontWeight: '700',
    },

    notice: {
      marginTop: 14,

      padding: 13,

      borderRadius: 12,

      flexDirection: 'row',

      gap: 8,

      backgroundColor:
        '#FFF3F4',
    },

    noticeText: {
      flex: 1,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.textSecondary,
    },

    primaryButton: {
      height: 50,

      marginTop: 20,

      backgroundColor:
        COLORS.primary,

      borderRadius: 10,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    primaryText: {
      color: COLORS.white,

      fontWeight: '800',

      fontSize: 13,
    },

    secondaryButton: {
      height: 48,

      marginTop: 10,

      borderWidth: 1,

      borderColor:
        COLORS.primary,

      borderRadius: 10,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    secondaryText: {
      color:
        COLORS.primary,

      fontWeight: '800',

      fontSize: 12,
    },
  });
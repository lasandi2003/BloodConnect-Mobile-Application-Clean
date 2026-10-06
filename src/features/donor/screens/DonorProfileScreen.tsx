import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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

import type {
  DonorStackParamList,
} from '../navigation/types';

import type {
  BloodGroup,
  DonorProfile,
} from '../types/donor';

import {
  getDonorProfile,
  saveDonorProfile,
} from '../services/donorService';

type Navigation =
  NativeStackNavigationProp<
    DonorStackParamList
  >;

const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

export default function DonorProfileScreen() {
  const navigation =
    useNavigation<Navigation>();

  const [
    existing,
    setExisting,
  ] = useState<
    DonorProfile | null
  >(null);

  const [
    fullName,
    setFullName,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    phone,
    setPhone,
  ] = useState('');

  const [
    age,
    setAge,
  ] = useState('');

  const [
    bloodGroup,
    setBloodGroup,
  ] = useState<
    BloodGroup | undefined
  >();

  const [
    district,
    setDistrict,
  ] = useState('');

  const [
    city,
    setCity,
  ] = useState('');

  const [
    address,
    setAddress,
  ] = useState('');

  const [
    lastDonationDate,
    setLastDonationDate,
  ] = useState('');

  const [
    isAvailable,
    setIsAvailable,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
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

  const loadProfile =
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

          const data =
            await getDonorProfile(
              user.uid,
            );

          setExisting(
            data,
          );

          setFullName(
            data.fullName ??
              '',
          );

          setEmail(
            data.email ||
              user.email ||
              '',
          );

          setPhone(
            data.phone ??
              '',
          );

          setAge(
            data.age
              ? String(
                  data.age,
                )
              : '',
          );

          setBloodGroup(
            data.bloodGroup,
          );

          setDistrict(
            data.district ??
              '',
          );

          setCity(
            data.city ??
              '',
          );

          setAddress(
            data.address ??
              '',
          );

          setLastDonationDate(
            data.lastDonationDate ??
              '',
          );

          setIsAvailable(
            data.isAvailable ??
              true,
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  async function saveProfile() {
    const user =
      auth.currentUser;

    if (!user) {
      return;
    }

    const ageValue =
      Number(age);

    if (
      fullName.trim().length <
      2
    ) {
      showMessage(
        'Invalid name',
        'Please enter your full name.',
      );

      return;
    }

    if (
      !Number.isFinite(
        ageValue,
      ) ||
      ageValue < 18 ||
      ageValue > 65
    ) {
      showMessage(
        'Invalid age',
        'For this donor profile, enter an age between 18 and 65.',
      );

      return;
    }

    if (!bloodGroup) {
      showMessage(
        'Blood group required',
        'Please select your blood group.',
      );

      return;
    }

    if (
      phone.trim().length <
      9
    ) {
      showMessage(
        'Invalid phone number',
        'Please enter a valid contact number.',
      );

      return;
    }

    if (
      district.trim().length <
        2 ||
      city.trim().length < 2
    ) {
      showMessage(
        'Location required',
        'Please enter your district and city.',
      );

      return;
    }

    try {
      setSaving(true);

      await saveDonorProfile(
        user.uid,
        {
          fullName,

          email:
            email ||
            user.email ||
            '',

          phone,

          age:
            ageValue,

          bloodGroup,

          district,

          city,

          address,

          isAvailable,

          lastDonationDate:
            lastDonationDate.trim(),
        },
      );

      showMessage(
        existing?.profileCompleted
          ? 'Profile updated'
          : 'Profile completed',
        'Your donor information has been saved successfully.',
      );

      await loadProfile();
    } catch (
      error
    ) {
      console.error(
        'Profile save error:',
        error,
      );

      showMessage(
        'Save failed',
        'Your profile could not be saved. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DonorScreenShell>
      <KeyboardAvoidingView
        style={
          styles.screen
        }
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
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
          ) : (
            <>
              <View
                style={
                  styles.header
                }
              >
                <View
                  style={
                    styles.avatar
                  }
                >
                  <Ionicons
                    name="person"
                    size={31}
                    color={
                      COLORS.primary
                    }
                  />
                </View>

                <Text
                  style={
                    styles.name
                  }
                >
                  {fullName ||
                    'My Profile'}
                </Text>

                <Text
                  style={
                    styles.bloodLabel
                  }
                >
                  Blood Group:{' '}
                  {bloodGroup ??
                    'Not set'}
                </Text>
              </View>

              <View
                style={
                  styles.availabilityCard
                }
              >
                <View
                  style={
                    styles.availabilityIcon
                  }
                >
                  <Ionicons
                    name={
                      isAvailable
                        ? 'checkmark-circle'
                        : 'pause-circle'
                    }
                    size={22}
                    color={
                      isAvailable
                        ? COLORS.success
                        : COLORS.textMuted
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
                      styles.availabilityTitle
                    }
                  >
                    {isAvailable
                      ? 'Available to Donate'
                      : 'Not Available'}
                  </Text>

                  <Text
                    style={
                      styles.availabilitySubtitle
                    }
                  >
                    Update your current
                    donor availability.
                  </Text>
                </View>

                <Switch
                  value={
                    isAvailable
                  }
                  onValueChange={
                    setIsAvailable
                  }
                  trackColor={{
                    false:
                      '#D6D6D6',

                    true:
                      '#8FC4A5',
                  }}
                  thumbColor={
                    isAvailable
                      ? COLORS.success
                      : '#FFFFFF'
                  }
                />
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Personal Information
              </Text>

              <Field
                label="Full Name"
                icon="person-outline"
                value={fullName}
                onChangeText={
                  setFullName
                }
                placeholder="Full name"
              />

              <Field
                label="Email Address"
                icon="mail-outline"
                value={email}
                onChangeText={
                  setEmail
                }
                placeholder="Email"
                editable={false}
              />

              <Field
                label="Phone Number"
                icon="call-outline"
                value={phone}
                onChangeText={
                  setPhone
                }
                placeholder="+94 7X XXX XXXX"
                keyboardType="phone-pad"
              />

              <Field
                label="Age"
                icon="calendar-outline"
                value={age}
                onChangeText={
                  setAge
                }
                placeholder="Age"
                keyboardType="number-pad"
              />

              <Text
                style={
                  styles.fieldLabel
                }
              >
                Blood Group
              </Text>

              <View
                style={
                  styles.bloodGrid
                }
              >
                {BLOOD_GROUPS.map(
                  group => {
                    const selected =
                      bloodGroup ===
                      group;

                    return (
                      <Pressable
                        key={
                          group
                        }
                        style={[
                          styles.bloodOption,

                          selected &&
                            styles.selectedBloodOption,
                        ]}
                        onPress={() =>
                          setBloodGroup(
                            group,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.bloodOptionText,

                            selected &&
                              styles.selectedBloodText,
                          ]}
                        >
                          {group}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Location
              </Text>

              <Field
                label="District"
                icon="map-outline"
                value={district}
                onChangeText={
                  setDistrict
                }
                placeholder="e.g. Kandy"
              />

              <Field
                label="City"
                icon="location-outline"
                value={city}
                onChangeText={
                  setCity
                }
                placeholder="City / town"
              />

              <Field
                label="Address"
                icon="home-outline"
                value={address}
                onChangeText={
                  setAddress
                }
                placeholder="Address"
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Donation Information
              </Text>

              <Field
                label="Last Donation Date"
                icon="time-outline"
                value={
                  lastDonationDate
                }
                onChangeText={
                  setLastDonationDate
                }
                placeholder="YYYY-MM-DD (optional)"
              />

              <Pressable
                disabled={saving}
                style={[
                  styles.saveButton,

                  saving &&
                    styles.disabled,
                ]}
                onPress={
                  saveProfile
                }
              >
                <Ionicons
                  name="save-outline"
                  size={18}
                  color={
                    COLORS.white
                  }
                />

                <Text
                  style={
                    styles.saveText
                  }
                >
                  {saving
                    ? 'Saving...'
                    : existing?.profileCompleted
                      ? 'Update Profile'
                      : 'Save Profile'}
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.historyLink
                }
                onPress={() =>
                  navigation.navigate(
                    'DonationHistory',
                  )
                }
              >
                <Text
                  style={
                    styles.historyText
                  }
                >
                  My Donation History
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={
                    COLORS.textMuted
                  }
                />
              </Pressable>
            </>
          )}
        </ScrollView>

        <DonorBottomNav
          active="Profile"
        />
      </KeyboardAvoidingView>
    </DonorScreenShell>
  );
}

interface FieldProps {
  label: string;

  icon:
    | 'person-outline'
    | 'mail-outline'
    | 'call-outline'
    | 'calendar-outline'
    | 'map-outline'
    | 'location-outline'
    | 'home-outline'
    | 'time-outline';

  value: string;

  onChangeText:
    (
      text: string,
    ) => void;

  placeholder: string;

  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad'
    | 'number-pad';

  editable?: boolean;
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
}: FieldProps) {
  return (
    <View
      style={
        styles.fieldContainer
      }
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,

          !editable &&
            styles.disabledInput,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            COLORS.textMuted
          }
        />

        <TextInput
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor={
            COLORS.textMuted
          }
          keyboardType={
            keyboardType
          }
          editable={editable}
          style={
            styles.input
          }
        />
      </View>
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

      paddingTop: 17,

      paddingBottom: 35,
    },

    loading: {
      minHeight: 500,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    header: {
      alignItems:
        'center',

      marginBottom: 18,
    },

    avatar: {
      width: 72,
      height: 72,

      borderRadius: 36,

      backgroundColor:
        COLORS.primaryLight,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    name: {
      marginTop: 10,

      fontSize: 18,

      fontWeight: '900',

      color: COLORS.text,
    },

    bloodLabel: {
      marginTop: 4,

      fontSize: 10,

      fontWeight: '700',

      color:
        COLORS.primary,
    },

    availabilityCard: {
      minHeight: 72,

      padding: 13,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      flexDirection: 'row',

      alignItems:
        'center',

      marginBottom: 22,
    },

    availabilityIcon: {
      width: 41,
      height: 41,

      borderRadius: 21,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F4F7F5',

      marginRight: 10,
    },

    availabilityTitle: {
      fontSize: 13,

      fontWeight: '800',

      color: COLORS.text,
    },

    availabilitySubtitle: {
      marginTop: 3,

      fontSize: 9,

      color:
        COLORS.textSecondary,
    },

    sectionTitle: {
      marginTop: 7,

      marginBottom: 12,

      fontSize: 14,

      fontWeight: '900',

      color: COLORS.text,
    },

    fieldContainer: {
      marginBottom: 13,
    },

    fieldLabel: {
      marginBottom: 6,

      fontSize: 11,

      fontWeight: '600',

      color:
        COLORS.textSecondary,
    },

    inputContainer: {
      height: 49,

      paddingHorizontal: 12,

      borderRadius: 11,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      flexDirection: 'row',

      alignItems:
        'center',
    },

    disabledInput: {
      backgroundColor:
        '#F3F3F3',
    },

    input: {
      flex: 1,

      marginLeft: 9,

      fontSize: 12,

      color: COLORS.text,
    },

    bloodGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 8,

      marginBottom: 19,
    },

    bloodOption: {
      width: '22%',

      height: 42,

      borderRadius: 9,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    selectedBloodOption: {
      backgroundColor:
        COLORS.primary,

      borderColor:
        COLORS.primary,
    },

    bloodOptionText: {
      fontSize: 12,

      fontWeight: '800',

      color: COLORS.text,
    },

    selectedBloodText: {
      color: COLORS.white,
    },

    saveButton: {
      marginTop: 8,

      height: 51,

      borderRadius: 10,

      backgroundColor:
        COLORS.primary,

      flexDirection: 'row',

      gap: 7,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    saveText: {
      color: COLORS.white,

      fontSize: 13,

      fontWeight: '800',
    },

    disabled: {
      opacity: 0.55,
    },

    historyLink: {
      height: 52,

      paddingHorizontal: 4,

      marginTop: 13,

      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    historyText: {
      color: COLORS.text,

      fontWeight: '700',

      fontSize: 12,
    },
  });
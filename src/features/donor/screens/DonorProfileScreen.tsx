import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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

interface ProfileErrors {
  fullName?: string;
  phone?: string;
  age?: string;
  bloodGroup?: string;
  district?: string;
  city?: string;
  lastDonationDate?: string;
}

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

const DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

const WEEK_DAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDate(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0');

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(
  value: string,
) {
  if (!value) {
    return '';
  }

  const parts =
    value.split('-');

  if (parts.length !== 3) {
    return value;
  }

  const year =
    Number(parts[0]);

  const month =
    Number(parts[1]);

  const day =
    Number(parts[2]);

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day} ${
    MONTHS[month - 1]
  } ${year}`;
}

function parseDate(
  value: string,
) {
  const parts =
    value.split('-');

  if (parts.length !== 3) {
    return null;
  }

  const year =
    Number(parts[0]);

  const month =
    Number(parts[1]);

  const day =
    Number(parts[2]);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  const date =
    new Date(
      year,
      month - 1,
      day,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  if (
    date.getFullYear() !== year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function isValidSriLankanPhone(
  value: string,
) {
  const normalized =
    value
      .replace(/\s/g, '')
      .replace(/-/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '');

  return (
    /^07\d{8}$/.test(
      normalized,
    ) ||
    /^\+947\d{8}$/.test(
      normalized,
    )
  );
}

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

  const [
    errors,
    setErrors,
  ] = useState<ProfileErrors>(
    {},
  );

  // ==========================================
  // DISTRICT PICKER
  // ==========================================

  const [
    districtModalVisible,
    setDistrictModalVisible,
  ] = useState(false);

  const [
    districtSearch,
    setDistrictSearch,
  ] = useState('');

  // ==========================================
  // DATE PICKER
  // ==========================================

  const [
    dateModalVisible,
    setDateModalVisible,
  ] = useState(false);

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ),
  );

  // ==========================================
  // BLOOD GROUP CONFIRMATION
  // ==========================================

  const [
    bloodGroupModalVisible,
    setBloodGroupModalVisible,
  ] = useState(false);

  const [
    pendingBloodGroup,
    setPendingBloodGroup,
  ] = useState<
    BloodGroup | null
  >(null);

  // ==========================================
  // MESSAGE
  // ==========================================

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

  // ==========================================
  // ERROR HELPERS
  // ==========================================

  function clearError(
    field: keyof ProfileErrors,
  ) {
    setErrors(
      current => ({
        ...current,
        [field]: undefined,
      }),
    );
  }

  // ==========================================
  // LOAD PROFILE
  // ==========================================

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

          setExisting(data);

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

          setErrors({});
        } catch (error) {
          console.error(
            'Profile load error:',
            error,
          );

          showMessage(
            'Unable to load',
            'Your donor profile could not be loaded.',
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

  // ==========================================
  // DISTRICT PICKER
  // ==========================================

  const filteredDistricts =
    useMemo(
      () => {
        const search =
          districtSearch
            .trim()
            .toLowerCase();

        if (!search) {
          return DISTRICTS;
        }

        return DISTRICTS.filter(
          item =>
            item
              .toLowerCase()
              .includes(
                search,
              ),
        );
      },
      [districtSearch],
    );

  function openDistrictPicker() {
    setDistrictSearch('');

    setDistrictModalVisible(
      true,
    );
  }

  function selectDistrict(
    value: string,
  ) {
    setDistrict(value);

    clearError(
      'district',
    );

    setDistrictModalVisible(
      false,
    );

    setDistrictSearch('');
  }

  // ==========================================
  // DATE PICKER
  // ==========================================

  function openDatePicker() {
    const selected =
      parseDate(
        lastDonationDate,
      );

    const base =
      selected ??
      new Date();

    setCalendarMonth(
      new Date(
        base.getFullYear(),
        base.getMonth(),
        1,
      ),
    );

    setDateModalVisible(
      true,
    );
  }

  function previousMonth() {
    setCalendarMonth(
      current =>
        new Date(
          current.getFullYear(),
          current.getMonth() -
            1,
          1,
        ),
    );
  }

  function nextMonth() {
    const next =
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() +
          1,
        1,
      );

    const now =
      new Date();

    const currentMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );

    if (
      next <= currentMonth
    ) {
      setCalendarMonth(
        next,
      );
    }
  }

  function selectDonationDate(
    day: number,
  ) {
    const selected =
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        day,
      );

    const currentDate =
      startOfDay(
        new Date(),
      );

    if (
      selected >
      currentDate
    ) {
      return;
    }

    setLastDonationDate(
      formatDate(
        selected,
      ),
    );

    clearError(
      'lastDonationDate',
    );

    setDateModalVisible(
      false,
    );
  }

  function clearDonationDate() {
    setLastDonationDate('');

    clearError(
      'lastDonationDate',
    );

    setDateModalVisible(
      false,
    );
  }

  const calendarDays =
    useMemo(
      () => {
        const year =
          calendarMonth.getFullYear();

        const month =
          calendarMonth.getMonth();

        const firstDay =
          new Date(
            year,
            month,
            1,
          ).getDay();

        const daysInMonth =
          new Date(
            year,
            month + 1,
            0,
          ).getDate();

        const result: Array<
          number | null
        > = [];

        for (
          let index = 0;
          index < firstDay;
          index += 1
        ) {
          result.push(null);
        }

        for (
          let day = 1;
          day <= daysInMonth;
          day += 1
        ) {
          result.push(day);
        }

        while (
          result.length % 7 !==
          0
        ) {
          result.push(null);
        }

        return result;
      },
      [calendarMonth],
    );

  const selectedDate =
    parseDate(
      lastDonationDate,
    );

  const today =
    startOfDay(
      new Date(),
    );

  const isCurrentMonth =
    calendarMonth.getFullYear() ===
      today.getFullYear() &&
    calendarMonth.getMonth() ===
      today.getMonth();

  // ==========================================
  // BLOOD GROUP CHANGE
  // ==========================================

  function handleBloodGroupSelect(
    group: BloodGroup,
  ) {
    if (
      group === bloodGroup
    ) {
      return;
    }

    /*
     * First time completing the profile:
     * user can select normally.
     */
    if (
      !existing?.profileCompleted ||
      !existing.bloodGroup
    ) {
      setBloodGroup(group);

      clearError(
        'bloodGroup',
      );

      return;
    }

    /*
     * If selecting the original saved
     * blood group again, no warning needed.
     */
    if (
      group ===
      existing.bloodGroup
    ) {
      setBloodGroup(group);

      clearError(
        'bloodGroup',
      );

      return;
    }

    /*
     * Existing donor is changing
     * an important matching value.
     */
    setPendingBloodGroup(
      group,
    );

    setBloodGroupModalVisible(
      true,
    );
  }

  function cancelBloodGroupChange() {
    setPendingBloodGroup(
      null,
    );

    setBloodGroupModalVisible(
      false,
    );
  }

  function confirmBloodGroupChange() {
    if (
      !pendingBloodGroup
    ) {
      return;
    }

    setBloodGroup(
      pendingBloodGroup,
    );

    clearError(
      'bloodGroup',
    );

    setPendingBloodGroup(
      null,
    );

    setBloodGroupModalVisible(
      false,
    );
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  function validateProfile() {
    const newErrors: ProfileErrors =
      {};

    const ageValue =
      Number(age);

    if (
      fullName.trim().length <
      2
    ) {
      newErrors.fullName =
        'Please enter your full name.';
    }

    if (!phone.trim()) {
      newErrors.phone =
        'Phone number is required.';
    } else if (
      !isValidSriLankanPhone(
        phone,
      )
    ) {
      newErrors.phone =
        'Enter a valid number such as 0771234567 or +94771234567.';
    }

    if (!age.trim()) {
      newErrors.age =
        'Age is required.';
    } else if (
      !Number.isFinite(
        ageValue,
      ) ||
      ageValue < 18 ||
      ageValue > 65
    ) {
      newErrors.age =
        'Age must be between 18 and 65.';
    }

    if (!bloodGroup) {
      newErrors.bloodGroup =
        'Please select your blood group.';
    }

    if (!district) {
      newErrors.district =
        'Please select your district.';
    }

    if (
      city.trim().length <
      2
    ) {
      newErrors.city =
        'Please enter your city or town.';
    }

    if (
      lastDonationDate
    ) {
      const parsed =
        parseDate(
          lastDonationDate,
        );

      if (!parsed) {
        newErrors.lastDonationDate =
          'Please select a valid date.';
      } else if (
        startOfDay(
          parsed,
        ) > today
      ) {
        newErrors.lastDonationDate =
          'Last donation date cannot be in the future.';
      }
    }

    setErrors(
      newErrors,
    );

    return (
      Object.keys(
        newErrors,
      ).length === 0
    );
  }

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  async function saveProfile() {
    const user =
      auth.currentUser;

    if (!user) {
      return;
    }

    const valid =
      validateProfile();

    if (!valid) {
      showMessage(
        'Check your information',
        'Please correct the highlighted fields before saving your profile.',
      );

      return;
    }

    const ageValue =
      Number(age);

    try {
      setSaving(true);

      await saveDonorProfile(
        user.uid,
        {
          fullName:
            fullName.trim(),

          email:
            email ||
            user.email ||
            '',

          phone:
            phone.trim(),

          age:
            ageValue,

          bloodGroup:
            bloodGroup!,

          district,

          city:
            city.trim(),

          address:
            address.trim(),

          isAvailable,

          lastDonationDate,
        },
      );

      setErrors({});

      showMessage(
        existing?.profileCompleted
          ? 'Profile updated'
          : 'Profile completed',
        'Your donor information has been saved successfully.',
      );

      await loadProfile();
    } catch (error) {
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

  // ==========================================
  // UI
  // ==========================================

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
              {/* PROFILE HEADER */}

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

              {/* AVAILABILITY */}

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
                    Update your current donor availability.
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

              {/* PERSONAL INFORMATION */}

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
                  value => {
                    setFullName(
                      value,
                    );

                    clearError(
                      'fullName',
                    );
                  }
                }
                placeholder="Full name"
                error={
                  errors.fullName
                }
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
                  value => {
                    setPhone(
                      value,
                    );

                    clearError(
                      'phone',
                    );
                  }
                }
                placeholder="+94 7X XXX XXXX"
                keyboardType="phone-pad"
                error={
                  errors.phone
                }
              />

              <Field
                label="Age"
                icon="calendar-outline"
                value={age}
                onChangeText={
                  value => {
                    setAge(
                      value,
                    );

                    clearError(
                      'age',
                    );
                  }
                }
                placeholder="Age"
                keyboardType="number-pad"
                error={
                  errors.age
                }
              />

              {/* BLOOD GROUP */}

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
                          handleBloodGroupSelect(
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

              {errors.bloodGroup && (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    errors.bloodGroup
                  }
                </Text>
              )}

              {/* LOCATION */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Location
              </Text>

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
                  District
                </Text>

                <Pressable
                  onPress={
                    openDistrictPicker
                  }
                  style={[
                    styles.pickerField,

                    errors.district &&
                      styles.errorBorder,
                  ]}
                >
                  <Ionicons
                    name="map-outline"
                    size={18}
                    color={
                      COLORS.textMuted
                    }
                  />

                  <Text
                    style={[
                      styles.pickerFieldText,

                      !district &&
                        styles.placeholderText,
                    ]}
                  >
                    {district ||
                      'Select district'}
                  </Text>

                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={
                      COLORS.textMuted
                    }
                  />
                </Pressable>

                {errors.district && (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {
                      errors.district
                    }
                  </Text>
                )}
              </View>

              <Field
                label="City"
                icon="location-outline"
                value={city}
                onChangeText={
                  value => {
                    setCity(
                      value,
                    );

                    clearError(
                      'city',
                    );
                  }
                }
                placeholder="City / town"
                error={
                  errors.city
                }
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

              {/* DONATION INFORMATION */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Donation Information
              </Text>

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
                  Last Donation Date
                </Text>

                <Pressable
                  onPress={
                    openDatePicker
                  }
                  style={[
                    styles.pickerField,

                    errors.lastDonationDate &&
                      styles.errorBorder,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={
                      COLORS.textMuted
                    }
                  />

                  <Text
                    style={[
                      styles.pickerFieldText,

                      !lastDonationDate &&
                        styles.placeholderText,
                    ]}
                  >
                    {lastDonationDate
                      ? formatDisplayDate(
                          lastDonationDate,
                        )
                      : 'Select date (optional)'}
                  </Text>

                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={
                      COLORS.textMuted
                    }
                  />
                </Pressable>

                {errors.lastDonationDate && (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {
                      errors.lastDonationDate
                    }
                  </Text>
                )}
              </View>

              {/* SAVE BUTTON */}

              <Pressable
                disabled={
                  saving
                }
                style={[
                  styles.saveButton,

                  saving &&
                    styles.disabled,
                ]}
                onPress={
                  saveProfile
                }
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.white
                    }
                  />
                ) : (
                  <Ionicons
                    name="save-outline"
                    size={18}
                    color={
                      COLORS.white
                    }
                  />
                )}

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

              {/* HISTORY */}

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
                  View Donation History
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

        {/* =====================================
            DISTRICT MODAL
        ===================================== */}

        <Modal
          visible={
            districtModalVisible
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setDistrictModalVisible(
              false,
            )
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.districtModal
              }
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Select District
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Choose your district
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setDistrictModalVisible(
                      false,
                    )
                  }
                  style={
                    styles.closeButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={
                      COLORS.text
                    }
                  />
                </Pressable>
              </View>

              <View
                style={
                  styles.searchContainer
                }
              >
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={
                    COLORS.textMuted
                  }
                />

                <TextInput
                  value={
                    districtSearch
                  }
                  onChangeText={
                    setDistrictSearch
                  }
                  placeholder="Search district"
                  placeholderTextColor={
                    COLORS.textMuted
                  }
                  style={
                    styles.searchInput
                  }
                />
              </View>

              <ScrollView
                style={
                  styles.districtList
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              >
                {filteredDistricts.map(
                  item => {
                    const selected =
                      district ===
                      item;

                    return (
                      <Pressable
                        key={
                          item
                        }
                        onPress={() =>
                          selectDistrict(
                            item,
                          )
                        }
                        style={[
                          styles.districtOption,

                          selected &&
                            styles.selectedDistrictOption,
                        ]}
                      >
                        <View
                          style={
                            styles.districtLeft
                          }
                        >
                          <Ionicons
                            name="location-outline"
                            size={18}
                            color={
                              selected
                                ? COLORS.primary
                                : COLORS.textMuted
                            }
                          />

                          <Text
                            style={[
                              styles.districtOptionText,

                              selected &&
                                styles.selectedDistrictText,
                            ]}
                          >
                            {item}
                          </Text>
                        </View>

                        {selected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={
                              COLORS.primary
                            }
                          />
                        )}
                      </Pressable>
                    );
                  },
                )}

                {filteredDistricts.length ===
                  0 && (
                  <View
                    style={
                      styles.noResults
                    }
                  >
                    <Text
                      style={
                        styles.noResultsText
                      }
                    >
                      No districts found.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* =====================================
            DATE PICKER MODAL
        ===================================== */}

        <Modal
          visible={
            dateModalVisible
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setDateModalVisible(
              false,
            )
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.calendarModal
              }
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Last Donation Date
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Select the date you last donated
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setDateModalVisible(
                      false,
                    )
                  }
                  style={
                    styles.closeButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={
                      COLORS.text
                    }
                  />
                </Pressable>
              </View>

              {/* MONTH NAVIGATION */}

              <View
                style={
                  styles.calendarHeader
                }
              >
                <Pressable
                  onPress={
                    previousMonth
                  }
                  style={
                    styles.monthButton
                  }
                >
                  <Ionicons
                    name="chevron-back"
                    size={21}
                    color={
                      COLORS.primary
                    }
                  />
                </Pressable>

                <Text
                  style={
                    styles.monthTitle
                  }
                >
                  {
                    MONTHS[
                      calendarMonth.getMonth()
                    ]
                  }{' '}
                  {
                    calendarMonth.getFullYear()
                  }
                </Text>

                <Pressable
                  onPress={
                    nextMonth
                  }
                  disabled={
                    isCurrentMonth
                  }
                  style={[
                    styles.monthButton,

                    isCurrentMonth &&
                      styles.monthButtonDisabled,
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={21}
                    color={
                      isCurrentMonth
                        ? COLORS.textMuted
                        : COLORS.primary
                    }
                  />
                </Pressable>
              </View>

              {/* WEEK DAYS */}

              <View
                style={
                  styles.weekRow
                }
              >
                {WEEK_DAYS.map(
                  day => (
                    <Text
                      key={
                        day
                      }
                      style={
                        styles.weekDay
                      }
                    >
                      {day}
                    </Text>
                  ),
                )}
              </View>

              {/* CALENDAR */}

              <View
                style={
                  styles.calendarGrid
                }
              >
                {calendarDays.map(
                  (
                    day,
                    index,
                  ) => {
                    if (
                      day === null
                    ) {
                      return (
                        <View
                          key={`empty-${index}`}
                          style={
                            styles.dayCell
                          }
                        />
                      );
                    }

                    const date =
                      new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        day,
                      );

                    const isFuture =
                      startOfDay(
                        date,
                      ) > today;

                    const isSelected =
                      selectedDate !==
                        null &&
                      selectedDate.getFullYear() ===
                        date.getFullYear() &&
                      selectedDate.getMonth() ===
                        date.getMonth() &&
                      selectedDate.getDate() ===
                        date.getDate();

                    const isToday =
                      today.getFullYear() ===
                        date.getFullYear() &&
                      today.getMonth() ===
                        date.getMonth() &&
                      today.getDate() ===
                        date.getDate();

                    return (
                      <View
                        key={`${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}-${day}`}
                        style={
                          styles.dayCell
                        }
                      >
                        <Pressable
                          disabled={
                            isFuture
                          }
                          onPress={() =>
                            selectDonationDate(
                              day,
                            )
                          }
                          style={[
                            styles.dayButton,

                            isSelected &&
                              styles.selectedDayButton,

                            isToday &&
                              !isSelected &&
                              styles.todayButton,

                            isFuture &&
                              styles.futureDay,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,

                              isSelected &&
                                styles.selectedDayText,

                              isFuture &&
                                styles.futureDayText,
                            ]}
                          >
                            {day}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  },
                )}
              </View>

              {/* DATE ACTIONS */}

              <View
                style={
                  styles.dateActions
                }
              >
                <Pressable
                  onPress={
                    clearDonationDate
                  }
                  style={
                    styles.clearDateButton
                  }
                >
                  <Text
                    style={
                      styles.clearDateText
                    }
                  >
                    Clear Date
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setDateModalVisible(
                      false,
                    )
                  }
                  style={
                    styles.doneButton
                  }
                >
                  <Text
                    style={
                      styles.doneButtonText
                    }
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* =====================================
            BLOOD GROUP CONFIRMATION
        ===================================== */}

        <Modal
          visible={
            bloodGroupModalVisible
          }
          transparent
          animationType="fade"
          onRequestClose={
            cancelBloodGroupChange
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.confirmModal
              }
            >
              <View
                style={
                  styles.warningIcon
                }
              >
                <Ionicons
                  name="warning-outline"
                  size={30}
                  color={
                    COLORS.primary
                  }
                />
              </View>

              <Text
                style={
                  styles.confirmTitle
                }
              >
                Change Blood Group?
              </Text>

              <Text
                style={
                  styles.confirmMessage
                }
              >
                Your current blood group is{' '}
                <Text
                  style={
                    styles.confirmImportant
                  }
                >
                  {
                    existing?.bloodGroup
                  }
                </Text>
                .
                {'\n\n'}
                You selected{' '}
                <Text
                  style={
                    styles.confirmImportant
                  }
                >
                  {
                    pendingBloodGroup
                  }
                </Text>
                .
                {'\n\n'}
                Blood group is used for donor matching. Please confirm that this change is correct.
              </Text>

              <View
                style={
                  styles.confirmButtons
                }
              >
                <Pressable
                  onPress={
                    cancelBloodGroupChange
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.cancelChangeButton,

                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.cancelChangeText
                    }
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={
                    confirmBloodGroupChange
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.confirmChangeButton,

                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.confirmChangeText
                    }
                  >
                    Confirm Change
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </DonorScreenShell>
  );
}

// ==========================================
// FIELD COMPONENT
// ==========================================

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

  onChangeText: (
    text: string,
  ) => void;

  placeholder: string;

  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad'
    | 'number-pad';

  editable?: boolean;

  error?: string;
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
  error,
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

          error &&
            styles.errorBorder,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            error
              ? COLORS.primary
              : COLORS.textMuted
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

      {error && (
        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>
      )}
    </View>
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
      paddingHorizontal: 18,
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

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    bloodLabel: {
      marginTop: 4,

      fontSize: 10,

      fontWeight:
        '700',

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

      flexDirection:
        'row',

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

      fontWeight:
        '800',

      color:
        COLORS.text,
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

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    fieldContainer: {
      marginBottom: 13,
    },

    fieldLabel: {
      marginBottom: 6,

      fontSize: 11,

      fontWeight:
        '600',

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

      flexDirection:
        'row',

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

      color:
        COLORS.text,
    },

    errorBorder: {
      borderColor:
        COLORS.primary,

      borderWidth: 1.2,
    },

    errorText: {
      marginTop: 5,

      marginLeft: 3,

      fontSize: 10,

      lineHeight: 14,

      fontWeight:
        '600',

      color:
        COLORS.primary,
    },

    pickerField: {
      height: 49,

      paddingHorizontal: 12,

      borderRadius: 11,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    pickerFieldText: {
      flex: 1,

      marginLeft: 9,

      fontSize: 12,

      color:
        COLORS.text,
    },

    placeholderText: {
      color:
        COLORS.textMuted,
    },

    bloodGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 8,

      marginBottom: 8,
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

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    selectedBloodText: {
      color:
        COLORS.white,
    },

    saveButton: {
      marginTop: 8,

      height: 51,

      borderRadius: 10,

      backgroundColor:
        COLORS.primary,

      flexDirection:
        'row',

      gap: 7,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    saveText: {
      color:
        COLORS.white,

      fontSize: 13,

      fontWeight:
        '800',
    },

    disabled: {
      opacity: 0.55,
    },

    historyLink: {
      height: 52,

      paddingHorizontal: 4,

      marginTop: 13,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    historyText: {
      color:
        COLORS.text,

      fontWeight:
        '700',

      fontSize: 12,
    },

    // ==========================================
    // SHARED MODAL
    // ==========================================

    modalOverlay: {
      flex: 1,

      paddingHorizontal: 20,

      backgroundColor:
        'rgba(0, 0, 0, 0.45)',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    modalHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 16,
    },

    modalTitle: {
      fontSize: 18,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    modalSubtitle: {
      marginTop: 3,

      fontSize: 10,

      color:
        COLORS.textSecondary,
    },

    closeButton: {
      width: 38,
      height: 38,

      borderRadius: 19,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.primaryLight,
    },

    buttonPressed: {
      opacity: 0.75,
    },

    // ==========================================
    // DISTRICT MODAL
    // ==========================================

    districtModal: {
      width: '100%',

      maxWidth: 380,

      maxHeight: '78%',

      padding: 18,

      borderRadius: 20,

      backgroundColor:
        COLORS.white,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity:
        0.18,

      shadowRadius: 12,

      elevation: 8,
    },

    searchContainer: {
      height: 46,

      paddingHorizontal: 12,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 11,

      backgroundColor:
        '#FAFAFA',

      marginBottom: 12,
    },

    searchInput: {
      flex: 1,

      marginLeft: 8,

      fontSize: 12,

      color:
        COLORS.text,
    },

    districtList: {
      flexGrow: 0,
    },

    districtOption: {
      minHeight: 49,

      paddingHorizontal: 12,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      borderBottomWidth: 1,

      borderBottomColor:
        '#F1F1F1',
    },

    selectedDistrictOption: {
      backgroundColor:
        '#FFF5F6',

      borderRadius: 9,

      borderBottomWidth: 0,

      marginVertical: 2,
    },

    districtLeft: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    districtOptionText: {
      marginLeft: 10,

      fontSize: 12,

      color:
        COLORS.text,
    },

    selectedDistrictText: {
      fontWeight:
        '800',

      color:
        COLORS.primary,
    },

    noResults: {
      paddingVertical: 30,

      alignItems:
        'center',
    },

    noResultsText: {
      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    // ==========================================
    // CALENDAR
    // ==========================================

    calendarModal: {
      width: '100%',

      maxWidth: 380,

      padding: 18,

      borderRadius: 20,

      backgroundColor:
        COLORS.white,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity:
        0.18,

      shadowRadius: 12,

      elevation: 8,
    },

    calendarHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom: 13,
    },

    monthButton: {
      width: 38,
      height: 38,

      borderRadius: 19,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.primaryLight,
    },

    monthButtonDisabled: {
      opacity: 0.4,
    },

    monthTitle: {
      fontSize: 14,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    weekRow: {
      flexDirection:
        'row',

      marginBottom: 7,
    },

    weekDay: {
      width: '14.2857%',

      textAlign:
        'center',

      fontSize: 9,

      fontWeight:
        '700',

      color:
        COLORS.textMuted,
    },

    calendarGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',
    },

    dayCell: {
      width: '14.2857%',

      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    dayButton: {
      width: 34,
      height: 34,

      borderRadius: 17,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    todayButton: {
      borderWidth: 1,

      borderColor:
        COLORS.primary,
    },

    selectedDayButton: {
      backgroundColor:
        COLORS.primary,
    },

    dayText: {
      fontSize: 11,

      fontWeight:
        '600',

      color:
        COLORS.text,
    },

    selectedDayText: {
      color:
        COLORS.white,

      fontWeight:
        '900',
    },

    futureDay: {
      opacity: 0.3,
    },

    futureDayText: {
      color:
        COLORS.textMuted,
    },

    dateActions: {
      flexDirection:
        'row',

      gap: 10,

      marginTop: 17,
    },

    clearDateButton: {
      flex: 1,

      height: 44,

      borderRadius: 10,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,
    },

    clearDateText: {
      fontSize: 12,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,
    },

    doneButton: {
      flex: 1,

      height: 44,

      borderRadius: 10,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.primary,
    },

    doneButtonText: {
      fontSize: 12,

      fontWeight:
        '800',

      color:
        COLORS.white,
    },

    // ==========================================
    // BLOOD GROUP CONFIRMATION
    // ==========================================

    confirmModal: {
      width: '100%',

      maxWidth: 350,

      padding: 22,

      borderRadius: 20,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity:
        0.18,

      shadowRadius: 12,

      elevation: 8,
    },

    warningIcon: {
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

    confirmTitle: {
      fontSize: 18,

      fontWeight:
        '900',

      color:
        COLORS.text,

      textAlign:
        'center',
    },

    confirmMessage: {
      marginTop: 9,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.textSecondary,

      textAlign:
        'center',
    },

    confirmImportant: {
      fontWeight:
        '900',

      color:
        COLORS.primary,
    },

    confirmButtons: {
      width: '100%',

      flexDirection:
        'row',

      gap: 10,

      marginTop: 21,
    },

    cancelChangeButton: {
      flex: 1,

      height: 44,

      borderRadius: 10,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,
    },

    cancelChangeText: {
      fontSize: 12,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    confirmChangeButton: {
      flex: 1,

      height: 44,

      borderRadius: 10,

      backgroundColor:
        COLORS.primary,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    confirmChangeText: {
      fontSize: 12,

      fontWeight:
        '800',

      color:
        COLORS.white,
    },
  });
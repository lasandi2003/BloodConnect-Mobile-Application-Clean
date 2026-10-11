import React, {
  useState,
} from 'react';

import {
  Alert,
  KeyboardAvoidingView,
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

import type {
  AuthStackParamList,
} from '../../../navigation/types';

import type {
  HealthcareType,
  RegistrationRole,
} from '../../../types/auth';

import {
  COLORS,
} from '../../../constants/colors';

import AuthInput from '../components/AuthInput';
import { buildInitialApprovalFields, requiresAdminApproval } from '../utils/roleApproval';

import {
  useAuth,
} from '../context/AuthContext';

import {
  getAuthErrorMessage,
} from '../services/authService';

type Props =
  NativeStackScreenProps<
    AuthStackParamList,
    'Register'
  >;

function getRoleTitle(
  role: RegistrationRole,
) {
  switch (role) {
    case 'donor':
      return 'Donor';

    case 'requester':
      return 'Hospital / Requester';

    case 'healthcare':
      return 'Healthcare Staff';

    case 'bloodBank':
      return 'Blood Bank Staff';
  }
}

export default function RegisterScreen({
  route,
  navigation,
}: Props) {
  const {
    role,
  } = route.params;

  const {
    register,
  } = useAuth();

  const staffApplication = requiresAdminApproval(role);
  const [institutionName, setInstitutionName] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');

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
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    acceptedTerms,
    setAcceptedTerms,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    healthcareType,
    setHealthcareType,
  ] = useState<
    HealthcareType | undefined
  >(
    role === 'healthcare'
      ? 'doctor'
      : undefined,
  );

  function showMessage(
    title: string,
    message: string,
  ) {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined'
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

  async function handleRegister() {
    if (
      fullName.trim().length < 2
    ) {
      showMessage(
        'Invalid name',
        'Please enter your full name.',
      );

      return;
    }

    if (
      !email.includes('@')
    ) {
      showMessage(
        'Invalid email',
        'Please enter a valid email address.',
      );

      return;
    }

    if (
      phone.trim().length < 9
    ) {
      showMessage(
        'Invalid phone number',
        'Please enter a valid phone number.',
      );

      return;
    }

    if (
      password.length < 6
    ) {
      showMessage(
        'Weak password',
        'Password must contain at least 6 characters.',
      );

      return;
    }

    if (
      password !== confirmPassword
    ) {
      showMessage(
        'Password mismatch',
        'Password and confirm password must match.',
      );

      return;
    }

    if (
      role === 'healthcare' &&
      !healthcareType
    ) {
      showMessage(
        'Select staff type',
        'Please select Doctor or Nurse.',
      );

      return;
    }

    if (!acceptedTerms) {
      showMessage(
        'Terms required',
        'Please accept the Terms of Service and Privacy Policy.',
      );

      return;
    }

    try {
      buildInitialApprovalFields(role, { institutionName, designation, employeeId });
      setLoading(true);

      await register({
        fullName:
          fullName.trim(),

        email:
          email
            .trim()
            .toLowerCase(),

        phone:
          phone.trim(),

        password,

        role,

        healthcareType,
        ...(staffApplication ? { institutionName, designation, employeeId } : {}),
      });
    } catch (error) {
      showMessage(
        'Registration failed',
        getAuthErrorMessage(
          error,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Ionicons
              name="chevron-back"
              size={23}
              color={COLORS.text}
            />
          </Pressable>

          <View>
            <Text
              style={styles.heading}
            >
              Create Account
            </Text>

            <Text
              style={styles.roleText}
            >
              {getRoleTitle(role)}
            </Text>
          </View>
        </View>

        <AuthInput
          label="Full Name"
          icon="person-outline"
          placeholder="Full Name"
          value={fullName}
          onChangeText={
            setFullName
          }
        />

        <AuthInput
          label="Email Address"
          icon="mail-outline"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={
            setEmail
          }
        />

        <AuthInput
          label="Phone Number"
          icon="call-outline"
          placeholder="+94 76 317 8084"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={
            setPhone
          }
        />

        {role === 'healthcare' ? (
          <View
            style={styles.staffSection}
          >
            <Text
              style={styles.staffLabel}
            >
              Healthcare Staff Type
            </Text>

            <View
              style={styles.staffRow}
            >
              {(
                [
                  'doctor',
                  'nurse',
                ] as HealthcareType[]
              ).map(item => (
                <Pressable
                  key={item}
                  style={[
                    styles.staffButton,

                    healthcareType ===
                      item &&
                      styles.staffButtonSelected,
                  ]}
                  onPress={() =>
                    setHealthcareType(
                      item,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.staffButtonText,

                      healthcareType ===
                        item &&
                        styles.staffButtonTextSelected,
                    ]}
                  >
                    {item === 'doctor'
                      ? 'Doctor'
                      : 'Nurse'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {staffApplication && <>
          <Text style={styles.staffLabel}>Professional Details</Text>
          <AuthInput label={role === 'healthcare' ? 'Hospital / Institution Name' : 'Blood Bank Name'} icon="business-outline" placeholder="Registered institution name" value={institutionName} onChangeText={setInstitutionName} maxLength={150} />
          <AuthInput label="Designation" icon="briefcase-outline" placeholder="Your professional designation" value={designation} onChangeText={setDesignation} maxLength={100} />
          <AuthInput label="Employee ID" icon="id-card-outline" placeholder="Your employee ID" value={employeeId} onChangeText={setEmployeeId} maxLength={50} autoCapitalize="none" />
          <Text style={styles.roleText}>Your account will await administrator approval before staff access is enabled.</Text>
        </>}

        <AuthInput
          label="Password"
          icon="lock-closed-outline"
          placeholder="Password"
          secureTextEntry={
            !showPassword
          }
          value={password}
          onChangeText={
            setPassword
          }
          rightIcon={
            showPassword
              ? 'eye-off-outline'
              : 'eye-outline'
          }
          onRightPress={() =>
            setShowPassword(
              previous =>
                !previous,
            )
          }
        />

        <AuthInput
          label="Confirm Password"
          icon="lock-closed-outline"
          placeholder="Confirm Password"
          secureTextEntry={
            !showPassword
          }
          value={
            confirmPassword
          }
          onChangeText={
            setConfirmPassword
          }
        />

        {/* Terms */}
        <Pressable
          style={styles.termsRow}
          onPress={() =>
            setAcceptedTerms(
              previous =>
                !previous,
            )
          }
        >
          <View
            style={[
              styles.checkbox,

              acceptedTerms &&
                styles.checkboxSelected,
            ]}
          >
            {acceptedTerms ? (
              <Ionicons
                name="checkmark"
                size={16}
                color={
                  COLORS.white
                }
              />
            ) : null}
          </View>

          <Text
            style={styles.termsText}
          >
            I agree to the{' '}

            <Text
              style={
                styles.termsLink
              }
            >
              Terms of Service
            </Text>

            {' & '}

            <Text
              style={
                styles.termsLink
              }
            >
              Privacy Policy
            </Text>
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.registerButton,

            loading &&
              styles.disabled,
          ]}
          disabled={loading}
          onPress={
            handleRegister
          }
        >
          <Text
            style={
              styles.registerButtonText
            }
          >
            {loading
              ? 'Creating Account...'
              : 'Register'}
          </Text>
        </Pressable>

        <View
          style={styles.loginRow}
        >
          <Text
            style={styles.loginText}
          >
            Already have an account?{' '}
          </Text>

          <Pressable
            onPress={() =>
              navigation.navigate(
                'Login',
              )
            }
          >
            <Text
              style={styles.loginLink}
            >
              Login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,

      backgroundColor:
        COLORS.softBackground,
    },

    container: {
      flexGrow: 1,

      paddingHorizontal: 24,
      paddingTop: 48,
      paddingBottom: 35,

      backgroundColor:
        COLORS.softBackground,
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',

      marginBottom: 34,
    },

    backButton: {
      width: 42,
      height: 42,

      borderRadius: 21,

      backgroundColor:
        COLORS.white,

      alignItems: 'center',
      justifyContent: 'center',

      marginRight: 14,

      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    heading: {
      fontSize: 23,
      fontWeight: '900',

      color:
        COLORS.text,
    },

    roleText: {
      marginTop: 3,

      color:
        COLORS.primary,

      fontSize: 12,
      fontWeight: '700',
    },

    staffSection: {
      marginBottom: 16,
    },

    staffLabel: {
      marginBottom: 8,

      color:
        COLORS.textSecondary,

      fontSize: 13,
      fontWeight: '600',
    },

    staffRow: {
      flexDirection: 'row',
      gap: 10,
    },

    staffButton: {
      flex: 1,

      height: 46,

      borderRadius: 10,

      borderWidth: 1.5,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    staffButtonSelected: {
      borderColor:
        COLORS.primary,

      backgroundColor:
        COLORS.primaryLight,
    },

    staffButtonText: {
      color:
        COLORS.textSecondary,

      fontWeight: '700',
    },

    staffButtonTextSelected: {
      color:
        COLORS.primary,
    },

    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',

      marginTop: 7,
      marginBottom: 18,

      minHeight: 36,
    },

    checkbox: {
      width: 22,
      height: 22,

      borderRadius: 6,

      borderWidth: 2,

      borderColor:
        COLORS.primary,

      backgroundColor:
        COLORS.white,

      marginRight: 10,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    checkboxSelected: {
      backgroundColor:
        COLORS.primary,

      borderColor:
        COLORS.primary,
    },

    termsText: {
      flex: 1,

      color:
        COLORS.textSecondary,

      fontSize: 12,
      lineHeight: 18,
    },

    termsLink: {
      color:
        COLORS.primary,

      fontWeight: '700',
    },

    registerButton: {
      height: 54,

      borderRadius: 11,

      backgroundColor:
        COLORS.primary,

      alignItems: 'center',
      justifyContent:
        'center',

      shadowColor:
        COLORS.primaryDark,

      shadowOpacity: 0.18,

      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 3,
    },

    disabled: {
      opacity: 0.6,
    },

    registerButtonText: {
      color:
        COLORS.white,

      fontWeight: '800',

      fontSize: 15,
    },

    loginRow: {
      marginTop: 30,

      flexDirection: 'row',

      justifyContent:
        'center',
    },

    loginText: {
      color:
        COLORS.textSecondary,

      fontSize: 13,
    },

    loginLink: {
      color:
        COLORS.primary,

      fontWeight: '800',

      fontSize: 13,
    },
  });

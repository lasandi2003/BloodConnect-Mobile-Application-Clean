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
  role:
    RegistrationRole,
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
  } =
    route.params;

  const {
    register,
  } =
    useAuth();

  const [
    fullName,
    setFullName,
  ] =
    useState('');

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    phone,
    setPhone,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    acceptedTerms,
    setAcceptedTerms,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    healthcareType,
    setHealthcareType,
  ] =
    useState<
      HealthcareType
      | undefined
    >(
      role ===
        'healthcare'
        ? 'doctor'
        : undefined,
    );

  async function handleRegister() {
    if (
      fullName.trim()
        .length < 2
    ) {
      Alert.alert(
        'Invalid name',
        'Please enter your full name.',
      );

      return;
    }

    if (
      !email.includes(
        '@',
      )
    ) {
      Alert.alert(
        'Invalid email',
        'Please enter a valid email address.',
      );

      return;
    }

    if (
      phone.trim()
        .length < 9
    ) {
      Alert.alert(
        'Invalid phone number',
        'Please enter a valid phone number.',
      );

      return;
    }

    if (
      password.length <
      6
    ) {
      Alert.alert(
        'Weak password',
        'Password must contain at least 6 characters.',
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      Alert.alert(
        'Password mismatch',
        'Password and confirm password must match.',
      );

      return;
    }

    if (
      role ===
        'healthcare' &&
      !healthcareType
    ) {
      Alert.alert(
        'Select staff type',
        'Please select Doctor or Nurse.',
      );

      return;
    }

    if (
      !acceptedTerms
    ) {
      Alert.alert(
        'Terms required',
        'Please accept the Terms of Service and Privacy Policy.',
      );

      return;
    }

    try {
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
      });
    } catch (error) {
      Alert.alert(
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
      style={
        styles.flex
      }
      behavior={
        Platform.OS ===
        'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={
            styles.topRow
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

          <View>
            <Text
              style={
                styles.heading
              }
            >
              Create Account
            </Text>

            <Text
              style={
                styles.roleText
              }
            >
              {
                getRoleTitle(
                  role,
                )
              }
            </Text>
          </View>
        </View>

        <AuthInput
          label="Full Name"
          icon="person-outline"
          placeholder="Full Name"
          value={
            fullName
          }
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

        {role ===
        'healthcare' ? (
          <View
            style={
              styles.staffSection
            }
          >
            <Text
              style={
                styles.staffLabel
              }
            >
              Healthcare
              Staff Type
            </Text>

            <View
              style={
                styles.staffRow
              }
            >
              {(
                [
                  'doctor',
                  'nurse',
                ] as HealthcareType[]
              ).map(
                item => (
                  <Pressable
                    key={
                      item
                    }
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
                      {item ===
                      'doctor'
                        ? 'Doctor'
                        : 'Nurse'}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>
        ) : null}

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

        <Pressable
          style={
            styles.termsRow
          }
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
                size={14}
                color={
                  COLORS.white
                }
              />
            ) : null}
          </View>

          <Text
            style={
              styles.termsText
            }
          >
            I agree to
            the Terms of
            Service &
            Privacy Policy
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.registerButton,

            loading &&
              styles.disabled,
          ]}
          disabled={
            loading
          }
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
          style={
            styles.loginRow
          }
        >
          <Text
            style={
              styles.loginText
            }
          >
            Already have
            an account?{' '}
          </Text>

          <Pressable
            onPress={() =>
              navigation.navigate(
                'Login',
              )
            }
          >
            <Text
              style={
                styles.loginLink
              }
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
      paddingTop: 55,
      paddingBottom: 40,
      backgroundColor:
        COLORS.softBackground,
    },

    topRow: {
      flexDirection: 'row',
      alignItems:
        'center',
      marginBottom: 36,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        COLORS.white,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 14,
    },

    heading: {
      fontSize: 22,
      fontWeight: '800',
      color:
        COLORS.text,
    },

    roleText: {
      marginTop: 3,
      color:
        COLORS.primary,
      fontSize: 12,
      fontWeight: '600',
    },

    staffSection: {
      marginBottom: 16,
    },

    staffLabel: {
      marginBottom: 8,
      color:
        COLORS.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },

    staffRow: {
      flexDirection: 'row',
      gap: 10,
    },

    staffButton: {
      flex: 1,
      height: 45,
      borderRadius: 9,
      borderWidth: 1,
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
        '#FFF1F1',
    },

    staffButtonText: {
      color:
        COLORS.textSecondary,
      fontWeight: '600',
    },

    staffButtonTextSelected: {
      color:
        COLORS.primary,
    },

    termsRow: {
      flexDirection: 'row',
      alignItems:
        'center',
      marginVertical: 10,
    },

    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor:
        COLORS.border,
      marginRight: 9,
      alignItems:
        'center',
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
    },

    registerButton: {
      height: 52,
      marginTop: 12,
      borderRadius: 9,
      backgroundColor:
        COLORS.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    disabled: {
      opacity: 0.6,
    },

    registerButtonText: {
      color:
        COLORS.white,
      fontWeight: '700',
      fontSize: 15,
    },

    loginRow: {
      marginTop: 32,
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
      fontWeight: '700',
      fontSize: 13,
    },
  });
import React, {
  useState,
} from 'react';

import {
  Alert,
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

import type {
  AuthStackParamList,
} from '../../../navigation/types';

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
    'ForgotPassword'
  >;

export default function ForgotPasswordScreen({
  navigation,
}: Props) {
  const {
    resetPassword,
  } =
    useAuth();

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  async function handleReset() {
    if (
      !email.includes(
        '@',
      )
    ) {
      Alert.alert(
        'Invalid email',
        'Please enter your email address.',
      );

      return;
    }

    try {
      setLoading(true);

      await resetPassword(
        email,
      );

      Alert.alert(
        'Email sent',
        'Password reset instructions have been sent to your email address.',
        [
          {
            text: 'OK',

            onPress: () =>
              navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Unable to reset password',
        getAuthErrorMessage(
          error,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <Pressable
        style={
          styles.back
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
          styles.title
        }
      >
        Forgot Password?
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Enter your registered
        email address. We will
        send you a password
        reset link.
      </Text>

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

      <Pressable
        style={
          styles.button
        }
        disabled={
          loading
        }
        onPress={
          handleReset
        }
      >
        <Text
          style={
            styles.buttonText
          }
        >
          {loading
            ? 'Sending...'
            : 'Send Reset Link'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.white,
      paddingHorizontal: 24,
      paddingTop: 60,
    },

    back: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        COLORS.inputBackground,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginBottom: 45,
    },

    title: {
      fontSize: 29,
      fontWeight: '800',
      color:
        COLORS.text,
    },

    subtitle: {
      marginTop: 10,
      marginBottom: 35,
      fontSize: 14,
      lineHeight: 21,
      color:
        COLORS.textSecondary,
    },

    button: {
      height: 52,
      borderRadius: 9,
      backgroundColor:
        COLORS.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginTop: 8,
    },

    buttonText: {
      color:
        COLORS.white,
      fontWeight: '700',
    },
  });
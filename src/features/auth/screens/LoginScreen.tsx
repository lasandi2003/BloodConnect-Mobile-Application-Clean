import React, {
  useEffect,
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

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  Ionicons,
} from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AuthStackParamList,
} from '../../../navigation/types';

import {
  COLORS,
} from '../../../constants/colors';

import {
  useAuth,
} from '../context/AuthContext';

import {
  getAuthErrorMessage,
} from '../services/authService';

import AuthInput from '../components/AuthInput';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>;

const REMEMBERED_EMAIL_KEY =
  'bloodconnect_remembered_email';

export default function LoginScreen({
  navigation,
}: Props) {
  const {
    login,
    loginWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');
  const [rememberMe, setRememberMe] =
    useState(false);
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);

  useEffect(() => {
    async function loadSavedEmail() {
      const savedEmail =
        await AsyncStorage.getItem(
          REMEMBERED_EMAIL_KEY,
        );

      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }

    loadSavedEmail();
  }, []);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.',
      );
      return;
    }

    try {
      setLoading(true);
      await login(email, password);

      if (rememberMe) {
        await AsyncStorage.setItem(
          REMEMBERED_EMAIL_KEY,
          email.trim().toLowerCase(),
        );
      } else {
        await AsyncStorage.removeItem(
          REMEMBERED_EMAIL_KEY,
        );
      }
    } catch (error) {
      Alert.alert(
        'Login failed',
        getAuthErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);

      const result = await loginWithGoogle();

      if (result === 'needs-profile') {
        navigation.navigate(
          'RoleSelection',
          {
            mode: 'google',
          },
        );
      }
    } catch (error) {
      Alert.alert(
        'Google Sign-In',
        getAuthErrorMessage(error),
      );
    } finally {
      setGoogleLoading(false);
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
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBadge}>
          <Ionicons
            name="water"
            size={26}
            color={COLORS.white}
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome Back
          </Text>

          <Text style={styles.subtitle}>
            Enter your credentials to access your BloodConnect account.
          </Text>
        </View>

        <AuthInput
          label="Email Address"
          icon="mail-outline"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <AuthInput
          label="Password"
          icon="lock-closed-outline"
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          rightIcon={
            showPassword
              ? 'eye-off-outline'
              : 'eye-outline'
          }
          onRightPress={() =>
            setShowPassword(
              previous => !previous,
            )
          }
        />

        <View style={styles.optionsRow}>
          <Pressable
            style={styles.rememberRow}
            onPress={() =>
              setRememberMe(
                previous => !previous,
              )
            }
          >
            <View
              style={[
                styles.checkbox,
                rememberMe &&
                  styles.checkboxSelected,
              ]}
            >
              {rememberMe ? (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={COLORS.white}
                />
              ) : null}
            </View>

            <Text style={styles.rememberText}>
              Remember me
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate(
                'ForgotPassword',
              )
            }
          >
            <Text style={styles.link}>
              Forgot Password?
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.loginButton,
            loading && styles.disabled,
          ]}
          disabled={loading}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          style={[
            styles.googleButton,
            googleLoading && styles.disabled,
          ]}
          disabled={googleLoading}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>
            {googleLoading
              ? 'Connecting...'
              : 'Continue with Google'}
          </Text>
        </Pressable>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>
            Don&apos;t have an account?{' '}
          </Text>

          <Pressable
            onPress={() =>
              navigation.navigate(
                'RoleSelection',
                {
                  mode: 'email',
                },
              )
            }
          >
            <Text style={styles.link}>
              Register
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: COLORS.white,
  },

  brandBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  header: {
    marginBottom: 28,
  },

  title: {
    fontSize: 31,
    fontWeight: '800',
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  optionsRow: {
    marginTop: 3,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  rememberText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  link: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },

  loginButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabled: {
    opacity: 0.55,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },

  dividerRow: {
    marginVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  orText: {
    marginHorizontal: 14,
    color: COLORS.textSecondary,
    fontSize: 11,
  },

  googleButton: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },

  googleIcon: {
    marginRight: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#4285F4',
  },

  googleText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },

  registerRow: {
    marginTop: 34,
    flexDirection: 'row',
    justifyContent: 'center',
  },

  registerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
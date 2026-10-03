import React, { useEffect, useState } from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import type {
  AuthStackParamList,
} from './types';

import {
  useAuth,
} from '../features/auth/context/AuthContext';

import SplashScreen from '../features/auth/screens/SplashScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RoleSelectionScreen from '../features/auth/screens/RoleSelectionScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';

import DonorDashboardScreen from '../features/donor/screens/DonorDashboardScreen';

import RequesterDashboardScreen from '../features/emergencyRequest/screens/RequesterDashboardScreen';

import HealthcareDashboardScreen from '../features/verificationMatching/screens/HealthcareDashboardScreen';

import BloodBankDashboardScreen from '../features/inventoryAdmin/screens/BloodBankDashboardScreen';

import AdminDashboardScreen from '../features/inventoryAdmin/screens/AdminDashboardScreen';

import {
  COLORS,
} from '../constants/colors';

const AuthStack =
  createNativeStackNavigator<AuthStackParamList>();

const AppStack =
  createNativeStackNavigator();

/**
 * Authentication navigation.
 *
 * Users who are not signed in will see:
 *
 * Login
 *   ↓
 * Role Selection
 *   ↓
 * Registration
 *
 * Forgot Password can also be opened
 * from the Login screen.
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
      />

      <AuthStack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
      />

      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
      />

      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </AuthStack.Navigator>
  );
}

/**
 * Routes authenticated users according
 * to the role stored in Firestore.
 *
 * Firestore:
 *
 * users/{uid}
 *   role: donor
 *   role: requester
 *   role: healthcare
 *   role: bloodBank
 *   role: admin
 */
function DashboardRouter() {
  const {
    profile,
  } = useAuth();

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>
          Unable to load account
        </Text>

        <Text style={styles.errorMessage}>
          Your BloodConnect user profile could not be found.
        </Text>
      </View>
    );
  }

  switch (profile.role) {
    case 'donor':
      return (
        <DonorDashboardScreen />
      );

    case 'requester':
      return (
        <RequesterDashboardScreen />
      );

    case 'healthcare':
      return (
        <HealthcareDashboardScreen />
      );

    case 'bloodBank':
      return (
        <BloodBankDashboardScreen />
      );

    case 'admin':
      return (
        <AdminDashboardScreen />
      );

    default:
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Invalid user role
          </Text>

          <Text style={styles.errorMessage}>
            This account does not have a valid BloodConnect role.
          </Text>
        </View>
      );
  }
}

/**
 * Navigation used after the user has
 * successfully authenticated.
 */
function LoggedInNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AppStack.Screen
        name="Dashboard"
        component={DashboardRouter}
      />
    </AppStack.Navigator>
  );
}

/**
 * Main navigation controller.
 *
 * Flow:
 *
 * App opens
 *   ↓
 * Splash screen
 *   ↓
 * Firebase checks authentication
 *   ↓
 *
 * Not logged in
 *   → Auth screens
 *
 * Logged in
 *   → Read Firestore role
 *   → Correct dashboard
 */
export default function RootNavigator() {
  const {
    user,
    profile,
    initializing,
  } = useAuth();

  const [
    splashFinished,
    setSplashFinished,
  ] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setSplashFinished(true);
      },
      1500,
    );

    return () => {
      clearTimeout(timer);
    };
  }, []);

  /**
   * Keep splash screen visible while:
   *
   * 1. Firebase checks the existing session.
   * 2. Initial splash animation/time is running.
   */
  if (
    initializing ||
    !splashFinished
  ) {
    return (
      <SplashScreen />
    );
  }

  return (
    <NavigationContainer>
      {user && profile ? (
        <LoggedInNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

const styles =
  StyleSheet.create({
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
      backgroundColor:
        COLORS.background,
    },

    errorTitle: {
      fontSize: 22,
      fontWeight: '800',
      color:
        COLORS.text,
      textAlign: 'center',
    },

    errorMessage: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 21,
      color:
        COLORS.textSecondary,
      textAlign: 'center',
    },
  });
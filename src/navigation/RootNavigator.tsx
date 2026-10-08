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

// ========================================
// AUTHENTICATION SCREENS
// ========================================

import SplashScreen from '../features/auth/screens/SplashScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RoleSelectionScreen from '../features/auth/screens/RoleSelectionScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';

// ========================================
// DONOR MODULE
// ========================================

import DonorNavigator from '../features/donor/navigation/DonorNavigator';

// ========================================
// REQUESTER MODULE
// ========================================

import RequesterNavigator from '../features/emergencyRequest/navigation/RequesterNavigator';

// ========================================
// OTHER ROLE DASHBOARDS
// ========================================

import HealthcareDashboardScreen from '../features/verificationMatching/screens/HealthcareDashboardScreen';

import BloodBankDashboardScreen from '../features/inventoryAdmin/screens/BloodBankDashboardScreen';

import AdminDashboardScreen from '../features/inventoryAdmin/screens/AdminDashboardScreen';

// ========================================
// BLOOD BANK REQUEST SCREENS
// ========================================

import RequestManagementScreen from '../features/bloodBankRequests/screens/RequestManagementScreen';

import RequestApprovalDetailsScreen from '../features/bloodBankRequests/screens/RequestApprovalDetailsScreen';

// ========================================
// COMMON COMPONENTS
// ========================================

import RoleAppShell from '../components/RoleAppShell';

import {
  COLORS,
} from '../constants/colors';

// ========================================
// AUTH STACK
// ========================================

const AuthStack =
  createNativeStackNavigator<
    AuthStackParamList
  >();

/**
 * Authentication navigation.
 *
 * Used only when there is no logged-in
 * Firebase user/profile.
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

// ========================================
// DASHBOARD ROUTER
// ========================================

/**
 * Routes authenticated users according to
 * the role saved in Firestore.
 */
function DashboardRouter() {
  const {
    profile,
  } = useAuth();

  // ========================================
  // PROFILE ERROR
  // ========================================

  if (!profile) {
    return (
      <View
        style={styles.errorContainer}
      >
        <Text
          style={styles.errorTitle}
        >
          Unable to load account
        </Text>

        <Text
          style={styles.errorMessage}
        >
          Your BloodConnect profile could not
          be loaded.
        </Text>
      </View>
    );
  }

  // ========================================
  // ROLE ROUTING
  // ========================================

  switch (profile.role) {

    // ======================================
    // DONOR
    // ======================================

    /**
     * Donors have their own navigator:
     *
     * Dashboard
     * Requests
     * Request Details
     * Confirmation
     * History
     * Profile
     */

    case 'donor':

      return (
        <DonorNavigator />
      );

    // ======================================
    // HOSPITAL / REQUESTER
    // ======================================

    case 'requester':

      return (
        <RequesterNavigator />
      );

    // ======================================
    // HEALTHCARE STAFF
    // ======================================

    case 'healthcare':

      return (
        <RoleAppShell
          home={
            <HealthcareDashboardScreen />
          }

          activity={{
            title:
              'Pending Requests',

            description:
              'Requests waiting for healthcare verification will be shown here.',
          }}

          services={{
            title:
              'Donor Matching',

            description:
              'Compatible donor matching tools will be connected here.',
          }}

          profile={{
            title:
              'Healthcare Profile',

            description:
              'Doctor or nurse account details will be managed here.',
          }}

          tabLabels={{
            activity:
              'Pending',

            services:
              'Matches',
          }}

          tabIcons={{
            activity: {
              icon:
                'hourglass-outline',

              activeIcon:
                'hourglass',
            },

            services: {
              icon:
                'people-outline',

              activeIcon:
                'people',
            },
          }}
        />
      );

    // ======================================
    // BLOOD BANK
    // ======================================

    case 'bloodBank':

      return (
        <RoleAppShell

          // --------------------------------
          // HOME
          // --------------------------------

          home={
            <BloodBankDashboardScreen />
          }

          // --------------------------------
          // INVENTORY TAB
          // --------------------------------

          activity={{
            title:
              'Blood Inventory',

            description:
              'Blood stock levels and inventory updates will be connected here.',
          }}

          // --------------------------------
          // REQUESTS TAB
          // --------------------------------

          services={{
            title:
              'Emergency Requests',

            description:
              'Blood-bank emergency request management will be connected here.',
          }}

          // --------------------------------
          // PROFILE TAB
          // --------------------------------

          profile={{
            title:
              'Blood Bank Profile',

            description:
              'Blood-bank account details will be managed here.',
          }}

          // --------------------------------
          // TAB LABELS
          // --------------------------------

          tabLabels={{
            activity:
              'Inventory',

            services:
              'Requests',
          }}

          // --------------------------------
          // TAB ICONS
          // --------------------------------

          tabIcons={{
            activity: {
              icon:
                'water-outline',

              activeIcon:
                'water',
            },

            services: {
              icon:
                'alert-outline',

              activeIcon:
                'alert',
            },
          }}
        />
      );

    // ======================================
    // ADMIN
    // ======================================

    case 'admin':

      return (
        <RoleAppShell

          home={
            <AdminDashboardScreen />
          }

          activity={{
            title:
              'User Management',

            description:
              'Registered users and account statuses will be managed here.',
          }}

          services={{
            title:
              'System Management',

            description:
              'Administration tools and system monitoring will be connected here.',
          }}

          profile={{
            title:
              'Admin Profile',

            description:
              'Administrator account details will be managed here.',
          }}

          tabLabels={{
            activity:
              'Users',

            services:
              'Manage',
          }}

          tabIcons={{
            activity: {
              icon:
                'people-outline',

              activeIcon:
                'people',
            },

            services: {
              icon:
                'settings-outline',

              activeIcon:
                'settings',
            },
          }}
        />
      );

    // ======================================
    // INVALID ROLE
    // ======================================

    default:

      return (
        <View
          style={styles.errorContainer}
        >
          <Text
            style={styles.errorTitle}
          >
            Invalid user role
          </Text>

          <Text
            style={styles.errorMessage}
          >
            This account does not have a valid
            BloodConnect role.
          </Text>
        </View>
      );
  }
}

// ========================================
// ROOT NAVIGATOR
// ========================================

/**
 * Main application navigation.
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

  // ========================================
  // SPLASH TIMER
  // ========================================

  useEffect(() => {

    const timer =
      setTimeout(() => {

        setSplashFinished(
          true,
        );

      }, 2500);

    return () => {

      clearTimeout(
        timer,
      );

    };

  }, []);

  // ========================================
  // KEEP SPLASH VISIBLE
  // ========================================
  //
  // 1. At least 2.5 seconds
  // 2. While Firebase checks login
  //
  // ========================================

  if (
    initializing ||
    !splashFinished
  ) {

    return (
      <SplashScreen />
    );
  }

  // ========================================
  // MAIN NAVIGATION
  // ========================================

  return (
    <NavigationContainer>

      {user && profile ? (

        <DashboardRouter />

      ) : (

        <AuthNavigator />

      )}

    </NavigationContainer>
  );
}

// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({

    errorContainer: {

      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal:
        30,

      backgroundColor:
        COLORS.background,

    },

    errorTitle: {

      fontSize: 22,

      fontWeight:
        '800',

      color:
        COLORS.text,

      textAlign:
        'center',

    },

    errorMessage: {

      marginTop: 10,

      fontSize: 14,

      lineHeight: 21,

      color:
        COLORS.textSecondary,

      textAlign:
        'center',

    },

  });
import React, {
  useEffect,
  useState,
} from 'react';

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

// Authentication screens
import SplashScreen from '../features/auth/screens/SplashScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RoleSelectionScreen from '../features/auth/screens/RoleSelectionScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';

// Donor module
import DonorNavigator from '../features/donor/navigation/DonorNavigator';

// Other role dashboards
import RequesterDashboardScreen from '../features/emergencyRequest/screens/RequesterDashboardScreen';
import HealthcareDashboardScreen from '../features/verificationMatching/screens/HealthcareDashboardScreen';
import BloodBankDashboardScreen from '../features/inventoryAdmin/screens/BloodBankDashboardScreen';
import AdminDashboardScreen from '../features/inventoryAdmin/screens/AdminDashboardScreen';

import RoleAppShell from '../components/RoleAppShell';

import {
  COLORS,
} from '../constants/colors';

const AuthStack =
  createNativeStackNavigator<
    AuthStackParamList
  >();

/**
 * Authentication navigation
 *
 * Used only when there is no logged-in Firebase user/profile.
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
 * Routes authenticated users according to
 * the role saved in Firestore.
 */
function DashboardRouter() {
  const {
    profile,
  } = useAuth();

  if (!profile) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          Unable to load account
        </Text>

        <Text
          style={
            styles.errorMessage
          }
        >
          Your BloodConnect
          profile could not be
          loaded.
        </Text>
      </View>
    );
  }

  switch (profile.role) {
    /**
     * DONOR
     *
     * Donors now have their own complete navigator:
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

    /**
     * HOSPITAL / REQUESTER
     */
    case 'requester':
      return (
        <RoleAppShell
          home={
            <RequesterDashboardScreen />
          }
          activity={{
            title:
              'My Requests',

            description:
              'Active and previous emergency requests will be shown here.',
          }}
          services={{
            title:
              'Create Request',

            description:
              'The emergency blood request creation flow will be connected here.',
          }}
          profile={{
            title:
              'Requester Profile',

            description:
              'Requester account details will be managed here.',
          }}
          tabLabels={{
            activity:
              'Requests',

            services:
              'Create',
          }}
          tabIcons={{
            activity: {
              icon:
                'document-text-outline',

              activeIcon:
                'document-text',
            },

            services: {
              icon:
                'add-circle-outline',

              activeIcon:
                'add-circle',
            },
          }}
        />
      );

    /**
     * HEALTHCARE STAFF
     */
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

    /**
     * BLOOD BANK
     */
    case 'bloodBank':
      return (
        <RoleAppShell
          home={
            <BloodBankDashboardScreen />
          }
          activity={{
            title:
              'Blood Inventory',

            description:
              'Blood stock levels and inventory updates will be connected here.',
          }}
          services={{
            title:
              'Emergency Requests',

            description:
              'Blood-bank emergency request management will be connected here.',
          }}
          profile={{
            title:
              'Blood Bank Profile',

            description:
              'Blood-bank account details will be managed here.',
          }}
          tabLabels={{
            activity:
              'Inventory',

            services:
              'Requests',
          }}
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

    /**
     * ADMIN
     */
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

    default:
      return (
        <View
          style={
            styles.errorContainer
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            Invalid user role
          </Text>

          <Text
            style={
              styles.errorMessage
            }
          >
            This account does not
            have a valid
            BloodConnect role.
          </Text>
        </View>
      );
  }
}

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

  /*
   * Keep splash visible:
   *
   * 1. for at least 2.5 seconds
   * 2. while Firebase checks login state
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
        <DashboardRouter />
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
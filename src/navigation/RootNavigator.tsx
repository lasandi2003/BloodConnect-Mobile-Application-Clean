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

 request-verification-and-donor-matching-
// Other role dashboards
import RequesterDashboardScreen from '../features/emergencyRequest/screens/RequesterDashboardScreen';
import VerificationMatchingNavigator from '../features/verificationMatching/navigation/VerificationMatchingNavigator';

// ========================================
// REQUESTER MODULE
// ========================================

import RequesterNavigator from '../features/emergencyRequest/navigation/RequesterNavigator';

// ========================================
// OTHER ROLE DASHBOARDS
// ========================================

import HealthcareDashboardScreen from '../features/verificationMatching/screens/HealthcareDashboardScreen';

 dev
import BloodBankDashboardScreen from '../features/inventoryAdmin/screens/BloodBankDashboardScreen';

import AdminDashboardScreen from '../features/inventoryAdmin/screens/AdminDashboardScreen';
import DonorManagementScreen from '../features/inventoryAdmin/screens/DonorManagementScreen';

// ========================================
// BLOOD BANK REQUEST SCREENS
// ========================================

import RequestManagementScreen from '../features/bloodBankRequests/screens/RequestManagementScreen';

// ========================================
// BLOOD BANK INVENTORY SCREENS
// ========================================

import UpdateStockScreen from '../features/inventoryAdmin/screens/UpdateStockScreen';

import InventoryReportsScreen from '../features/inventoryAdmin/screens/InventoryReportsScreen';

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

    case 'donor':

      return (
        <DonorNavigator />
      );

    // ======================================
    // REQUESTER
    // ======================================

    case 'requester':

      return (
        <RequesterNavigator />
      );

    // ======================================
    // HEALTHCARE STAFF
    // ======================================

    case 'healthcare':
 request-verification-and-donor-matching-
      return <VerificationMatchingNavigator />;

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
 dev

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
          // INVENTORY
          // --------------------------------

          activity={{
            title:
              'Blood Inventory',

            description:
              'Manage blood stock and inventory.',
          }}

          activityContent={
            <UpdateStockScreen
              onBack={() => {}}
            />
          }

          // --------------------------------
          // REQUESTS
          // --------------------------------

          services={{
            title:
              'Emergency Requests',

            description:
              'Manage emergency blood requests.',
          }}

          servicesContent={
            <RequestManagementScreen
              onBack={() => {}}
            />
          }

          // --------------------------------
          // PROFILE
          // --------------------------------

          profile={{
            title:
              'Blood Bank Profile',

            description:
              'Blood-bank account details.',
          }}

          // --------------------------------
          // REPORTS
          // --------------------------------

          reports={{
            title:
              'Inventory Reports',

            description:
              'View blood availability and inventory reports.',
          }}

          reportsContent={
            <InventoryReportsScreen
              onBack={() => {}}
            />
          }

          // --------------------------------
          // SHOW REPORTS
          // --------------------------------

          showReports={true}

          // --------------------------------
          // TAB LABELS
          // --------------------------------

          tabLabels={{
            home:
              'Home',

            activity:
              'Inventory',

            services:
              'Requests',

            reports:
              'Reports',
          }}

          // --------------------------------
          // TAB ICONS
          // --------------------------------

          tabIcons={{

            home: {
              icon:
                'home-outline',

              activeIcon:
                'home',
            },

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

            reports: {
              icon:
                'bar-chart-outline',

              activeIcon:
                'bar-chart',
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
 request-verification-and-donor-matching-
          activityContent={
            <DonorManagementScreen />
          }
 dev
          activity={{
            title:
              'Donor Management',

            description:
              'Search and review registered donors.',
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
              'Donors',

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
 request-verification-and-donor-matching-
  });

  }); 
dev

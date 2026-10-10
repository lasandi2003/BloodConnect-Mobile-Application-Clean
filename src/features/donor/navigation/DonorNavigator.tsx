import React from 'react';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import DonorDashboardScreen from '../screens/DonorDashboardScreen';

import BloodRequestsScreen from '../screens/BloodRequestsScreen';

import RequestDetailsScreen from '../screens/RequestDetailsScreen';

import DonationConfirmationScreen from '../screens/DonationConfirmationScreen';

import DonationHistoryScreen from '../screens/DonationHistoryScreen';

import DonorProfileScreen from '../screens/DonorProfileScreen';
import FindDonationCentresScreen from '../screens/FindDonationCentresScreen';

import type {
  DonorStackParamList,
} from './types';

const Stack =
  createNativeStackNavigator<
    DonorStackParamList
  >();

export default function DonorNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DonorDashboard"
      screenOptions={{
        headerShown:
          false,

        animation:
          'slide_from_right',
      }}
    >
      <Stack.Screen name="FindDonationCentres" component={FindDonationCentresScreen} />
      <Stack.Screen
        name="DonorDashboard"
        component={
          DonorDashboardScreen
        }
      />

      <Stack.Screen
        name="BloodRequests"
        component={
          BloodRequestsScreen
        }
      />

      <Stack.Screen
        name="RequestDetails"
        component={
          RequestDetailsScreen
        }
      />

      <Stack.Screen
        name="DonationConfirmation"
        component={
          DonationConfirmationScreen
        }
      />

      <Stack.Screen
        name="DonationHistory"
        component={
          DonationHistoryScreen
        }
      />

      <Stack.Screen
        name="DonorProfile"
        component={
          DonorProfileScreen
        }
      />
    </Stack.Navigator>
  );
}

import React from 'react';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoleAppShell from '../../../components/RoleAppShell';
import HealthcareDashboardScreen from '../screens/HealthcareDashboardScreen';
import PendingBloodRequestsScreen from '../screens/PendingBloodRequestsScreen';
import RequestVerificationScreen from '../screens/RequestVerificationScreen';
import MatchingDonorsScreen from '../screens/MatchingDonorsScreen';
import type { VerificationMatchingStackParamList } from './types';

const Stack = createNativeStackNavigator<VerificationMatchingStackParamList>();
type Navigation = NativeStackNavigationProp<VerificationMatchingStackParamList>;

function VerificationDashboardRoute() {
  const navigation = useNavigation<Navigation>();
  const openPendingRequests = () => navigation.navigate('PendingBloodRequests');

  return (
    <RoleAppShell
      home={<HealthcareDashboardScreen onOpenPendingRequests={openPendingRequests} />}
      activity={{
        title: 'Pending Requests',
        description: 'Requests waiting for healthcare verification will be shown here.',
      }}
      services={{
        title: 'Donor Matching',
        description: 'Compatible donor matching tools will be connected here.',
      }}
      profile={{
        title: 'Healthcare Profile',
        description: 'Doctor or nurse account details will be managed here.',
      }}
      tabLabels={{ home: 'Home', activity: 'Requests', services: 'Donors', profile: 'Profile' }}
      activeTabColor="#C8102E"
      bottomBorderColor="#F3C9CF"
      tabIcons={{
        activity: { icon: 'document-text-outline', activeIcon: 'document-text' },
        services: { icon: 'people-outline', activeIcon: 'people' },
      }}
      tabPressHandlers={{ activity: openPendingRequests }}
    />
  );
}

export default function VerificationMatchingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Dashboard" component={VerificationDashboardRoute} />
      <Stack.Screen name="PendingBloodRequests" component={PendingBloodRequestsScreen} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
      <Stack.Screen name="MatchingDonors" component={MatchingDonorsScreen} />
    </Stack.Navigator>
  );
}

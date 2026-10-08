import React from 'react';

import { Alert } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoleAppShell from '../../../components/RoleAppShell';
import HealthcareDashboardScreen from '../screens/HealthcareDashboardScreen';
import PendingBloodRequestsScreen from '../screens/PendingBloodRequestsScreen';
import RequestVerificationScreen from '../screens/RequestVerificationScreen';
import MatchingDonorsScreen from '../screens/MatchingDonorsScreen';
import DonorDetailsScreen from '../screens/DonorDetailsScreen';
import MatchConfirmationScreen from '../screens/MatchConfirmationScreen';
import NotificationStatusScreen from '../screens/NotificationStatusScreen';
import DonorCommunicationScreen from '../screens/DonorCommunicationScreen';
import MatchingHistoryScreen from '../screens/MatchingHistoryScreen';
import {
  openHealthcareDonorProfile,
} from './healthcareTabNavigation';
import type { VerificationMatchingStackParamList } from './types';

const Stack = createNativeStackNavigator<VerificationMatchingStackParamList>();
type Navigation = NativeStackNavigationProp<VerificationMatchingStackParamList>;

function VerificationDashboardRoute() {
  const navigation = useNavigation<Navigation>();
  const [latestVerifiedRequestId, setLatestVerifiedRequestId] = React.useState<string | null>(null);
  const openPendingRequests = () => navigation.navigate('PendingBloodRequests');
  const openRequestVerification = (requestId: string) =>
    navigation.navigate('RequestVerification', { requestId });
  const openHistory = () => navigation.navigate('MatchingHistory');
  const openDonorMatching = (requestId: string) =>
    navigation.navigate('MatchingDonors', { requestId });
  const openDonorMatchingFromTab = () => {
    if (!latestVerifiedRequestId) {
      Alert.alert(
        'Donor matching unavailable',
        'No verified request available for donor matching.',
      );
      return;
    }

    openDonorMatching(latestVerifiedRequestId);
  };

  return (
    <RoleAppShell
      home={(
        <HealthcareDashboardScreen
          onOpenPendingRequests={openPendingRequests}
          onOpenRequestVerification={openRequestVerification}
          onOpenHistory={openHistory}
          onOpenDonorMatching={openDonorMatching}
          onVerifiedRequestChange={setLatestVerifiedRequestId}
        />
      )}
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
      tabPressHandlers={{
        activity: openPendingRequests,
        services: openDonorMatchingFromTab,
        profile: () => void openHealthcareDonorProfile(navigation),
      }}
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
      <Stack.Screen name="DonorDetails" component={DonorDetailsScreen} />
      <Stack.Screen name="MatchConfirmation" component={MatchConfirmationScreen} />
      <Stack.Screen name="NotificationStatus" component={NotificationStatusScreen} />
      <Stack.Screen name="DonorCommunication" component={DonorCommunicationScreen} />
      <Stack.Screen name="MatchingHistory" component={MatchingHistoryScreen} />
    </Stack.Navigator>
  );
}

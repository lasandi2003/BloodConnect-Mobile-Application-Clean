import React from 'react';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';

import RoleAppShell from '../../../components/RoleAppShell';
import RequesterDashboardScreen from '../screens/RequesterDashboardScreen';
import RequesterProfileScreen from '../screens/RequesterProfileScreen';
import RequestHistoryScreen, { RequestHistoryContent } from '../screens/RequestHistoryScreen';
import PatientInformationScreen from '../screens/PatientInformationScreen';
import HospitalDetailsScreen from '../screens/HospitalDetailsScreen';
import ReviewRequestScreen from '../screens/ReviewRequestScreen';
import RequestSubmittedScreen from '../screens/RequestSubmittedScreen';
import RequestStatusScreen from '../screens/RequestStatusScreen';
import UpdateRequestScreen from '../screens/UpdateRequestScreen';
import CancelRequestScreen from '../screens/CancelRequestScreen';
import { EmergencyRequestDraftProvider, useEmergencyRequestDraft } from '../context/EmergencyRequestDraftContext';
import type { RequesterStackParamList } from './types';

const Stack = createNativeStackNavigator<RequesterStackParamList>();

function RequesterHome({ navigation }: NativeStackScreenProps<RequesterStackParamList, 'RequesterDashboard'>) {
  const { resetDraft } = useEmergencyRequestDraft();

  function handleCreateRequest() {
    resetDraft();
    navigation.navigate('PatientInformation');
  }

  return (
    <RoleAppShell
      home={<RequesterDashboardScreen onCreateRequest={handleCreateRequest} onRequestHistory={() => navigation.navigate('RequestHistory')} onOpenRequest={requestId => navigation.navigate('RequestStatus', { requestId })} />}
      tabPressHandlers={{ services: handleCreateRequest }}
      activityContent={<RequestHistoryContent onOpenRequest={requestId => navigation.navigate('RequestStatus', { requestId })} />}
      profileContent={<RequesterProfileScreen />}
      activity={{
        title: 'My Requests',
        description: 'Active and previous emergency requests will be shown here.',
      }}
      services={{
        title: 'Create Request',
        description: 'The emergency blood request creation flow will be connected here.',
      }}
      profile={{
        title: 'Requester Profile',
        description: 'Requester account details will be managed here.',
      }}
      tabLabels={{ activity: 'Requests', services: 'Create' }}
      tabIcons={{
        activity: { icon: 'document-text-outline', activeIcon: 'document-text' },
        services: { icon: 'add-circle-outline', activeIcon: 'add-circle' },
      }}
    />
  );
}

export default function RequesterNavigator() {
  return (
    <EmergencyRequestDraftProvider>
      <Stack.Navigator
        initialRouteName="RequesterDashboard"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="RequesterDashboard" component={RequesterHome} />
        <Stack.Screen name="RequestHistory" component={RequestHistoryScreen} />
        <Stack.Screen name="PatientInformation" component={PatientInformationScreen} />
        <Stack.Screen name="HospitalDetails" component={HospitalDetailsScreen} />
        <Stack.Screen name="ReviewRequest" component={ReviewRequestScreen} />
        <Stack.Screen name="RequestSubmitted" component={RequestSubmittedScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="RequestStatus" component={RequestStatusScreen} />
        <Stack.Screen name="UpdateRequest" component={UpdateRequestScreen} />
        <Stack.Screen name="CancelRequest" component={CancelRequestScreen}
          options={{ presentation: 'transparentModal', animation: 'fade', gestureEnabled: false }} />
      </Stack.Navigator>
    </EmergencyRequestDraftProvider>
  );
}

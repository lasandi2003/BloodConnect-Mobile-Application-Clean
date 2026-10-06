import React from 'react';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';

import RoleAppShell from '../../../components/RoleAppShell';
import RequesterDashboardScreen from '../screens/RequesterDashboardScreen';
import PatientInformationScreen from '../screens/PatientInformationScreen';
import type { RequesterStackParamList } from './types';

const Stack = createNativeStackNavigator<RequesterStackParamList>();

function RequesterHome({ navigation }: NativeStackScreenProps<RequesterStackParamList, 'RequesterDashboard'>) {
  return (
    <RoleAppShell
      home={<RequesterDashboardScreen onCreateRequest={() => navigation.navigate('PatientInformation')} />}
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
    <Stack.Navigator
      initialRouteName="RequesterDashboard"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="RequesterDashboard" component={RequesterHome} />
      <Stack.Screen name="PatientInformation" component={PatientInformationScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';

import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {
  AuthProvider,
} from './src/features/auth/context/AuthContext';

import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaProvider>
      <View
        style={[
          styles.page,
          isWeb && styles.webPage,
        ]}
      >
        <View
          style={[
            styles.app,
            isWeb && styles.webPhone,
          ]}
        >
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  app: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  webPage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1F5',
    minHeight: '100vh' as never,
  },

  webPhone: {
    width: '100%',
    maxWidth: 430,
    height: '100vh' as never,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },
});
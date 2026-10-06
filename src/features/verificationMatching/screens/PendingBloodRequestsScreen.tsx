import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import RoleAppShell from '../../../components/RoleAppShell';
import PendingRequestCard from '../components/PendingRequestCard';
import type { VerificationMatchingStackParamList } from '../navigation/types';
import { getPendingVerificationRequests } from '../services/verificationService';

type Navigation = NativeStackNavigationProp<VerificationMatchingStackParamList>;

function PendingRequestsContent() {
  const navigation = useNavigation<Navigation>();
  const [requests, setRequests] = useState<Awaited<
    ReturnType<typeof getPendingVerificationRequests>
  >>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      setRequests(await getPendingVerificationRequests());
    } catch (error) {
      console.error('Pending blood requests error:', error);
      setErrorMessage('We could not load pending requests. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.frame}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to verification dashboard"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.primary} />
          </Pressable>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Pending Blood Requests</Text>
            <Text style={styles.subtitle}>Review requests awaiting verification.</Text>
          </View>
          <View style={styles.titleIcon}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadRequests(true)}
              tintColor={COLORS.primary}
            />
          )}
        >
          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.stateText}>Loading pending requests...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateCard}>
              <Ionicons name="cloud-offline-outline" size={30} color={COLORS.primary} />
              <Text style={styles.stateTitle}>Unable to load requests</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadRequests()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="checkmark-circle-outline" size={34} color={COLORS.success} />
              <Text style={styles.stateTitle}>All caught up</Text>
              <Text style={styles.stateText}>There are no blood requests waiting for verification.</Text>
            </View>
          ) : (
            <>
              <View style={styles.listHeading}>
                <Text style={styles.resultCount}>{requests.length} pending</Text>
                <Text style={styles.sortHint}>Critical requests first</Text>
              </View>
              {requests.map(request => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  onPress={() => Alert.alert(
                    'Request details',
                    'Request verification details will be available in the next screen.',
                  )}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default function PendingBloodRequestsScreen() {
  const navigation = useNavigation<Navigation>();
  const content = <PendingRequestsContent />;

  return (
    <RoleAppShell
      home={content}
      activityContent={content}
      activity={{
        title: 'Pending Requests',
        description: 'Requests waiting for healthcare verification.',
      }}
      services={{
        title: 'Donor Matching',
        description: 'Compatible donor matching tools will be connected here.',
      }}
      profile={{
        title: 'Healthcare Profile',
        description: 'Doctor or nurse account details will be managed here.',
      }}
      initialTab="activity"
      tabPressHandlers={{ home: () => navigation.goBack() }}
      tabLabels={{ home: 'Home', activity: 'Requests', services: 'Donors', profile: 'Profile' }}
      activeTabColor="#C8102E"
      bottomBorderColor="#F3C9CF"
      tabIcons={{
        activity: { icon: 'document-text-outline', activeIcon: 'document-text' },
        services: { icon: 'people-outline', activeIcon: 'people' },
      }}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headingCopy: { flex: 1, minWidth: 0 },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 3,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  listHeading: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sortHint: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  stateCard: {
    flex: 1,
    minHeight: 210,
    marginTop: 12,
    padding: 22,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

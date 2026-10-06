import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import type { BloodGroup } from '../../donor/types/donor';

type Navigation = NativeStackNavigationProp<VerificationMatchingStackParamList>;
type BloodGroupFilter = 'All' | BloodGroup;

const BLOOD_GROUPS: BloodGroupFilter[] = [
  'All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-',
];

function PendingRequestsContent() {
  const navigation = useNavigation<Navigation>();
  const [requests, setRequests] = useState<Awaited<
    ReturnType<typeof getPendingVerificationRequests>
  >>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] =
    useState<BloodGroupFilter>('All');

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

  const filteredRequests = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return requests.filter(request => {
      const matchesBloodGroup =
        selectedBloodGroup === 'All' ||
        request.bloodGroup === selectedBloodGroup;
      const matchesSearch =
        searchTerm.length === 0 ||
        request.patientName.toLowerCase().includes(searchTerm) ||
        request.hospitalName.toLowerCase().includes(searchTerm);

      return matchesBloodGroup && matchesSearch;
    });
  }, [requests, search, selectedBloodGroup]);

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
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </Pressable>
          <View style={styles.brand}>
            <Text style={styles.brandBlood}>Blood</Text>
            <Text style={styles.brandConnect}>Connect</Text>
          </View>
          <View style={styles.profileButton}>
            <Ionicons name="person-outline" size={17} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.pageHeading}>
          <Text style={styles.title}>Pending requests</Text>
          <Text style={styles.subtitle}>
            {requests.length} {requests.length === 1 ? 'request needs' : 'requests need'} your attention
          </Text>
        </View>

        <View style={styles.controls}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              accessibilityLabel="Search pending requests by name or hospital"
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or hospital"
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {search.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear request search"
                hitSlop={8}
                onPress={() => setSearch('')}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search and blood group filters"
            onPress={() => {
              setSearch('');
              setSelectedBloodGroup('All');
            }}
            style={styles.filterButton}
          >
            <Ionicons name="options-outline" size={19} color={COLORS.white} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bloodGroupFilters}
        >
          {BLOOD_GROUPS.map(group => {
            const active = selectedBloodGroup === group;

            return (
              <Pressable
                key={group}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedBloodGroup(group)}
                style={[styles.filterChip, active && styles.activeFilterChip]}
              >
                <Text style={[styles.filterChipText, active && styles.activeFilterChipText]}>
                  {group}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!loading && !errorMessage && filteredRequests.length > 0 ? (
          <View style={styles.urgencySummary}>
            {([
              { label: 'Critical', color: '#A8071A' },
              { label: 'Urgent', color: '#B86E00' },
              { label: 'Normal', color: COLORS.success },
            ] as const).map(item => {
              const count = filteredRequests.filter(
                request => request.urgency === item.label.toLowerCase(),
              ).length;

              return count > 0 ? (
                <View key={item.label} style={styles.urgencyPill}>
                  <View style={[styles.urgencyDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.urgencyText, { color: item.color }]}>
                    {count} {item.label}
                  </Text>
                </View>
              ) : null;
            })}
          </View>
        ) : null}

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
          ) : filteredRequests.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="search-outline" size={30} color={COLORS.textMuted} />
              <Text style={styles.stateTitle}>No matching requests</Text>
              <Text style={styles.stateText}>
                Try changing your search or blood group filter.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.listHeading}>
                <Text style={styles.resultCount}>{filteredRequests.length} pending</Text>
                <Text style={styles.sortHint}>Critical requests first</Text>
              </View>
              {filteredRequests.map(request => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  onPress={() => navigation.navigate(
                    'RequestVerification',
                    { requestId: request.id },
                  )}
                />
              ))}
            </>
          )}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create blood request is not available yet"
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.createRequestButton}
        >
          <Ionicons name="add" size={29} color={COLORS.white} />
        </Pressable>
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
    position: 'relative',
  },
  header: {
    minHeight: 48,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBlood: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  brandConnect: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageHeading: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 5,
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: COLORS.textSecondary,
    fontSize: 9,
  },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchBox: {
    flex: 1,
    minWidth: 0,
    height: 39,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: COLORS.text,
    fontSize: 12,
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#C8102E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodGroupFilters: {
    height: 49,
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 7,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    minWidth: 34,
    height: 36,
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F3C9CF',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  activeFilterChip: {
    borderColor: '#C8102E',
    backgroundColor: '#C8102E',
  },
  filterChipText: {
    color: '#B2081B',
    fontSize: 9,
    fontWeight: '700',
  },
  activeFilterChipText: {
    color: COLORS.white,
  },
  urgencySummary: {
    paddingHorizontal: 17,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  urgencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgencyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 8,
    fontWeight: '700',
  },
  listContent: {
    flex: 1,
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 82,
  },
  createRequestButton: {
    position: 'absolute',
    right: 18,
    bottom: 14,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8102E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 6,
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
    minHeight: 126,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 14,
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

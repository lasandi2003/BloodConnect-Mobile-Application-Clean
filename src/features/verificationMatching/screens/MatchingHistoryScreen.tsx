import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import RoleAppShell from '../../../components/RoleAppShell';
import { COLORS } from '../../../constants/colors';
import type { VerificationMatchingStackParamList } from '../navigation/types';
import {
  openHealthcareDonorMatching,
  openHealthcareDonorProfile,
} from '../navigation/healthcareTabNavigation';
import {
  getMatchingHistory,
  type MatchingHistoryRecord,
} from '../services/verificationService';
import HealthcareDashboardScreen from './HealthcareDashboardScreen';

type Props = NativeStackScreenProps<VerificationMatchingStackParamList, 'MatchingHistory'>;
type HistoryFilter = 'All' | 'In Progress' | 'Completed';

const FILTERS: HistoryFilter[] = ['All', 'In Progress', 'Completed'];

function timestampMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date; toMillis?: () => number };
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (typeof timestamp.toDate === 'function') {
      const time = timestamp.toDate().getTime();
      return Number.isNaN(time) ? null : time;
    }
  }
  return null;
}

function dateLabel(value: unknown): string {
  const time = timestampMillis(value);
  return time === null
    ? 'Date unavailable'
    : new Date(time).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
}

function normalizedStatus(record: MatchingHistoryRecord): string {
  return record.status.trim().toLowerCase();
}

function firebaseErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { code: 'unknown', message: String(error), error };
  }
  const firebaseError = error as { code?: unknown; message?: unknown };
  return {
    code: typeof firebaseError.code === 'string' ? firebaseError.code : 'unknown',
    message: typeof firebaseError.message === 'string' ? firebaseError.message : String(error),
    error,
  };
}

function displayStatus(record: MatchingHistoryRecord): string {
  const status = normalizedStatus(record);
  if (status === 'accepted' || status === 'pending' || status === 'matched') return 'In Progress';
  if (status === 'completed') return 'Completed';
  if (status === 'declined') return 'Declined';
  if (status === 'withdrawn') return 'Withdrawn';
  if (status === 'cancelled' || status === 'canceled') return 'Cancelled';
  if (status === 'rejected') return 'Rejected';
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
}

function statusStyle(record: MatchingHistoryRecord) {
  const status = normalizedStatus(record);
  if (status === 'completed') return styles.statusCompleted;
  if (status === 'accepted' || status === 'pending' || status === 'matched') return styles.statusInProgress;
  if (['declined', 'withdrawn', 'cancelled', 'canceled', 'rejected'].includes(status)) {
    return styles.statusRejected;
  }
  return styles.statusUnknown;
}

function HistoryCard({
  record,
  onPress,
}: {
  record: MatchingHistoryRecord;
  onPress?: () => void;
}) {
  const pressable = !['cancelled', 'canceled', 'rejected'].includes(normalizedStatus(record));
  return (
    <Pressable
      accessibilityRole={pressable ? 'button' : undefined}
      accessibilityLabel={pressable ? `Open notification status for ${record.patientName} and ${record.donorName}` : undefined}
      accessibilityState={{ disabled: !pressable }}
      disabled={!pressable}
      onPress={onPress}
      style={({ pressed }) => [styles.historyCard, pressed && styles.pressedCard]}
    >
      <View style={styles.bloodBadge}>
        <Text style={styles.bloodBadgeText}>{record.bloodGroup}</Text>
      </View>
      <View style={styles.recordCopy}>
        <Text style={styles.patientName} numberOfLines={1}>{record.patientName}</Text>
        <Text style={styles.donorLine} numberOfLines={1}>Donor: {record.donorName}
          {record.unitsRequired !== undefined ? ` · ${record.unitsRequired} ${record.unitsRequired === 1 ? 'unit' : 'units'}` : ''}
        </Text>
        <Text style={styles.recordMeta} numberOfLines={1}>
          {dateLabel(record.createdAt)} · #{record.requestId}
        </Text>
      </View>
      <View style={styles.statusColumn}>
        <View style={[styles.statusPill, statusStyle(record)]}>
          <Text style={[styles.statusText, statusStyle(record)]}>{displayStatus(record)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#A9A1A3" />
      </View>
    </Pressable>
  );
}

function HistoryContent({ route, navigation }: Props) {
  const currentRequestId = route.params?.requestId;
  const currentDonorId = route.params?.donorId;
  const [records, setRecords] = useState<MatchingHistoryRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('All');
  const [newestFirst, setNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      setRecords(await getMatchingHistory());
    } catch (loadError) {
      console.error('[MatchingHistory] Firestore history load failed:', firebaseErrorDetails(loadError));
      setError('Unable to load matching history. Check your connection and access.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const matchedRecords = useMemo(
    () => records.filter(record => ['accepted', 'completed', 'matched'].includes(normalizedStatus(record))),
    [records],
  );
  const completedCount = matchedRecords.filter(record => normalizedStatus(record) === 'completed').length;
  const successRateValue = completedCount > 0 && matchedRecords.length > 0
    ? (completedCount / matchedRecords.length) * 100
    : null;
  const successRate = successRateValue === null ? '—' : `${successRateValue.toFixed(1)}%`;
  const ringRadius = 24;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - (successRateValue ?? 0) / 100);

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records
      .filter(record => {
        const status = normalizedStatus(record);
        if (filter === 'In Progress' && !['accepted', 'pending', 'matched'].includes(status)) return false;
        if (filter === 'Completed' && status !== 'completed') return false;
        if (!query) return true;
        return [record.requestId, record.patientName, record.donorName]
          .some(value => value.toLocaleLowerCase().includes(query));
      })
      .sort((a, b) => {
        const aIsCurrent = Boolean(currentRequestId && currentDonorId &&
          a.requestId === currentRequestId && a.donorId === currentDonorId);
        const bIsCurrent = Boolean(currentRequestId && currentDonorId &&
          b.requestId === currentRequestId && b.donorId === currentDonorId);
        if (aIsCurrent !== bIsCurrent) return aIsCurrent ? -1 : 1;
        const aTime = timestampMillis(a.updatedAt ?? a.createdAt) ?? 0;
        const bTime = timestampMillis(b.updatedAt ?? b.createdAt) ?? 0;
        return newestFirst ? bTime - aTime : aTime - bTime;
      });
  }, [currentDonorId, currentRequestId, filter, newestFirst, records, search]);

  const openPending = () => navigation.navigate('PendingBloodRequests');
  const openRequest = (requestId: string) => navigation.navigate('RequestVerification', { requestId });
  const openHistory = () => navigation.navigate('MatchingHistory');

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.summaryCard}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Total matches</Text>
          <Text style={styles.metricValue}>{loading ? '—' : matchedRecords.length}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={[styles.metricBlock, styles.successMetric]}>
          <View style={styles.progressRing}>
            <Svg width={62} height={62} viewBox="0 0 62 62" accessibilityLabel="Success rate progress">
              <Circle cx="31" cy="31" r={ringRadius} fill="none" stroke="#D9F0E3" strokeWidth="6" />
              <Circle
                cx="31"
                cy="31"
                r={ringRadius}
                fill="none"
                stroke="#168653"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                rotation={-90}
                originX="31"
                originY="31"
              />
            </Svg>
          </View>
          <View style={styles.successCopy}>
            <Text style={styles.metricLabel}>Success rate</Text>
            <Text style={styles.successValue}>{loading ? '—' : successRate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#969093" />
        <TextInput
          accessibilityLabel="Search matching history"
          value={search}
          onChangeText={setSearch}
          placeholder="Search matching ID, patient, donor..."
          placeholderTextColor="#9A9496"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9A9496" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterSegment}>
        {FILTERS.map(item => {
          const selected = filter === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setFilter(item)}
              style={[styles.filterButton, selected && styles.filterButtonSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Recent matches</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort ${newestFirst ? 'oldest' : 'newest'} first`}
          onPress={() => setNewestFirst(value => !value)}
          style={styles.sortButton}
        >
          <Text style={styles.sortText}>{newestFirst ? 'Newest' : 'Oldest'}</Text>
          <Ionicons name="swap-vertical" size={14} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );

  const emptyContent = loading ? (
    <View style={styles.stateCard}>
      <ActivityIndicator color={COLORS.primary} />
      <Text style={styles.stateBody}>Loading matching history...</Text>
    </View>
  ) : error ? (
    <View style={styles.stateCard}>
      <Ionicons name="cloud-offline-outline" size={26} color={COLORS.primary} />
      <Text style={styles.stateTitle}>History unavailable</Text>
      <Text style={styles.stateBody}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => { setLoading(true); void loadHistory(); }} style={styles.retryButton}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : records.length === 0 ? (
    <View style={styles.stateCard}>
      <Ionicons name="time-outline" size={28} color={COLORS.primary} />
      <Text style={styles.stateTitle}>No matching history yet</Text>
      <Text style={styles.stateBody}>Completed donor matches will appear here.</Text>
    </View>
  ) : (
    <View style={styles.stateCard}>
      <Ionicons name="search-outline" size={25} color="#A29B9D" />
      <Text style={styles.stateTitle}>No matches found</Text>
      <Text style={styles.stateBody}>Try another search or select a different status.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={19} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Matching history</Text>
            <Text style={styles.headerSubtitle}>All donor matches in one place</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sort ${newestFirst ? 'oldest' : 'newest'} first`}
            onPress={() => setNewestFirst(value => !value)}
            style={styles.headerAction}
          >
            <Ionicons name="options-outline" size={18} color={COLORS.primary} />
          </Pressable>
        </View>

        <FlatList
          data={visibleRecords}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <HistoryCard
              record={item}
              onPress={() => navigation.navigate('NotificationStatus', {
                requestId: item.requestId,
                donorId: item.donorId,
              })}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyContent}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void loadHistory(); }}
              tintColor={COLORS.primary}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

export default function MatchingHistoryScreen(props: Props) {
  const { navigation } = props;
  const openPending = () => navigation.navigate('PendingBloodRequests');
  const openRequest = (requestId: string) => navigation.navigate('RequestVerification', { requestId });
  const openHistory = () => navigation.navigate('MatchingHistory');

  return (
    <RoleAppShell
      home={(
        <HealthcareDashboardScreen
          onOpenPendingRequests={openPending}
          onOpenRequestVerification={openRequest}
          onOpenHistory={openHistory}
        />
      )}
      servicesContent={<HistoryContent {...props} />}
      activity={{ title: 'Pending Requests', description: 'Requests waiting for healthcare verification will be shown here.' }}
      services={{ title: 'Donor Matching', description: 'Review matching history.' }}
      profile={{ title: 'Healthcare Profile', description: 'Doctor or nurse account details will be managed here.' }}
      initialTab="services"
      tabLabels={{ home: 'Home', activity: 'Requests', services: 'Donors', profile: 'Profile' }}
      activeTabColor="#C8102E"
      bottomBorderColor="#F3C9CF"
      tabIcons={{
        activity: { icon: 'document-text-outline', activeIcon: 'document-text' },
        services: { icon: 'people-outline', activeIcon: 'people' },
      }}
      tabPressHandlers={{
        home: () => navigation.popToTop(),
        activity: openPending,
        services: () => void openHealthcareDonorMatching(navigation, props.route.params?.requestId),
        profile: () => void openHealthcareDonorProfile(navigation, props.route.params),
      }}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF5F5' },
  page: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 16 },
  header: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F1E2E4' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSubtitle: { marginTop: 2, color: COLORS.textSecondary, fontSize: 10, lineHeight: 14 },
  headerAction: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F1E2E4' },
  listContent: { paddingTop: 7, paddingBottom: 20, flexGrow: 1 },
  listHeader: { gap: 12, paddingBottom: 12 },
  summaryCard: { minHeight: 116, paddingHorizontal: 17, paddingVertical: 15, borderRadius: 19, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F2E6E8', flexDirection: 'row', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  metricBlock: { flex: 1, gap: 6 },
  metricDivider: { width: 1, height: 68, backgroundColor: '#F0E5E7', marginHorizontal: 13 },
  successMetric: { flex: 1.25, paddingLeft: 2, flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '500' },
  metricValue: { color: COLORS.text, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  progressRing: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center' },
  successCopy: { flex: 1, minWidth: 0, gap: 4 },
  successValue: { color: '#168653', fontSize: 19, lineHeight: 24, fontWeight: '800' },
  searchBox: { minHeight: 45, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F0E2E4', backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 8, color: COLORS.text, fontSize: 11 },
  filterSegment: { padding: 4, borderRadius: 14, backgroundColor: '#F7ECEE', flexDirection: 'row', gap: 4 },
  filterButton: { flex: 1, minHeight: 34, paddingHorizontal: 4, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  filterButtonSelected: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 4, elevation: 2 },
  filterText: { color: '#777174', fontSize: 10, fontWeight: '600' },
  filterTextSelected: { color: COLORS.white },
  sectionHeading: { marginTop: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FCEAEC' },
  sortText: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  historyCard: { minHeight: 81, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: '#F1E5E7', backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.045, shadowRadius: 6, elevation: 1 },
  pressedCard: { transform: [{ scale: 0.99 }] },
  bloodBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  bloodBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  recordCopy: { flex: 1, minWidth: 0, gap: 3 },
  patientName: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  donorLine: { color: '#6F6A6C', fontSize: 10 },
  recordMeta: { color: '#969093', fontSize: 9 },
  statusColumn: { alignItems: 'flex-end', justifyContent: 'center', gap: 5, marginLeft: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 9, fontWeight: '700' },
  statusCompleted: { backgroundColor: '#E7F6ED', color: '#18834F' },
  statusInProgress: { backgroundColor: '#FFF3D9', color: '#B87908' },
  statusRejected: { backgroundColor: '#FCEAEC', color: COLORS.primary },
  statusUnknown: { backgroundColor: '#F0EFF0', color: '#777174' },
  listSeparator: { height: 9 },
  stateCard: { flex: 1, minHeight: 170, paddingHorizontal: 25, paddingVertical: 22, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: '#F1E2E4', backgroundColor: COLORS.white },
  stateTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  stateBody: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  retryButton: { marginTop: 2, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
});

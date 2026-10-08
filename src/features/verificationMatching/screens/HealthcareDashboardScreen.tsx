import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  COLORS,
} from '../../../constants/colors';

import {
  useAuth,
} from '../../auth/context/AuthContext';

import type {
  EmergencyRequest,
} from '../../donor/types/donor';

import {
  getVerificationDashboardSummary,
  type VerificationDashboardSummary,
} from '../services/verificationService';

import WelcomeBanner from '../components/WelcomeBanner';

const EMPTY_SUMMARY: VerificationDashboardSummary = {
  totalRequests: 0,
  pendingRequests: 0,
  verifiedRequests: 0,
  matchedDonors: 0,
  urgentRequests: 0,
  recentRequests: [],
};

type DashboardAction = 'Verify Request' | 'Find Donors' | 'History';

const QUICK_ACTIONS: {
  label: DashboardAction;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  primary?: boolean;
}[] = [
  { label: 'Verify Request', icon: 'document-text-outline', primary: true },
  { label: 'Find Donors', icon: 'people-outline' },
  { label: 'History', icon: 'time-outline' },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getRequestDate(request: EmergencyRequest): Date | null {
  const value = request.createdAt as
    | { toDate?: () => Date }
    | string
    | null
    | undefined;

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return value?.toDate?.() ?? null;
}

function getWeekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function getVerifiedWeekCounts(requests: EmergencyRequest[], today: Date): number[] {
  const monday = getWeekStart(today);
  const counts = Array.from({ length: 7 }, () => 0);

  requests.forEach(request => {
    if (!request.verified) {
      return;
    }

    const date = getRequestDate(request);
    if (!date || date < monday || date > today) {
      return;
    }

    const dayIndex = (date.getDay() + 6) % 7;
    counts[dayIndex] += 1;
  });

  return counts;
}

function UrgentDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.urgentDot, { opacity }]} />;
}

function MetricCard({
  label,
  value,
  icon,
  color,
  loading,
  urgent,
}: {
  label: string;
  value: number | null;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  loading: boolean;
  urgent?: boolean;
}) {
  const noMatches = label === 'Matched' && (!value || value < 1);

  return (
    <View
      style={[
        styles.statCard,
        { borderLeftColor: color },
        urgent && value !== null && value > 0 && styles.urgentCardGlow,
      ]}
    >
      <View style={styles.statTopLine}>
        <Ionicons name={icon} size={20} color={color} />
        {urgent && value !== null && value > 0 ? <UrgentDot /> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.statSpinner} />
      ) : noMatches ? (
        <Text style={styles.noMatches}>No matches yet</Text>
      ) : (
        <Text style={styles.statCount}>{value ?? '—'}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function VerifiedWeekChart({ requests }: { requests: EmergencyRequest[] }) {
  const now = new Date();
  const counts = useMemo(
    () => getVerifiedWeekCounts(requests, now),
    [requests],
  );
  const maxCount = Math.max(1, ...counts);
  const todayIndex = (now.getDay() + 6) % 7;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeading}>
        <Text style={styles.sectionTitle}>Verified this week</Text>
        <Text style={styles.chartTotal}>
          Total: {counts.reduce((total, count) => total + count, 0)}
        </Text>
      </View>

      <View style={styles.chart}>
        {WEEKDAYS.map((day, index) => {
          const count = counts[index];
          const height = count === 0 ? 8 : Math.max(14, (count / maxCount) * 100);

          return (
            <View key={day} style={styles.chartColumn}>
              <Text style={styles.chartCount}>{count || ''}</Text>
              <View style={styles.chartTrack}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${height}%`,
                      backgroundColor: index === todayIndex ? '#C8102E' : '#F3C9CF',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartDay, index === todayIndex && styles.chartToday]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function urgencyStyle(request: EmergencyRequest) {
  if (request.urgency === 'critical') {
    return { label: 'Critical', chip: styles.criticalChip, text: styles.criticalText };
  }

  if (request.urgency === 'urgent') {
    return { label: 'Urgent', chip: styles.urgentChip, text: styles.urgentText };
  }

  return { label: 'Normal', chip: styles.normalChip, text: styles.normalText };
}

function RequestCard({
  request,
  onPress,
}: {
  request: EmergencyRequest;
  onPress: (requestId: string) => void;
}) {
  const urgency = urgencyStyle(request);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${request.patientName} request details`}
      onPress={() => onPress(request.id)}
      style={({ pressed }) => [styles.requestCard, pressed && styles.pressedCard]}
    >
      <View style={styles.bloodBadge}>
        <Text style={styles.bloodBadgeText}>{request.bloodGroup}</Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.patientName} numberOfLines={1}>{request.patientName}</Text>
        <Text style={styles.requestId} numberOfLines={1}>
          #{request.id}
        </Text>
      </View>
      <View style={styles.requestTrailing}>
        <View style={[styles.urgencyChip, urgency.chip]}>
          <Text style={[styles.urgencyText, urgency.text]}>{urgency.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color="#A7A0A2" />
      </View>
    </Pressable>
  );
}

export default function HealthcareDashboardScreen({
  onOpenPendingRequests,
  onOpenRequestVerification,
  onOpenHistory,
}: {
  onOpenPendingRequests: () => void;
  onOpenRequestVerification: (requestId: string) => void;
  onOpenHistory: () => void;
}) {
  const { profile, logout } = useAuth();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getVerificationDashboardSummary();
      setSummary(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Verification dashboard load error:', error);
      setErrorMessage('We could not load blood requests. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getVerificationDashboardSummary()
      .then(data => {
        if (active) {
          setSummary(data);
          setErrorMessage(null);
        }
      })
      .catch(error => {
        console.error('Verification dashboard load error:', error);
        if (active) {
          setErrorMessage('We could not load blood requests. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function refreshDashboard() {
    setRefreshing(true);
    void loadDashboard();
  }

  function retryDashboard() {
    setLoading(true);
    void loadDashboard();
  }

  async function handleLogout() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to sign out?')) {
        await logout();
      }
      return;
    }

    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  const initials = (profile?.fullName ?? 'Staff')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshDashboard}
            tintColor="#C8102E"
          />
        )}
      >
        <View style={styles.header}>
          <View style={styles.menuButton}>
            <Ionicons name="menu" size={19} color="#2D292A" />
          </View>
          <View style={styles.brand}>
            <Text style={styles.brandBlood}>Blood</Text>
            <Text style={styles.brandConnect}>Connect</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={styles.avatarButton}
            onPress={() => void handleLogout()}
          >
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </Pressable>
        </View>

        <WelcomeBanner username={profile?.fullName ?? 'Staff Member'} />

        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Verification dashboard</Text>
          <Text style={styles.pageSubtitle}>Verify requests and match donors.</Text>
        </View>

        <View style={styles.statsGrid}>
          <MetricCard
            label="Pending"
            value={summary.pendingRequests}
            icon="time-outline"
            color="#D99A16"
            loading={loading}
          />
          <MetricCard
            label="Verified"
            value={summary.verifiedRequests}
            icon="checkmark-circle"
            color="#20A66A"
            loading={loading}
          />
          <MetricCard
            label="Matched"
            value={summary.matchedDonors}
            icon="people"
            color="#3980DF"
            loading={loading}
          />
          <MetricCard
            label="Urgent"
            value={summary.urgentRequests}
            icon="warning"
            color="#C8102E"
            loading={loading}
            urgent
          />
        </View>

        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(action => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={
                action.label === 'Verify Request'
                  ? onOpenPendingRequests
                  : action.label === 'History'
                    ? onOpenHistory
                    : undefined
              }
              style={({ pressed }) => [
                styles.quickAction,
                action.primary ? styles.primaryAction : styles.secondaryAction,
                pressed && styles.pressedAction,
              ]}
            >
              <Ionicons
                name={action.icon}
                size={21}
                color={action.primary ? '#FFFFFF' : '#C8102E'}
              />
              <Text style={[styles.quickActionLabel, action.primary && styles.primaryActionLabel]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.recentHeading}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <Pressable accessibilityRole="button" style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View all</Text>
            <Ionicons name="arrow-forward" size={14} color="#C8102E" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#C8102E" />
            <Text style={styles.stateText}>Loading requests...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={22} color="#C8102E" />
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable style={styles.retryButton} onPress={retryDashboard}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : summary.recentRequests.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="document-text-outline" size={22} color="#C8102E" />
            <Text style={styles.stateText}>No active requests yet.</Text>
          </View>
        ) : (
          <View style={styles.requestList}>
            {summary.recentRequests.slice(0, 3).map(request => (
              <RequestCard
                key={request.id}
                request={request}
                onPress={onOpenRequestVerification}
              />
            ))}
          </View>
        )}

        <VerifiedWeekChart requests={summary.recentRequests} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 80,
  },
  header: {
    height: 29,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 28,
    alignItems: 'flex-start',
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  brandBlood: {
    color: '#282426',
    fontSize: 12,
    fontWeight: '700',
  },
  brandConnect: {
    color: '#C8102E',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3C9CF',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 12 },
  avatarInitials: {
    color: '#C8102E',
    fontSize: 8,
    fontWeight: '700',
  },
  pageHeading: {
    marginBottom: 7,
    paddingHorizontal: 1,
  },
  pageTitle: {
    color: '#282426',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
  },
  pageSubtitle: {
    marginTop: 1,
    color: '#858184',
    fontSize: 8,
    lineHeight: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 10,
  },
  statCard: {
    width: '48.2%',
    minHeight: 86,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#C8102E',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  urgentCardGlow: {
    shadowOpacity: 0.22,
    shadowRadius: 17,
    elevation: 6,
  },
  statTopLine: {
    height: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8102E',
  },
  statCount: {
    marginTop: 2,
    color: '#231F20',
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '600',
  },
  noMatches: {
    marginTop: 5,
    color: '#3980DF',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },
  statSpinner: {
    alignSelf: 'flex-start',
    height: 25,
    marginTop: 2,
  },
  statLabel: {
    marginTop: 1,
    color: '#858184',
    fontSize: 9,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 7,
    marginBottom: 11,
  },
  quickAction: {
    flex: 1,
    minHeight: 53,
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  primaryAction: {
    backgroundColor: '#C8102E',
    shadowColor: '#C8102E',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3DDE0',
  },
  pressedAction: { transform: [{ scale: 0.97 }] },
  quickActionLabel: {
    color: '#C8102E',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryActionLabel: { color: '#FFFFFF' },
  chartCard: {
    paddingHorizontal: 11,
    paddingTop: 8,
    paddingBottom: 6,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5E4E6',
    shadowColor: '#C8102E',
    shadowOpacity: 0.055,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  chartHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTotal: {
    color: '#858184',
    fontSize: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#282426',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
  },
  chart: {
    height: 77,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  chartColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartCount: {
    height: 10,
    color: '#858184',
    fontSize: 8,
  },
  chartTrack: {
    width: 14,
    height: 52,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: '#FFF4F5',
  },
  chartBar: {
    width: '100%',
    minHeight: 5,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  chartDay: {
    marginTop: 3,
    color: '#858184',
    fontSize: 9,
  },
  chartToday: {
    color: '#C8102E',
    fontWeight: '700',
  },
  recentHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
    paddingHorizontal: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingLeft: 8,
  },
  viewAllText: {
    color: '#C8102E',
    fontSize: 9,
    fontWeight: '600',
  },
  requestList: { gap: 7 },
  requestCard: {
    minHeight: 53,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F4E7E9',
    shadowColor: '#6B1A27',
    shadowOpacity: 0.045,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressedCard: { transform: [{ scale: 0.985 }] },
  bloodBadge: {
    width: 33,
    height: 33,
    marginRight: 8,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE8EB',
  },
  bloodBadgeText: {
    color: '#C8102E',
    fontSize: 11,
    fontWeight: '700',
  },
  requestInfo: { flex: 1, minWidth: 0 },
  patientName: {
    color: '#292527',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },
  requestId: {
    marginTop: 3,
    color: '#929093',
    fontSize: 7,
  },
  requestTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 7,
  },
  urgencyChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  normalChip: { backgroundColor: '#E8F7EF' },
  urgentChip: { backgroundColor: '#FCE8EB' },
  criticalChip: { backgroundColor: '#8B0A1F' },
  urgencyText: { fontSize: 9, fontWeight: '600' },
  normalText: { color: '#20824F' },
  urgentText: { color: '#C8102E' },
  criticalText: { color: '#FFFFFF' },
  stateCard: {
    minHeight: 105,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  stateText: {
    color: '#777174',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#C8102E',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

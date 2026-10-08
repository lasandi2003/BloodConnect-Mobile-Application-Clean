import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import RoleAppShell from '../../../components/RoleAppShell';
import {
  openHealthcareDonorMatching,
  openHealthcareDonorProfile,
} from '../navigation/healthcareTabNavigation';
import type { DonorProfile, DonorResponse, EmergencyRequest } from '../../donor/types/donor';
import { getDonorProfile, getDonorResponseForRequest } from '../../donor/services/donorService';
import type { VerificationMatchingStackParamList } from '../navigation/types';
import { getConfirmedDonorMatch, getVerificationRequestById } from '../services/verificationService';

type Props = NativeStackScreenProps<VerificationMatchingStackParamList, 'NotificationStatus'>;
type ResponseStatus = 'accepted' | 'declined' | 'completed' | 'withdrawn' | 'pending' | 'unknown';
type TimelineState = 'complete' | 'current' | 'pending' | 'declined';

function clean(value: string | undefined): string {
  const text = value?.trim();
  return text && !['null', 'undefined', 'not specified', 'hospital', 'location unavailable'].includes(text.toLowerCase())
    ? text
    : '';
}

function logReadFailure(operation: string, error: unknown): void {
  const details = error && typeof error === 'object'
    ? error as { code?: unknown; message?: unknown }
    : null;
  console.warn(`[NotificationStatus] ${operation} failed`, {
    code: typeof details?.code === 'string' ? details.code : 'unknown',
    message: typeof details?.message === 'string' ? details.message : String(error),
    error,
  });
}

function displayResponseStatus(response: DonorResponse | null): ResponseStatus {
  const raw = String(response?.status ?? response?.response ?? '').trim().toLowerCase();
  if (['accepted', 'declined', 'completed', 'withdrawn', 'pending'].includes(raw)) {
    return raw as ResponseStatus;
  }
  return 'unknown';
}

function formatTimestamp(value: unknown): string {
  if (!value) return '—';
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date; toMillis?: () => number };
    if (typeof timestamp.toDate === 'function') date = timestamp.toDate();
    else if (typeof timestamp.toMillis === 'function') date = new Date(timestamp.toMillis());
  }

  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : '—';
}

function statusLabel(status: ResponseStatus, statusLoadError: boolean): string {
  if (statusLoadError) return 'Response unavailable';
  switch (status) {
    case 'accepted': return 'Donor accepted';
    case 'declined': return 'Donor declined';
    case 'completed': return 'Donation completed';
    case 'withdrawn': return 'Response withdrawn';
    case 'pending': return 'Pending';
    default: return 'Match confirmed';
  }
}

function stageCount(status: ResponseStatus, statusLoadError: boolean): string {
  if (statusLoadError) return 'Donor response could not be checked';
  if (status === 'unknown') return 'Waiting for donor';
  if (status === 'pending') return 'Waiting for donor';
  if (status === 'completed') return 'Step 4 of 4';
  if (status === 'accepted') return 'Step 3 of 4';
  return 'Donor response received';
}

function TimelineStep({
  title,
  description,
  state,
  time,
  showConnector,
}: {
  title: string;
  description: string;
  state: TimelineState;
  time: string;
  showConnector: boolean;
}) {
  const iconName = state === 'complete' ? 'checkmark' : state === 'declined' ? 'close' : undefined;
  const nodeStateStyle = state === 'complete'
    ? styles.timelineNode_complete
    : state === 'current'
      ? styles.timelineNode_current
      : state === 'declined'
        ? styles.timelineNode_declined
        : styles.timelineNode_pending;
  const titleStateStyle = state === 'complete'
    ? styles.timelineTitle_complete
    : state === 'current'
      ? styles.timelineTitle_current
      : state === 'declined'
        ? styles.timelineTitle_declined
        : styles.timelineTitle_pending;
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineNode, nodeStateStyle]}>
          {iconName ? <Ionicons name={iconName} size={12} color={COLORS.white} /> : null}
          {state === 'current' ? <View style={styles.currentNodeDot} /> : null}
        </View>
        {showConnector ? <View style={[styles.timelineConnector, state === 'complete' && styles.timelineConnectorComplete]} /> : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={[styles.timelineTitle, titleStateStyle]} numberOfLines={1}>{title}</Text>
        <Text style={styles.timelineDescription}>{description}</Text>
      </View>
      <Text style={styles.timelineTime}>{time}</Text>
    </View>
  );
}

function NotificationStatusContent({ route, navigation }: Props) {
  const { requestId, donorId } = route.params;
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [matchConfirmed, setMatchConfirmed] = useState(false);
  const [response, setResponse] = useState<DonorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [responseLoadError, setResponseLoadError] = useState(false);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissing(null);
    setMatchConfirmed(false);
    setResponseLoadError(false);
    try {
      const [loadedRequest, loadedDonor, loadedMatch] = await Promise.all([
        getVerificationRequestById(requestId),
        getDonorProfile(donorId),
        getConfirmedDonorMatch(requestId, donorId),
      ]);

      if (!loadedRequest) {
        setRequest(null);
        setDonor(null);
        setResponse(null);
        setMissing('The blood request could not be found.');
        return;
      }
      if (!loadedMatch || loadedMatch.status !== 'matched') {
        setRequest(null);
        setDonor(null);
        setResponse(null);
        setMissing('The confirmed donor match could not be found.');
        return;
      }
      if (
        !clean(loadedDonor.fullName) && !clean(loadedDonor.phone) && !clean(loadedDonor.email) &&
        !clean(loadedDonor.bloodGroup) && !clean(loadedDonor.city) && !clean(loadedDonor.district) &&
        !clean(loadedDonor.address) && loadedDonor.age === undefined
      ) {
        setRequest(loadedRequest);
        setDonor(null);
        setResponse(null);
        setMissing('The matched donor profile could not be found.');
        return;
      }

      setRequest(loadedRequest);
      setDonor(loadedDonor);
      setMatchConfirmed(true);
      try {
        setResponse(await getDonorResponseForRequest(donorId, requestId));
      } catch (responseError) {
        logReadFailure('donorResponses lookup', responseError);
        setResponse(null);
        setResponseLoadError(true);
      }
    } catch (loadError) {
      logReadFailure('request, donor, or match lookup', loadError);
      setRequest(null);
      setDonor(null);
      setResponse(null);
      setError('Unable to load request and donor details. Check your connection and access.');
    } finally {
      setLoading(false);
    }
  }, [donorId, requestId]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  const responseStatus = displayResponseStatus(response);
  const statusText = statusLabel(responseStatus, responseLoadError);
  const currentDescription = responseLoadError
    ? 'Donor response could not be checked.'
    : responseStatus === 'accepted'
      ? 'The donor accepted this request.'
      : responseStatus === 'declined'
        ? 'The donor declined this request.'
        : responseStatus === 'completed'
          ? 'The donation is marked complete.'
          : responseStatus === 'withdrawn'
            ? 'The donor withdrew their response.'
            : 'Waiting for donor response.';

  const latestResponseTime = formatTimestamp(response?.updatedAt ?? response?.createdAt);
  const location = useMemo(() => {
    const parts = [clean(request?.hospitalName), clean(request?.location)].filter(Boolean);
    return parts.join(' · ') || 'Hospital details unavailable';
  }, [request]);

  const responseReceived = ['accepted', 'declined', 'completed', 'withdrawn'].includes(responseStatus);
  const accepted = responseStatus === 'accepted' || responseStatus === 'completed';
  const completedDonation = responseStatus === 'completed';

  let content: React.ReactNode;
  if (loading) {
    content = (
      <View style={styles.stateArea}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.stateText}>Loading notification status...</Text>
      </View>
    );
  } else if (error || missing || !request || !donor || !matchConfirmed) {
    content = (
      <View style={styles.stateArea}>
        <Ionicons name="cloud-offline-outline" size={30} color={COLORS.primary} />
        <Text style={styles.stateTitle}>{error ? 'Unable to load status' : 'Details unavailable'}</Text>
        <Text style={styles.stateText}>{error || missing || 'Request or donor details are unavailable.'}</Text>
        {error ? (
          <Pressable accessibilityRole="button" onPress={() => void loadDetails()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  } else {
    content = (
      <>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadDetails()} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        >
          <View style={styles.requestCard}>
            <View style={styles.bloodBadge}><Text style={styles.bloodBadgeText}>{request.bloodGroup || '—'}</Text></View>
            <View style={styles.requestCopy}>
              <Text style={styles.donorName} numberOfLines={1}>{clean(donor.fullName) || 'Donor'}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="business-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.hospitalText} numberOfLines={2}>{location}</Text>
              </View>
            </View>
            <View style={styles.unitsDivider} />
            <View style={styles.unitsBlock}>
              <Text style={styles.unitsNumber}>{Number.isFinite(request.unitsRequired) ? request.unitsRequired : '—'}</Text>
              <Text style={styles.unitsLabel}>units</Text>
            </View>
          </View>

          <View style={styles.currentStatusCard}>
            <View style={styles.currentStatusHeader}>
              <View style={styles.currentStatusTitleWrap}>
                <View style={styles.statusIcon}><Ionicons name="heart-outline" size={19} color={COLORS.white} /></View>
                <View style={styles.currentStatusCopy}>
                  <Text style={styles.currentStatusEyebrow}>Current status</Text>
                  <Text style={styles.currentStatusValue} numberOfLines={1}>{statusText}</Text>
                </View>
              </View>
              <View style={styles.arrivalBlock}>
                <Text style={styles.arrivalLabel}>Arrival</Text>
                <Text style={styles.arrivalTime}>—</Text>
              </View>
            </View>
            <View style={styles.statusTrack}>
              {[0, 1, 2, 3].map((step, index) => (
                <View
                  key={step}
                  style={[
                    styles.statusTrackSegment,
                    ((index === 2 && accepted) || (index === 3 && completedDonation)) &&
                      styles.statusTrackSegmentDone,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.stepCount}>{stageCount(responseStatus, responseLoadError)}</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Live progress</Text>
              <View style={styles.latestBadge}><View style={styles.latestDot} /><Text style={styles.latestText}>Live</Text></View>
            </View>
            <TimelineStep
              title="Notification sent"
              description="Notification delivery tracking is unavailable."
              state="pending"
              time="—"
              showConnector
            />
            <TimelineStep
              title="Notification viewed"
              description="Message view tracking is unavailable."
              state="pending"
              time="—"
              showConnector
            />
            <TimelineStep
              title={responseStatus === 'accepted' || responseStatus === 'completed' ? 'Donor accepted' : responseStatus === 'declined' ? 'Donor declined' : responseStatus === 'withdrawn' ? 'Response withdrawn' : responseStatus === 'pending' ? 'Waiting for donor' : 'Donor response'}
              description={currentDescription}
              state={responseStatus === 'accepted' ? 'current' : responseStatus === 'completed' ? 'complete' : responseStatus === 'declined' || responseStatus === 'withdrawn' ? 'declined' : responseStatus === 'pending' ? 'current' : 'pending'}
              time={responseReceived ? latestResponseTime : '—'}
              showConnector
            />
            <TimelineStep
              title={completedDonation ? 'Donation completed' : 'Donation scheduled'}
              description={completedDonation ? 'The donor response is marked completed.' : 'Scheduling details are unavailable.'}
              state={completedDonation ? 'complete' : 'pending'}
              time={completedDonation ? latestResponseTime : '—'}
              showConnector={false}
            />
            {responseLoadError ? <Text style={styles.responseNotice}>Donor response status could not be loaded. Other match details are still available.</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.contactBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('DonorCommunication', { requestId, donorId })}
            style={styles.contactButton}
          >
            <Ionicons name="call-outline" size={20} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Contact donor</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to match confirmation" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={19} color={COLORS.primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Notification status</Text>
            <Text style={styles.headerSubtitle}>Track the matched donor's response</Text>
          </View>
        </View>
        {content}
      </View>
    </SafeAreaView>
  );
}

export default function NotificationStatusScreen(props: Props) {
  const { navigation } = props;

  return (
    <RoleAppShell
      home={<View />}
      activity={{ title: 'Pending Requests', description: 'Review requests awaiting verification.' }}
      servicesContent={<NotificationStatusContent {...props} />}
      services={{ title: 'Donor Matching', description: 'View matched donor status.' }}
      profile={{ title: 'Healthcare Profile', description: 'Healthcare account details.' }}
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
        activity: () => navigation.navigate('PendingBloodRequests'),
        services: () => void openHealthcareDonorMatching(navigation, props.route.params.requestId),
        profile: () => void openHealthcareDonorProfile(navigation, props.route.params),
      }}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF5F5' },
  page: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 16 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F1E2E4' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: COLORS.text, fontSize: 19, fontWeight: '800' },
  headerSubtitle: { marginTop: 2, color: COLORS.textSecondary, fontSize: 11, lineHeight: 15 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 7, paddingBottom: 16, gap: 14 },
  requestCard: { minHeight: 88, padding: 13, borderRadius: 19, borderWidth: 1, borderColor: '#F1E2E4', backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 11, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 7, elevation: 2 },
  bloodBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  bloodBadgeText: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
  requestCopy: { flex: 1, minWidth: 0 },
  donorName: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  locationRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  hospitalText: { flex: 1, color: COLORS.textSecondary, fontSize: 10, lineHeight: 14 },
  unitsDivider: { width: StyleSheet.hairlineWidth, height: 48, backgroundColor: '#EADADD' },
  unitsBlock: { width: 42, alignItems: 'center' },
  unitsNumber: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  unitsLabel: { marginTop: 1, color: COLORS.textSecondary, fontSize: 9 },
  currentStatusCard: { padding: 16, borderRadius: 20, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 9, elevation: 4 },
  currentStatusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  currentStatusTitleWrap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' },
  currentStatusCopy: { flex: 1, minWidth: 0 },
  currentStatusEyebrow: { color: '#FFE1E5', fontSize: 10, fontWeight: '600' },
  currentStatusValue: { marginTop: 3, color: COLORS.white, fontSize: 14, fontWeight: '800' },
  arrivalBlock: { minWidth: 57, alignItems: 'flex-end' },
  arrivalLabel: { color: '#FFE1E5', fontSize: 10 },
  arrivalTime: { marginTop: 3, color: COLORS.white, fontSize: 13, fontWeight: '700' },
  statusTrack: { marginTop: 16, flexDirection: 'row', gap: 5 },
  statusTrackSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  statusTrackSegmentDone: { backgroundColor: COLORS.white },
  stepCount: { marginTop: 8, color: '#FFE1E5', fontSize: 10, fontWeight: '600' },
  progressCard: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 8, borderRadius: 19, borderWidth: 1, borderColor: '#F1E2E4', backgroundColor: COLORS.white, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
  progressHeader: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  latestBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 11, backgroundColor: '#FCEAEC' },
  latestDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  latestText: { color: COLORS.primary, fontSize: 9, fontWeight: '700' },
  timelineItem: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineRail: { width: 20, alignItems: 'center', alignSelf: 'stretch' },
  timelineNode: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineNode_complete: { borderColor: '#15945B', backgroundColor: '#15945B' },
  timelineNode_current: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  timelineNode_pending: { borderColor: '#D9DDE1', backgroundColor: COLORS.white },
  timelineNode_declined: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  currentNodeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  timelineConnector: { position: 'absolute', top: 18, bottom: 0, width: 2, backgroundColor: '#E6E8EB' },
  timelineConnectorComplete: { backgroundColor: '#68B78D' },
  timelineCopy: { flex: 1, minWidth: 0, paddingBottom: 8 },
  timelineTitle: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  timelineTitle_complete: { color: COLORS.text },
  timelineTitle_current: { color: COLORS.primary },
  timelineTitle_pending: { color: '#8C9299' },
  timelineTitle_declined: { color: COLORS.primary },
  timelineDescription: { marginTop: 3, color: COLORS.textSecondary, fontSize: 10, lineHeight: 14 },
  timelineTime: { paddingTop: 2, color: COLORS.textMuted, fontSize: 9, fontWeight: '600' },
  responseNotice: { marginTop: 2, marginBottom: 5, color: COLORS.textSecondary, fontSize: 10, lineHeight: 14 },
  contactBar: { paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#F1E2E4', backgroundColor: '#FFF5F5' },
  contactButton: { minHeight: 54, borderRadius: 15, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 3 },
  contactButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  stateArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  stateTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stateText: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  retryButton: { marginTop: 3, paddingHorizontal: 17, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
});

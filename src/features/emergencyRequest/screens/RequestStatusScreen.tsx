import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';
import type { RequesterStackParamList } from '../navigation/types';
import type { RequestStatusDetails } from '../types/emergencyRequest';
import { getRequestStatusErrorMessage, watchEmergencyRequest } from '../services/emergencyRequestService';
import { formatDisplayDate } from '../utils/hospitalValidation';
import { getRequestStatusView } from '../utils/requestStatus';

type Props = NativeStackScreenProps<RequesterStackParamList, 'RequestStatus'>;
const steps = ['Request submitted', 'Healthcare verification', 'Donor matching', 'Request fulfilled'];

export default function RequestStatusScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [request, setRequest] = useState<RequestStatusDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [pendingWrites, setPendingWrites] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestId = route.params.requestId;

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setRequest(null);
    setError('');
    setFromCache(false);
    setPendingWrites(false);
    if (!user) {
      setError('Please sign in to view your request.');
      setLoading(false);
      return;
    }
    const unsubscribe = watchEmergencyRequest(requestId, user.uid, (data, cached, pending) => {
      if (!active) return;
      setRequest(data); setFromCache(cached); setPendingWrites(pending); setLoading(false); setError('');
    }, failure => {
      if (!active) return;
      setRequest(null); setError(getRequestStatusErrorMessage(failure)); setLoading(false);
    });
    return () => { active = false; unsubscribe(); };
  }, [requestId, user?.uid, retry]));

  const status = request ? getRequestStatusView(request.status, request.verified) : null;
  const returnToDashboard = () => navigation.reset({ index: 0, routes: [{ name: 'RequesterDashboard' }] });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Request Status</Text><View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Your Emergency Request</Text>
        <Text selectable style={styles.requestId}>{requestId}</Text>
        {loading ? <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /><Text style={styles.secondaryText}>Loading request status...</Text></View> : null}
        {!loading && (error || !request) ? (
          <View style={styles.card} accessibilityRole="alert">
            <Text style={styles.errorText}>{error || (fromCache ? 'Your request cannot be confirmed from cached data. Check your connection and retry.' : 'This request could not be found.')}</Text>
            <Pressable style={styles.retryButton} onPress={() => setRetry(previous => previous + 1)} accessibilityRole="button"><Text style={styles.retryText}>Retry</Text></Pressable>
          </View>
        ) : null}
        {request && status ? (
          <>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>{status.label}</Text>
              <Text style={styles.description}>{status.description}</Text>
              <Text style={styles.syncText}>{pendingWrites ? 'Syncing changes - status is not yet confirmed.' : fromCache ? 'Showing cached data - status may be out of date.' : 'Latest saved status - updates automatically.'}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Request Details</Text>
              <Detail label="Blood group" value={request.bloodGroup} />
              <Detail label="Units required" value={String(request.unitsRequired)} />
              <Detail label="Hospital" value={request.hospitalName} />
              <Detail label="Location" value={request.location || 'Not provided'} />
              <Detail label="Required date" value={formatDisplayDate(request.requiredDate)} />
              <Detail label="Urgency" value={request.urgencyLevel} />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Request Progress</Text>
              {steps.map((step, index) => {
                const complete = index === 0 || (status.stage !== null && index < status.stage);
                const current = status.stage === index && !status.terminal;
                return (
                  <View key={step} style={styles.timelineRow}>
                    <View style={[styles.dot, complete && styles.completeDot, current && styles.currentDot]}>
                      {complete ? <Ionicons name="checkmark" size={16} color={COLORS.white} /> : <Text style={styles.stepNumber}>{index + 1}</Text>}
                    </View>
                    <View style={styles.timelineText}>
                      <Text style={styles.timelineTitle}>{step}</Text>
                      <Text style={styles.secondaryText}>{complete ? 'Confirmed' : current ? 'Pending / in progress' : status.terminal ? 'Not confirmed before closure' : 'Not yet confirmed'}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.futureActions}>
              <View style={styles.disabledButton}><Text style={styles.secondaryText}>Update Request</Text><Text style={styles.secondaryText}>Coming soon</Text></View>
              <View style={styles.disabledButton}><Text style={styles.secondaryText}>Cancel Request</Text><Text style={styles.secondaryText}>Coming soon</Text></View>
            </View>
          </>
        ) : null}
        <Pressable style={styles.dashboardButton} onPress={returnToDashboard} accessibilityRole="button"><Text style={styles.dashboardText}>Back to Dashboard</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.softBackground },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.text },
  spacer: { width: 44 },
  container: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28 },
  pageTitle: { fontSize: 23, fontWeight: '800', color: COLORS.text },
  requestId: { fontSize: 13, color: COLORS.primary, marginTop: 8, marginBottom: 20 },
  loading: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  card: { backgroundColor: COLORS.white, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  statusCard: { backgroundColor: COLORS.white, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryLight, marginBottom: 16 },
  statusLabel: { fontSize: 19, fontWeight: '800', color: COLORS.primary },
  description: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary, marginTop: 8 },
  syncText: { fontSize: 11, lineHeight: 18, color: COLORS.textSecondary, marginTop: 12 },
  detailRow: { flexDirection: 'row', gap: 12, paddingVertical: 7 },
  detailLabel: { flex: 1, fontSize: 12, lineHeight: 19, color: COLORS.textSecondary },
  detailValue: { flex: 1.3, fontSize: 13, lineHeight: 19, textAlign: 'right', color: COLORS.text, fontWeight: '600' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  completeDot: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  currentDot: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  stepNumber: { fontSize: 12, color: COLORS.textSecondary },
  timelineText: { flex: 1 },
  timelineTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  secondaryText: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  errorText: { fontSize: 13, lineHeight: 20, color: COLORS.danger },
  retryButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  retryText: { color: COLORS.primary, fontWeight: '700' },
  futureActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  disabledButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.border, alignItems: 'center' },
  dashboardButton: { minHeight: 52, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  dashboardText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});

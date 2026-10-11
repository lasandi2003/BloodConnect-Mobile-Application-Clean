import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';
import type { RequesterStackParamList } from '../navigation/types';
import type { RequestStatusDetails } from '../types/emergencyRequest';
import { cancelEmergencyRequest, getRequestCancelErrorMessage, getRequestForUpdate, getRequestStatusErrorMessage } from '../services/emergencyRequestService';
import { canCancelRequest, getRequestStatusView } from '../utils/requestStatus';

type Props = NativeStackScreenProps<RequesterStackParamList, 'CancelRequest'>;

export default function CancelRequestScreen({ navigation, route }: Props) {
  const requestId = route.params.requestId;
  const { user, profile } = useAuth();
  const [request, setRequest] = useState<RequestStatusDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [retry, setRetry] = useState(0);
  const cancellationLock = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setRequest(null); setError('');
    if (!user || profile?.role !== 'requester' || profile.status !== 'active') {
      setError('Please sign in with an active requester account.'); setLoading(false);
      return;
    }
    getRequestForUpdate(requestId, user.uid).then(data => {
      if (active) { setRequest(data); setLoading(false); }
    }).catch(failure => { if (active) { setError(getRequestStatusErrorMessage(failure)); setLoading(false); } });
    return () => { active = false; };
  }, [requestId, user?.uid, profile?.role, profile?.status, retry]);

  usePreventRemove(cancelling && !cancelled, () => {
    setError('Cancellation is in progress. Please wait for confirmation.');
  });

  useEffect(() => {
    if (cancelled) navigation.popTo('RequestStatus', { requestId, cancelSaved: true });
  }, [cancelled, navigation, requestId]);

  async function handleCancelRequest() {
    if (!user || !request || !canCancelRequest(request.status) || cancellationLock.current) return;
    cancellationLock.current = true; setCancelling(true); setError('');
    try {
      await cancelEmergencyRequest(requestId, user.uid, request.status);
      setCancelled(true);
    } catch (failure) { setError(getRequestCancelErrorMessage(failure)); }
    finally { cancellationLock.current = false; setCancelling(false); }
  }

  const eligible = Boolean(request && canCancelRequest(request.status));
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.icon}><Ionicons name="alert-circle-outline" size={30} color={COLORS.primary} /></View>
          <Text style={styles.title}>Cancel this request?</Text>
          <Text style={styles.description}>Cancelling stops this request appearing in active donor requests. Its record will be kept. You cannot undo cancellation here.</Text>
          <Text selectable style={styles.requestId}>{requestId}</Text>
          {loading ? <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /><Text style={styles.description}>Checking saved request...</Text></View> : null}
          {request ? <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{request.bloodGroup} - {request.unitsRequired} units</Text>
            <Text style={styles.summaryText}>{request.hospitalName}</Text>
            <Text style={styles.summaryText}>{getRequestStatusView(request.status, request.verified).label}</Text>
          </View> : null}
          {request && !eligible ? <Text style={styles.errorText}>This request is no longer active and cannot be cancelled.</Text> : null}
          {error ? <Text style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text> : null}
          {error && !cancelling ? <Pressable style={styles.reloadButton} onPress={() => setRetry(previous => previous + 1)} accessibilityRole="button"><Text style={styles.keepText}>Reload Saved Details</Text></Pressable> : null}
          <Pressable style={styles.keepButton} onPress={() => navigation.goBack()} disabled={cancelling} accessibilityRole="button" accessibilityState={{ disabled: cancelling }}>
            <Text style={styles.keepText}>{eligible ? 'Keep Request Active' : 'Back to Status'}</Text>
          </Pressable>
          {eligible ? <Pressable style={[styles.cancelButton, cancelling && styles.disabled]} onPress={handleCancelRequest} disabled={loading || cancelling}
            accessibilityRole="button" accessibilityState={{ disabled: loading || cancelling, busy: cancelling }}>
            {cancelling ? <ActivityIndicator size="small" color={COLORS.white} /> : null}
            <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Yes, Cancel Request'}</Text>
          </Pressable> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 360, padding: 22, borderRadius: 20, backgroundColor: COLORS.white },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.softBackground,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 21, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  description: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
  requestId: { fontSize: 12, color: COLORS.primary, textAlign: 'center', marginTop: 12, marginBottom: 14 },
  loading: { alignItems: 'center', paddingVertical: 16 },
  summary: { padding: 14, borderRadius: 12, backgroundColor: COLORS.inputBackground, marginBottom: 14 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  summaryText: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary, marginTop: 6 },
  errorText: { fontSize: 12, lineHeight: 19, color: COLORS.danger, marginBottom: 14 },
  reloadButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  keepButton: { minHeight: 52, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  keepText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  cancelButton: { minHeight: 52, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 },
  cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  disabled: { opacity: 0.6 },
});

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';
import type { RequesterStackParamList } from '../navigation/types';
import { getRequestHistoryErrorMessage, watchRequesterHistory, type RequestHistoryItem } from '../services/emergencyRequestService';
import { formatDisplayDate } from '../utils/hospitalValidation';
import { getRequestStatusView } from '../utils/requestStatus';

interface ContentProps { onOpenRequest: (id: string) => void; onBack?: () => void }

export function RequestHistoryContent({ onOpenRequest, onBack }: ContentProps) {
  const { user } = useAuth();
  const [result, setResult] = useState<{ uid: string; requests: RequestHistoryItem[]; cached: boolean; skipped: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const uid = user?.uid;
  useFocusEffect(useCallback(() => {
    let active = true;
    setResult(null);
    setError('');
    setLoading(true);
    if (!uid) {
      setError('Please sign in to view your request history.');
      setLoading(false);
      return () => { active = false; };
    }
    const unsubscribe = watchRequesterHistory(uid, (requests, cached, skipped) => {
      if (!active) return;
      setResult({ uid, requests, cached, skipped });
      setLoading(false);
      setError('');
    }, failure => {
      if (!active) return;
      setResult(null);
      setError(getRequestHistoryErrorMessage(failure));
      setLoading(false);
    });
    return () => { active = false; unsubscribe(); };
  }, [uid, retry]));
  // Never render the previous account's results during a session transition.
  const current = result?.uid === uid ? result : null;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        {onBack && <Pressable onPress={onBack} accessibilityLabel="Back" accessibilityRole="button"><Ionicons name="chevron-back" size={25} color={COLORS.text} /></Pressable>}
        <Text style={styles.title}>Request History</Text>
        <Pressable onPress={() => setRetry(value => value + 1)} accessibilityLabel="Refresh request history" accessibilityRole="button"><Ionicons name="refresh" size={23} color={COLORS.primary} /></Pressable>
      </View>
      <Text style={styles.subtitle}>Your active and previous emergency blood requests</Text>
      {loading && <ActivityIndicator style={styles.notice} color={COLORS.primary} accessibilityLabel="Loading request history" />}
      {!!error && <View style={styles.notice}><Text style={styles.error}>{error}</Text><Pressable onPress={() => setRetry(value => value + 1)} accessibilityRole="button"><Text style={styles.link}>Try again</Text></Pressable></View>}
      {current?.cached && <Text style={styles.notice}>Showing cached history. Waiting for a connection to confirm the latest requests.</Text>}
      {!!current?.skipped && <Text style={styles.errorNotice}>{current.skipped} saved request(s) have incomplete details and cannot be displayed. Please contact the project administrator.</Text>}
      <FlatList
        data={current?.requests ?? []}
        keyExtractor={item => item.requestId}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => setRetry(value => value + 1)}
        ListEmptyComponent={!loading && !error && current && !current.cached && !current.skipped ? <View style={styles.empty}><Ionicons name="document-text-outline" size={44} color={COLORS.primary} /><Text style={styles.title}>No requests yet</Text><Text style={styles.subtitle}>Submitted emergency requests will appear here.</Text></View> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onOpenRequest(item.requestId)} accessibilityRole="button" accessibilityLabel={`View ${item.bloodGroup} request at ${item.hospitalName}`}>
            <View style={styles.row}><Text style={styles.blood}>{item.bloodGroup} · {item.unitsRequired === null ? 'Units not recorded' : `${item.unitsRequired} unit(s)`}</Text><Ionicons name="chevron-forward" size={21} color={COLORS.primary} /></View>
            <Text style={styles.hospital}>{item.hospitalName}</Text>
            <Text style={styles.details}>Required: {item.requiredDate ? formatDisplayDate(item.requiredDate) : 'Not recorded'}</Text>
            <Text style={styles.details}>Urgency: {item.urgencyLevel ?? 'Not recorded'}</Text>
            <Text style={styles.status}>{getRequestStatusView(item.status, item.verified).label}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

export default function RequestHistoryScreen({ navigation }: NativeStackScreenProps<RequesterStackParamList, 'RequestHistory'>) {
  return <RequestHistoryContent onBack={() => navigation.goBack()} onOpenRequest={requestId => navigation.navigate('RequestStatus', { requestId })} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.softBackground },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 },
  title: { flex: 1, fontSize: 21, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.textSecondary, paddingHorizontal: 20, marginBottom: 16, lineHeight: 21 },
  list: { padding: 20, paddingTop: 4, gap: 14, flexGrow: 1 },
  card: { padding: 20, borderRadius: 18, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blood: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  hospital: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  details: { color: COLORS.textSecondary, lineHeight: 20 },
  status: { color: COLORS.primary, fontWeight: '600', marginTop: 5 },
  notice: { padding: 20, color: COLORS.textSecondary, gap: 12 },
  error: { color: COLORS.danger, lineHeight: 21 },
  errorNotice: { color: COLORS.danger, paddingHorizontal: 20, marginBottom: 16 },
  link: { color: COLORS.primary, fontWeight: '700', paddingVertical: 10 },
  empty: { alignItems: 'center', gap: 16, paddingVertical: 40 },
});

import React, { useCallback } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../../constants/colors';
import type { RequesterStackParamList } from '../navigation/types';
import { formatDisplayDate } from '../utils/hospitalValidation';

type Props = NativeStackScreenProps<RequesterStackParamList, 'RequestSubmitted'>;

export default function RequestSubmittedScreen({ navigation, route }: Props) {
  const { receipt } = route.params;

  const returnToDashboard = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'RequesterDashboard' }] });
  }, [navigation]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      returnToDashboard();
      return true;
    });
    return () => subscription.remove();
  }, [returnToDashboard]));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Emergency Blood Request</Text>
        <View style={styles.successIcon}><Ionicons name="checkmark" size={42} color={COLORS.white} /></View>
        <Text style={styles.title}>Request Submitted</Text>
        <Text style={styles.description}>{receipt.status === 'pending_verification'
          ? 'Your request has been saved successfully and is awaiting healthcare verification.'
          : 'Your request has been saved successfully.'}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Request</Text>
          <Text style={styles.idLabel}>Request ID</Text>
          <Text selectable style={styles.requestId}>{receipt.requestId}</Text>
          <SummaryRow label="Blood group" value={receipt.bloodGroup} />
          <SummaryRow label="Units required" value={String(receipt.unitsRequired)} />
          <SummaryRow label="Hospital" value={receipt.hospitalName} />
          <SummaryRow label="Required date" value={formatDisplayDate(receipt.requiredDate)} />
          <SummaryRow label="Urgency" value={receipt.urgencyLevel} />
          <View style={styles.statusBadge}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.statusText}>{receipt.status === 'pending_verification' ? 'Pending Verification' : receipt.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={21} color={COLORS.primary} />
          <Text style={styles.noticeText}>Keep your request ID for reference. Track Request shows the latest saved status.</Text>
        </View>
        <Pressable style={styles.trackButton} onPress={() => navigation.navigate('RequestStatus', { requestId: receipt.requestId })} accessibilityRole="button">
          <Text style={styles.trackText}>Track Request</Text>
        </Pressable>
        <Pressable style={styles.dashboardButton} onPress={returnToDashboard} accessibilityRole="button">
          <Text style={styles.dashboardText}>Back to Dashboard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 30 },
  header: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 28 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.success, textAlign: 'center' },
  description: { fontSize: 13, lineHeight: 21, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, marginBottom: 24 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  idLabel: { fontSize: 12, color: COLORS.textSecondary },
  requestId: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginTop: 6, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 7 },
  rowLabel: { flex: 1, fontSize: 12, lineHeight: 19, color: COLORS.textSecondary },
  rowValue: { flex: 1.3, fontSize: 13, lineHeight: 19, textAlign: 'right', color: COLORS.text, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10,
    backgroundColor: COLORS.softBackground, marginTop: 12 },
  statusText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.primary },
  notice: { flexDirection: 'row', gap: 10, marginVertical: 20 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 19, color: COLORS.textSecondary },
  trackButton: { minHeight: 52, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  trackText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  dashboardButton: { minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
    marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  dashboardText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});

import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../constants/colors';
import { auth } from '../../../config/firebase';
import { useAuth } from '../../auth/context/AuthContext';
import { getApprovalErrorMessage, loadPendingApplications, reviewStaffApplication, type StaffApplication } from '../../auth/services/staffApprovalService';

type Review = { application: StaffApplication; decision: 'approved' | 'rejected' };

export default function PendingApprovalsScreen() {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const authorized = !!uid && profile?.uid === uid && profile.role === 'admin';
  const [result, setResult] = useState<{ uid: string; applications: StaffApplication[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [retry, setRetry] = useState(0);
  const [review, setReview] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);
  const active = useRef(false);
  const locked = useRef(false);
  useFocusEffect(useCallback(() => {
    let current = true;
    active.current = true;
    setLoading(true); setError(''); setResult(null);
    if (!uid || !authorized) {
      setLoading(false); setError('Only an administrator can review staff applications.');
      return () => { active.current = false; };
    }
    loadPendingApplications(uid).then(applications => { if (current) setResult({ uid, applications }); })
      .catch(failure => { if (current) setError(getApprovalErrorMessage(failure)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; active.current = false; };
  }, [uid, authorized, retry]));
  const applications = authorized && result?.uid === uid ? result.applications : [];
  function confirm(application: StaffApplication, decision: Review['decision']) {
    if (locked.current) return;
    setError(''); setSuccess(''); setReview({ application, decision });
  }
  async function saveDecision() {
    if (!uid || !authorized || !review || locked.current) return;
    locked.current = true; setSaving(true); setError('');
    try {
      await reviewStaffApplication(uid, review.application.uid, review.application.role, review.decision);
      if (!active.current || auth.currentUser?.uid !== uid) return;
      setSuccess(`Application ${review.decision}. The applicant's access will update automatically when connected.`);
      setReview(null); setRetry(value => value + 1);
    } catch (failure) {
      if (active.current && auth.currentUser?.uid === uid) setError(getApprovalErrorMessage(failure));
    } finally { locked.current = false; if (active.current) setSaving(false); }
  }
  return (
    <View style={styles.container}>
      <View style={styles.heading}><Text style={styles.title}>Pending Approvals</Text><Pressable style={styles.refresh} disabled={saving} onPress={() => setRetry(value => value + 1)} accessibilityRole="button"><Text style={styles.link}>Refresh</Text></Pressable></View>
      <Text style={styles.description}>Review healthcare and blood-bank applications. Donors and requesters do not need approval.</Text>
      {!!success && <Text style={styles.success}>{success}</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && <ActivityIndicator style={styles.loading} color={COLORS.primary} accessibilityLabel="Loading pending applications" />}
      <FlatList data={applications} keyExtractor={item => item.uid} refreshing={loading} onRefresh={() => { if (!saving) setRetry(value => value + 1); }} contentContainerStyle={styles.list}
        ListEmptyComponent={!loading && !error ? <View style={styles.card}><Text style={styles.cardTitle}>No pending applications</Text><Text style={styles.description}>New staff applications will appear here.</Text></View> : null}
        renderItem={({ item }) => <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.fullName}</Text><Text selectable style={styles.detail}>{item.email}</Text>
          <Text style={styles.badge}>{item.role === 'healthcare' ? 'Healthcare Staff' : 'Blood Bank Staff'} · Pending</Text>
          <Text style={styles.detail}>Institution: {item.institutionName}</Text><Text style={styles.detail}>Designation: {item.designation}</Text><Text style={styles.detail}>Employee ID: {item.employeeId}</Text>
          <Text style={styles.detail}>Registered: {item.registeredAt === null ? 'Not recorded' : new Date(item.registeredAt).toLocaleDateString('en-GB')}</Text>
          {item.legacy && <Text style={styles.description}>Existing staff account without an approval record. Verify professional details before approving.</Text>}
          <View style={styles.buttons}><Pressable disabled={saving} style={styles.approve} onPress={() => confirm(item, 'approved')} accessibilityRole="button" accessibilityLabel={`Approve ${item.fullName}`}><Text style={styles.whiteText}>Approve</Text></Pressable><Pressable disabled={saving} style={styles.reject} onPress={() => confirm(item, 'rejected')} accessibilityRole="button" accessibilityLabel={`Reject ${item.fullName}`}><Text style={styles.link}>Reject</Text></Pressable></View>
        </View>} />
      <Modal visible={!!review} transparent animationType="fade" onRequestClose={() => { if (!saving) setReview(null); }}><View style={styles.overlay}><View style={styles.dialog}>
        <Text style={styles.title}>{review?.decision === 'approved' ? 'Approve application?' : 'Reject application?'}</Text><Text style={styles.description}>{review?.application.fullName}</Text><Text style={styles.description}>{review?.decision === 'approved' ? 'This enables access to the requested staff role. Confirm that you reviewed the professional details.' : 'The applicant will see a rejection message and will not receive staff access.'}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.buttons}><Pressable disabled={saving} style={styles.reject} onPress={() => setReview(null)} accessibilityRole="button"><Text style={styles.link}>Cancel</Text></Pressable><Pressable disabled={saving} style={styles.approve} onPress={saveDecision} accessibilityRole="button"><Text style={styles.whiteText}>{saving ? 'Saving...' : 'Confirm'}</Text></Pressable></View>
      </View></View></Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  title: { fontSize: 21, fontWeight: '700', color: COLORS.text }, refresh: { minHeight: 44, justifyContent: 'center', padding: 10 },
  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 21, marginVertical: 8, paddingHorizontal: 18 }, list: { padding: 18, gap: 14, paddingBottom: 30 },
  card: { padding: 18, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, gap: 6 }, cardTitle: { fontSize: 17, color: COLORS.text, fontWeight: '700' },
  detail: { color: COLORS.textSecondary, lineHeight: 21 }, badge: { color: COLORS.primary, fontWeight: '600', marginVertical: 6 }, buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  approve: { flex: 1, minHeight: 46, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, reject: { flex: 1, minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }, whiteText: { color: COLORS.white, fontWeight: '700' }, link: { color: COLORS.primary, fontWeight: '700' },
  success: { color: COLORS.success, padding: 18, lineHeight: 21 }, error: { color: COLORS.danger, padding: 18, lineHeight: 21 }, loading: { margin: 14 }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }, dialog: { width: '100%', maxWidth: 380, padding: 22, backgroundColor: COLORS.white, borderRadius: 18 },
});

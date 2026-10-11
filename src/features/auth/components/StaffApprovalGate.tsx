import React, { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../context/AuthContext';
import { getApprovalErrorMessage, watchStaffAccess, type StaffAccessState, type StaffRole } from '../services/staffApprovalService';
import { canAccessRoleDashboard } from '../utils/roleApproval';

export default function StaffApprovalGate({ role, children }: { role: StaffRole; children: ReactNode }) {
  const { user, logout } = useAuth();
  const uid = user?.uid;
  const [result, setResult] = useState<{ uid: string; state: StaffAccessState } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    let active = true;
    setResult(null); setError('');
    if (!uid) return;
    const stop = watchStaffAccess(uid, role, state => { if (active) setResult({ uid, state }); }, failure => {
      if (active) { setResult(null); setError(getApprovalErrorMessage(failure)); }
    });
    return () => { active = false; stop(); };
  }, [uid, role, retry]);
  const state = result?.uid === uid ? result?.state : null;
  // Never enter a privileged dashboard based solely on cached approval data.
  if (state && !state.fromCache && state.roleMatches
    && canAccessRoleDashboard(role, state.approvalStatus, state.suspended ? 'suspended' : 'active')) return <>{children}</>;
  const rejected = state?.approvalStatus === 'rejected';
  const blocked = state && (!state.roleMatches || state.suspended);
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await logout(); } catch { setError('Unable to sign out. Please retry.'); }
    finally { setSigningOut(false); }
  }
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.icon}><Ionicons name={rejected || blocked ? 'alert-circle-outline' : 'time-outline'} size={48} color={COLORS.primary} /></View>
        <Text style={styles.title}>{blocked ? 'Staff access unavailable' : rejected ? 'Application Rejected' : 'Awaiting Approval'}</Text>
        <Text style={styles.message}>{blocked ? 'Your account role or status no longer permits this staff dashboard. Contact the administrator.' : rejected ? 'Your staff application was rejected by the administrator. Contact your project administrator for further information.' : 'Your account is awaiting administrator approval.'}</Text>
        <Text style={styles.message}>{role === 'healthcare' ? 'Healthcare Staff' : 'Blood Bank Staff'} access is enabled only after approval.</Text>
        {!state && !error && <ActivityIndicator color={COLORS.primary} accessibilityLabel="Checking approval status" />}
        {state?.fromCache && <Text style={styles.message}>Waiting for a connection to confirm your latest approval status.</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.button} onPress={() => setRetry(value => value + 1)} accessibilityRole="button"><Text style={styles.buttonText}>Refresh approval status</Text></Pressable>
        <Pressable style={styles.secondary} disabled={signingOut} onPress={signOut} accessibilityRole="button"><Text style={styles.secondaryText}>{signingOut ? 'Signing out...' : 'Sign out'}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.softBackground }, content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 20 },
  icon: { padding: 24, borderRadius: 60, backgroundColor: COLORS.white }, title: { color: COLORS.text, fontSize: 25, fontWeight: '800', textAlign: 'center' },
  message: { color: COLORS.textSecondary, lineHeight: 23, textAlign: 'center' }, error: { color: COLORS.danger, lineHeight: 22, textAlign: 'center' },
  button: { backgroundColor: COLORS.primary, minHeight: 48, borderRadius: 12, padding: 15, alignSelf: 'stretch', alignItems: 'center' }, buttonText: { color: COLORS.white, fontWeight: '700' },
  secondary: { minHeight: 44, justifyContent: 'center', padding: 12 }, secondaryText: { color: COLORS.primary, fontWeight: '700' },
});

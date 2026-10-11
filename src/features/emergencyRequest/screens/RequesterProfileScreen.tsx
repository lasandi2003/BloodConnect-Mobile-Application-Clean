import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';

export default function RequesterProfileScreen() {
  const { user, profile, initializing, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const busy = useRef(false);
  async function signOut() {
    if (busy.current) return;
    busy.current = true; setLoggingOut(true); setLogoutError('');
    try { await logout(); setConfirmLogout(false); }
    catch { setLogoutError('Unable to sign out. Please try again.'); }
    finally { busy.current = false; setLoggingOut(false); }
  }
  // AuthContext already loads users/{uid}. Do not show a previous user's profile.
  const account = user && profile?.uid === user.uid ? profile : null;
  const name = account?.fullName || user?.displayName || 'Requester';
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Profile</Text>
        {initializing ? <ActivityIndicator color={COLORS.primary} /> : !user ? (
          <Text style={styles.message}>Please sign in to view your profile.</Text>
        ) : (
          <>
            <View style={styles.summary}>
              <View style={styles.avatar}><Text style={styles.initials}>{initials || 'R'}</Text></View>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.roleBadge}><Ionicons name="heart-outline" size={16} color={COLORS.primary} /><Text style={styles.role}>BloodConnect Requester</Text></View>
              <Text style={styles.status}>Account: {account?.status === 'active' ? 'Active' : account?.status === 'suspended' ? 'Suspended' : 'Unavailable'}</Text>
            </View>
            {!account && <Text style={styles.message}>Your account profile is unavailable. Showing available sign-in details. Please sign in again to reload your profile.</Text>}
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.card}>
              <ProfileField label="Full name" value={account?.fullName || user.displayName} />
              <ProfileField label="Email" value={account?.email || user.email} />
              <ProfileField label="Contact number" value={account?.phone || user.phoneNumber} />
            </View>
            <Pressable style={styles.signOutButton} onPress={() => { setLogoutError(''); setConfirmLogout(true); }} accessibilityRole="button" accessibilityLabel="Sign out of BloodConnect">
              <Ionicons name="log-out-outline" size={22} color={COLORS.primary} accessible={false} /><Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      <Modal visible={confirmLogout && !!user} transparent animationType="fade" onRequestClose={() => { if (!busy.current) setConfirmLogout(false); }}>
        <View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.sectionTitle}>Sign out?</Text><Text style={styles.message}>You will return to the login screen.</Text>
          {!!logoutError && <Text style={styles.error} accessibilityLiveRegion="polite">{logoutError}</Text>}
          <View style={styles.actions}>
            <Pressable disabled={loggingOut} style={styles.signOutButton} onPress={() => setConfirmLogout(false)} accessibilityRole="button"><Text style={styles.signOutText}>Cancel</Text></Pressable>
            <Pressable disabled={loggingOut} style={[styles.signOutButton, styles.confirmButton]} onPress={() => void signOut()} accessibilityRole="button" accessibilityState={{ disabled: loggingOut, busy: loggingOut }}><Text style={styles.confirmText}>{loggingOut ? 'Signing out...' : 'Sign Out'}</Text></Pressable>
          </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Text selectable style={styles.value}>{value || 'Not provided'}</Text></View>;
}

const styles = StyleSheet.create({
  signOutButton: { minHeight: 48, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  signOutText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 }, confirmButton: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, confirmText: { color: COLORS.white, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' }, dialog: { width: '100%', maxWidth: 380, padding: 24, borderRadius: 20, backgroundColor: COLORS.white, gap: 16 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, error: { color: COLORS.danger, lineHeight: 22 },
  initials: { color: COLORS.primary, fontSize: 28, fontWeight: '700' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.softBackground, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 },
  status: { color: COLORS.textSecondary, fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 8, marginBottom: -8 },
  safe: { flex: 1, backgroundColor: COLORS.softBackground },
  content: { padding: 22, gap: 20 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  summary: { alignItems: 'center', gap: 12, padding: 24, backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.softBackground, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  role: { color: COLORS.primary, fontWeight: '600' },
  card: { backgroundColor: COLORS.white, borderRadius: 18, paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.border },
  field: { paddingVertical: 16, gap: 6 },
  label: { color: COLORS.textSecondary, fontSize: 13 },
  value: { color: COLORS.text, fontSize: 16, lineHeight: 23 },
  message: { color: COLORS.textSecondary, lineHeight: 22 },
});

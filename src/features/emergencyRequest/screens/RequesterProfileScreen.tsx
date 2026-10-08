import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';

export default function RequesterProfileScreen() {
  const { user, profile, initializing } = useAuth();
  // AuthContext already loads users/{uid}. Do not show a previous user's profile.
  const account = user && profile?.uid === user.uid ? profile : null;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Requester Profile</Text>
        {initializing ? <ActivityIndicator color={COLORS.primary} /> : !user ? (
          <Text style={styles.message}>Please sign in to view your profile.</Text>
        ) : (
          <>
            <View style={styles.summary}>
              <View style={styles.avatar}><Ionicons name="person-outline" size={36} color={COLORS.primary} /></View>
              <Text style={styles.name}>{account?.fullName || user.displayName || 'Requester'}</Text>
              <Text style={styles.role}>BloodConnect Requester</Text>
            </View>
            {!account && <Text style={styles.message}>Your account profile is unavailable. Showing available sign-in details. Please sign in again to reload your profile.</Text>}
            <View style={styles.card}>
              <ProfileField label="Full name" value={account?.fullName || user.displayName} />
              <ProfileField label="Email" value={account?.email || user.email} />
              <ProfileField label="Contact number" value={account?.phone || user.phoneNumber} />
              <ProfileField label="Account status" value={account?.status === 'active' ? 'Active' : account?.status === 'suspended' ? 'Suspended' : null} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Text selectable style={styles.value}>{value || 'Not provided'}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.softBackground },
  content: { padding: 22, gap: 20 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  summary: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  role: { color: COLORS.primary, fontWeight: '600' },
  card: { backgroundColor: COLORS.white, borderRadius: 18, paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.border },
  field: { paddingVertical: 16, gap: 6 },
  label: { color: COLORS.textSecondary, fontSize: 13 },
  value: { color: COLORS.text, fontSize: 16, lineHeight: 23 },
  message: { color: COLORS.textSecondary, lineHeight: 22 },
});

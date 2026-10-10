import React, { useCallback, useState } from 'react';

import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';
import { watchRequesterHistory, getRequestHistoryErrorMessage, type RequestHistoryItem } from '../services/emergencyRequestService';
import { canCancelRequest, getRequestStatusView } from '../utils/requestStatus';
import { formatDisplayDate } from '../utils/hospitalValidation';

interface Props {
  onCreateRequest: () => void;
  onRequestHistory: () => void;
  onOpenRequest: (requestId: string) => void;
}

export default function RequesterDashboardScreen({ onCreateRequest, onRequestHistory, onOpenRequest }: Props) {
  const { logout, user, profile } = useAuth();
  const [history, setHistory] = useState<{ uid: string; requests: RequestHistoryItem[]; cached: boolean; skipped: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const uid = user?.uid;
  useFocusEffect(useCallback(() => {
    let active = true;
    setHistory(null);
    setLoading(true);
    setError('');
    if (!uid) {
      setLoading(false);
      setError('Please sign in to view your requests.');
      return () => { active = false; };
    }
    const stop = watchRequesterHistory(uid, (requests, cached, skipped) => {
      if (!active) return;
      setHistory({ uid, requests, cached, skipped });
      setLoading(false);
      setError('');
    }, failure => {
      if (!active) return;
      setHistory(null);
      setLoading(false);
      setError(getRequestHistoryErrorMessage(failure));
    });
    return () => { active = false; stop(); };
  }, [uid, retry]));
  const current = history?.uid === uid ? history : null;
  const activeRequests = current?.requests.filter(request => canCancelRequest(request.status)) ?? [];
  const greetingName = profile?.uid === uid ? profile?.fullName : user?.displayName;
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function handleRequestHistory() {
    onRequestHistory();
  }

  function closeLogoutModal() {
    if (!loggingOut) {
      setLogoutModalVisible(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      // The existing RootNavigator returns the user to Login.
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Unable to sign out', 'Please try again.');
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="heart-outline" size={25} color={COLORS.white} />
            </View>
            <Text style={styles.title}>Emergency Blood Request</Text>
            <Pressable
              style={styles.logoutButton}
              onPress={() => setLogoutModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              hitSlop={8}
            >
              <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Create and monitor emergency requests</Text>
          <Text style={styles.subtitle}>Welcome{greetingName ? `, ${greetingName}` : ''}</Text>

          <Pressable
            style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
            onPress={onCreateRequest}
            accessibilityRole="button"
            accessibilityLabel="Create Emergency Request"
          >
            <Ionicons name="add" size={22} color={COLORS.primary} />
            <Text style={styles.createButtonText}>Create Emergency Request</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Requests{current ? ` (${activeRequests.length})` : ''}</Text>
          {loading && <ActivityIndicator color={COLORS.primary} accessibilityLabel="Loading active requests" />}
          {!!error && <View style={styles.activeCard}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={styles.retryButton}><Text style={styles.statusText}>Try again</Text></Pressable></View>}
          {current?.cached && <Text style={styles.cardDescription}>Showing cached requests. Waiting for the latest saved status.</Text>}
          {!!current?.skipped && <Text style={styles.errorText}>Some saved requests have incomplete details. Open History for more information.</Text>}
          {!loading && !error && current && !current.cached && !current.skipped && activeRequests.length === 0 && (
            <View style={styles.activeCard}><View style={styles.emptyIcon}><Ionicons name="water-outline" size={25} color={COLORS.primary} /></View><Text style={styles.cardTitle}>No active requests</Text><Text style={styles.cardDescription}>Create a request or check your previous requests in History.</Text></View>
          )}
          {activeRequests.slice(0, 3).map(request => (
            <Pressable key={request.requestId} style={styles.requestCard} onPress={() => onOpenRequest(request.requestId)} accessibilityRole="button" accessibilityLabel={`View ${request.bloodGroup} request status`}>
              <View style={styles.requestRow}><Text style={styles.cardTitle}>{request.bloodGroup} · {request.unitsRequired === null ? 'Units not recorded' : `${request.unitsRequired} unit(s)`}</Text><Ionicons name="chevron-forward" size={21} color={COLORS.primary} /></View>
              <Text style={styles.cardDescription}>{request.hospitalName}</Text>
              <Text style={styles.cardDescription}>Required: {request.requiredDate ? formatDisplayDate(request.requiredDate) : 'Not recorded'}</Text>
              <View style={styles.statusBadge}><Text style={styles.statusText}>{getRequestStatusView(request.status, request.verified).label}</Text></View>
              <Text style={styles.cardDescription}>Tap to view progress</Text>
            </Pressable>
          ))}
          {activeRequests.length > 3 && <Pressable onPress={onRequestHistory} accessibilityRole="button" style={styles.retryButton}><Text style={styles.statusText}>View all {activeRequests.length} active requests in History</Text></Pressable>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request History</Text>
          <Pressable
            style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}
            onPress={handleRequestHistory}
            accessibilityRole="button"
            accessibilityLabel="Request History"
          >
            <View style={styles.historyIcon}>
              <Ionicons name="document-text-outline" size={23} color={COLORS.primary} />
            </View>
            <View style={styles.historyText}>
              <Text style={styles.cardTitle}>Request History</Text>
              <Text style={styles.cardDescription}>View your previous emergency requests.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLogoutModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="log-out-outline" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out of BloodConnect?</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={closeLogoutModal}
                disabled={loggingOut}
                accessibilityRole="button"
                accessibilityState={{ disabled: loggingOut }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.signOutButton, loggingOut && styles.pressed]}
                onPress={handleLogout}
                disabled={loggingOut}
                accessibilityRole="button"
                accessibilityState={{ disabled: loggingOut }}
              >
                <Text style={styles.signOutButtonText}>{loggingOut ? 'Signing out...' : 'Sign Out'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  requestCard: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, backgroundColor: COLORS.white },
  requestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 8, backgroundColor: COLORS.softBackground, paddingHorizontal: 10, paddingVertical: 7, marginTop: 12 },
  statusText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  errorText: { color: COLORS.danger, lineHeight: 20 },
  retryButton: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    color: COLORS.white,
  },
  logoutButton: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.white,
  },
  createButton: {
    minHeight: 52,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  createButtonText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  activeCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  historyCard: {
    minHeight: 92,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.65,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  modalIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.softBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  signOutButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});

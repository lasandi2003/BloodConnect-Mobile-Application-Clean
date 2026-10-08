import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { getDonorProfile } from '../../donor/services/donorService';
import type { DonorProfile, EmergencyRequest } from '../../donor/types/donor';
import { getVerificationRequestById } from '../services/verificationService';
import type { VerificationMatchingStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<VerificationMatchingStackParamList, 'MatchConfirmation'>;

function clean(value: string | undefined): string {
  const text = value?.trim();
  if (!text || ['null', 'undefined', 'not specified'].includes(text.toLowerCase())) return '';
  return text;
}

function displayName(value: string | undefined, fallback: string): string {
  const name = clean(value);
  return !name || name === 'Patient' || name === 'Donor' ? fallback : name;
}

function initials(value: string): string {
  const name = clean(value);
  if (!name || name.toLowerCase() === 'not provided') return '—';
  return name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part.charAt(0).toUpperCase()).join('') || '—';
}

function hasDonorData(donor: DonorProfile): boolean {
  return Boolean(
    clean(donor.fullName) || clean(donor.phone) || clean(donor.email) ||
    clean(donor.bloodGroup) || clean(donor.city) || clean(donor.district) ||
    clean(donor.address) || donor.age !== undefined || clean(donor.lastDonationDate),
  );
}

function RelationshipPerson({ name, label }: { name: string; label: 'Donor' | 'Patient' }) {
  const words = name.split(/\s+/).filter(Boolean);
  return (
    <View style={styles.personColumn}>
      <View style={styles.personAvatar}>
        <Text style={styles.personInitials}>{initials(name)}</Text>
      </View>
      <Text style={styles.personName} numberOfLines={2}>
        {words.length > 1 ? `${words[0]}\n${words.slice(1).join(' ')}` : name}
      </Text>
      <Text style={styles.personLabel}>{label}</Text>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={styles.summaryValue}>{children}</View>
    </View>
  );
}

export default function MatchConfirmationScreen({ route, navigation }: Props) {
  const { requestId, donorId } = route.params;
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissing(null);
    try {
      const [loadedRequest, loadedDonor] = await Promise.all([
        getVerificationRequestById(requestId),
        getDonorProfile(donorId),
      ]);

      if (!loadedRequest) {
        setRequest(null);
        setDonor(null);
        setMissing('The blood request could not be found.');
      } else if (!hasDonorData(loadedDonor)) {
        setRequest(loadedRequest);
        setDonor(null);
        setMissing('The selected donor profile could not be found.');
      } else {
        setRequest(loadedRequest);
        setDonor(loadedDonor);
      }
    } catch (loadError) {
      console.error('Match confirmation load error:', loadError);
      setRequest(null);
      setDonor(null);
      setError('Unable to load confirmation details. Check your connection and access.');
    } finally {
      setLoading(false);
    }
  }, [donorId, requestId]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  const viewRequest = () => navigation.navigate('RequestVerification', { requestId });
  const backToDashboard = () => navigation.popToTop();

  const donorName = displayName(donor?.fullName, 'Not provided');
  const patientName = displayName(request?.patientName, 'Not provided');
  const requestReference = request?.id
    ? (request.id.startsWith('#') ? request.id : `#${request.id}`)
    : 'Not provided';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.page}>
        {loading ? (
          <View style={styles.stateCard}>
            <Text style={styles.title}>Match Confirmation</Text>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Loading request and donor...</Text>
          </View>
        ) : error || missing || !request || !donor ? (
          <View style={styles.stateCard}>
            <Text style={styles.title}>Match Confirmation</Text>
            <View style={styles.errorIcon}><Ionicons name="alert-circle-outline" size={30} color={COLORS.primary} /></View>
            <Text style={styles.stateHeading}>{error ? 'Unable to load details' : 'Details unavailable'}</Text>
            <Text style={styles.stateText}>{error || missing || 'The request or donor could not be found.'}</Text>
            {error ? (
              <Pressable accessibilityRole="button" onPress={() => void loadDetails()} style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={backToDashboard} style={styles.textAction}>
              <Ionicons name="arrow-back" size={13} color={COLORS.textSecondary} />
              <Text style={styles.textActionLabel}>Back to dashboard</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.confirmationScroll}
            contentContainerStyle={styles.confirmationScrollContent}
            showsVerticalScrollIndicator={false}
          >
              <Text style={styles.title}>Match Confirmation</Text>

              <View style={styles.successOuter}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={40} color={COLORS.white} />
                </View>
              </View>

              <Text style={styles.successTitle}>Donor matched{ '\n' }successfully!</Text>
              <Text style={styles.successSubtitle}>A suitable donor has been matched for this request.</Text>

              <View style={styles.relationshipCard}>
                <RelationshipPerson name={donorName} label="Donor" />
                <View style={styles.connection}>
                  <View style={styles.connectionLine} />
                  <View style={styles.connectionBadge}>
                    <Text style={styles.connectionBlood}>{request.bloodGroup || donor.bloodGroup || '—'}</Text>
                  </View>
                  <View style={styles.connectionLine} />
                </View>
                <RelationshipPerson name={patientName} label="Patient" />
              </View>

              <View style={styles.requestCard}>
                <SummaryRow icon="pricetag-outline" label="Request ID">
                  <Text style={styles.requestId} numberOfLines={1} ellipsizeMode="middle">{requestReference}</Text>
                </SummaryRow>
                <View style={styles.rowDivider} />
                <SummaryRow icon="water-outline" label="Blood Group">
                  <Text style={styles.requestBlood}>{request.bloodGroup || donor.bloodGroup || 'Not provided'}</Text>
                </SummaryRow>
                <View style={styles.rowDivider} />
                <SummaryRow icon="checkmark-circle-outline" label="Status">
                  <View style={styles.matchedPill}>
                    <Text style={styles.matchedText}>Matched</Text>
                  </View>
                </SummaryRow>
              </View>

              <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notify donor. Notifications are not connected yet."
                accessibilityState={{ disabled: true }}
                disabled
                style={[styles.primaryButton, styles.notifyDisabled]}
              >
                <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Notify donor</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={viewRequest} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>View request</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={backToDashboard} style={[styles.textAction, styles.dashboardAction]}>
                <Ionicons name="home-outline" size={17} color={COLORS.textSecondary} />
                <Text style={styles.dashboardActionLabel}>Back to dashboard</Text>
              </Pressable>
              </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF5F5' },
  page: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  confirmationScroll: { flex: 1 },
  confirmationScrollContent: { flexGrow: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 20 },
  title: { color: COLORS.primary, fontSize: 18, lineHeight: 24, fontWeight: '800', textAlign: 'center' },
  successOuter: { width: 86, height: 86, marginTop: 21, borderRadius: 43, backgroundColor: '#E5F6EC', alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#28A363', alignItems: 'center', justifyContent: 'center', shadowColor: '#28A363', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 7, elevation: 3 },
  successTitle: { marginTop: 20, color: '#202027', fontSize: 20, lineHeight: 24, fontWeight: '800', textAlign: 'center' },
  successSubtitle: { maxWidth: 280, marginTop: 8, color: COLORS.textSecondary, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  relationshipCard: { width: '100%', minHeight: 145, marginTop: 22, paddingHorizontal: 22, paddingVertical: 19, borderRadius: 19, borderWidth: 1, borderColor: '#F1E6E7', backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  personColumn: { width: '36%', alignItems: 'center', justifyContent: 'center' },
  personAvatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: '#F2CBD1', backgroundColor: '#FFF9FA', alignItems: 'center', justifyContent: 'center' },
  personInitials: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
  personName: { minHeight: 34, marginTop: 5, color: COLORS.text, fontSize: 13, lineHeight: 16, fontWeight: '700', textAlign: 'center' },
  personLabel: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center' },
  connection: { flex: 1, minWidth: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  connectionLine: { flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#E6AAB4' },
  connectionBadge: { width: 40, height: 40, marginHorizontal: -1, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', zIndex: 1, elevation: 2 },
  connectionBlood: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  requestCard: { width: '100%', marginTop: 16, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 17, borderWidth: 1, borderColor: '#F0E2E4', backgroundColor: COLORS.white, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 1 },
  summaryRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9 },
  summaryLabel: { flex: 1, color: COLORS.textSecondary, fontSize: 11 },
  summaryValue: { maxWidth: '54%', alignItems: 'flex-end', flexShrink: 1 },
  requestId: { maxWidth: '100%', color: COLORS.text, fontSize: 11, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  requestBlood: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  matchedPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: '#E5F6EC' },
  matchedText: { color: '#178650', fontSize: 10, fontWeight: '700' },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F1E5E7' },
  actions: { width: '100%', marginTop: 24, gap: 11 },
  primaryButton: { minHeight: 54, borderRadius: 13, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  notifyDisabled: { opacity: 1 },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  secondaryButton: { minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: '#E9B4BD', backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  textAction: { minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  dashboardAction: { minHeight: 34, marginTop: 5, gap: 6 },
  textActionLabel: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '600' },
  dashboardActionLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  stateCard: { minHeight: 300, padding: 22, borderRadius: 24, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: '#F1E3E5' },
  errorIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  stateHeading: { color: COLORS.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stateText: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  retryButton: { marginTop: 2, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
});

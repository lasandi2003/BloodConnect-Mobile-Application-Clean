import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
import type { DonorProfile } from '../../donor/types/donor';
import { getDonorProfile } from '../../donor/services/donorService';
import type { VerificationMatchingStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<VerificationMatchingStackParamList, 'DonorDetails'>;

function clean(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed && !['null', 'undefined'].includes(trimmed.toLowerCase())
    ? trimmed
    : '';
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'D';
}

function formatDate(value: unknown): string {
  if (!value) return 'Not provided';
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (typeof value === 'object' && value !== null) {
    const timestamp = value as { toDate?: () => Date; toMillis?: () => number };
    if (typeof timestamp.toDate === 'function') date = timestamp.toDate();
    else if (typeof timestamp.toMillis === 'function') date = new Date(timestamp.toMillis());
  }

  if (!date || Number.isNaN(date.getTime())) return 'Not provided';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={17} color={COLORS.primary} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export default function DonorDetailsScreen({ route, navigation }: Props) {
  const { requestId, donorId, donorAlreadySelected, canSelectDonor } = route.params;
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDonor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await getDonorProfile(donorId);
      const hasProfileData = Boolean(
        clean(profile.fullName) || clean(profile.phone) || clean(profile.email) ||
        clean(profile.bloodGroup) || clean(profile.city) || clean(profile.district) ||
        clean(profile.address) || profile.age !== undefined || clean(profile.lastDonationDate),
      );
      if (!hasProfileData) {
        setDonor(null);
      } else {
        setDonor(profile);
      }
    } catch (loadError) {
      console.error('Donor details load error:', loadError);
      setDonor(null);
      setError('Unable to load this donor profile. Check your connection and access.');
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => { void loadDonor(); }, [loadDonor]);

  const location = useMemo(() => {
    if (!donor) return '';
    return [clean(donor.city), clean(donor.district), clean(donor.address)]
      .filter((part, index, parts) => part && parts.indexOf(part) === index)
      .join(', ');
  }, [donor]);
  const donorIsAvailable = donor?.isAvailable === true;

  const confirmSelection = () => {
    navigation.navigate('MatchConfirmation', { requestId, donorId });
  };

  const ageText = typeof donor?.age === 'number' && Number.isFinite(donor.age)
    ? `${donor.age} years`
    : 'Not provided';
  const phoneText = clean(donor?.phone) || 'Not provided';
  const bloodGroupText = clean(donor?.bloodGroup) || 'Not provided';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.page}>
        {loading ? (
          <View style={styles.stateArea}>
            <Header onBack={() => navigation.goBack()} />
            <Text style={styles.pageTitle}>Donor profile</Text>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Loading donor details...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateArea}>
            <Header onBack={() => navigation.goBack()} />
            <Text style={styles.pageTitle}>Donor profile</Text>
            <Ionicons name="cloud-offline-outline" size={32} color={COLORS.primary} />
            <Text style={styles.stateTitle}>Unable to load donor</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadDonor()} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : !donor ? (
          <View style={styles.stateArea}>
            <Header onBack={() => navigation.goBack()} />
            <Text style={styles.pageTitle}>Donor profile</Text>
            <Ionicons name="person-remove-outline" size={32} color={COLORS.primary} />
            <Text style={styles.stateTitle}>Donor not found</Text>
            <Text style={styles.stateText}>This donor profile is no longer available.</Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.hero}>
                <View pointerEvents="none" style={styles.heroDecorOne} />
                <View pointerEvents="none" style={styles.heroDecorTwo} />
                <View pointerEvents="none" style={styles.heroDecorDrop}>
                  <Ionicons name="water" size={68} color="rgba(255,255,255,0.07)" />
                </View>
                <View style={styles.heroHeader}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back to donor list"
                    onPress={() => navigation.goBack()}
                    style={styles.heroBackButton}
                  >
                    <Ionicons name="arrow-back" size={19} color={COLORS.white} />
                  </Pressable>
                  <Text style={styles.heroTitle}>Donor profile</Text>
                  <View style={styles.headerBalance} />
                </View>
                <View style={styles.heroProfile}>
                  <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(clean(donor.fullName))}</Text>
                    </View>
                    {donorIsAvailable ? <View style={styles.avatarAvailabilityDot} /> : null}
                  </View>
                  <Text style={styles.donorName} numberOfLines={2}>
                    {clean(donor.fullName) || 'Donor'}
                  </Text>
                  <View style={[styles.availabilityBadge, donorIsAvailable ? styles.available : styles.unavailable]}>
                    <View style={[styles.availabilityDot, donorIsAvailable ? styles.availableDot : styles.unavailableDot]} />
                    <Text style={[styles.availabilityText, donorIsAvailable ? styles.availableText : styles.unavailableText]}>
                      {donorIsAvailable ? 'Available to donate' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryPrimary} numberOfLines={1}>{bloodGroupText}</Text>
                  <Text style={styles.summaryLabel}>Blood group</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={[styles.summaryColumn, styles.locationColumn]}>
                  <Ionicons name="location" size={16} color={COLORS.primary} />
                  <Text style={styles.summaryLocation} numberOfLines={1}>{location || 'Not provided'}</Text>
                  <Text style={styles.summaryLabel}>Location</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryColumn}>
                  <View style={styles.callIconCircle}>
                    <Ionicons name="call" size={17} color={COLORS.white} />
                  </View>
                  <Text style={styles.summaryLabel}>Call</Text>
                </View>
              </View>

              <View style={styles.personalCard}>
                <Text style={styles.personalTitle}>Personal details</Text>
                <DetailRow icon="calendar-outline" label="Age" value={ageText} />
                <View style={styles.rowDivider} />
                <DetailRow icon="person-outline" label="Gender" value="Not provided" />
                <View style={styles.rowDivider} />
                <DetailRow icon="call-outline" label="Phone" value={phoneText} />
                <View style={styles.rowDivider} />
                <DetailRow icon="time-outline" label="Last donation" value={formatDate(donor.lastDonationDate)} />
              </View>
            </ScrollView>

            <View style={styles.actionBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={donorAlreadySelected ? 'Donor already selected' : 'Confirm as matching donor'}
                accessibilityState={{ disabled: !canSelectDonor }}
                disabled={!canSelectDonor}
                onPress={confirmSelection}
                style={[styles.confirmButton, !canSelectDonor && styles.disabledButton]}
              >
                <Ionicons name="heart" size={18} color={COLORS.white} />
                <Text style={styles.confirmText}>
                  {donorAlreadySelected
                    ? 'Already selected — return to Donor List'
                    : canSelectDonor
                      ? 'Confirm as Matching Donor'
                      : 'Selection limit reached'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.stateHeroHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to donor list" onPress={onBack} style={styles.heroBackButton}>
        <Ionicons name="arrow-back" size={19} color={COLORS.white} />
      </Pressable>
      <Text style={styles.heroTitle}>Donor profile</Text>
      <View style={styles.headerBalance} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF5F5' },
  page: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 14 },
  heroHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stateHeroHeader: { width: '100%', minHeight: 56, marginBottom: 12, paddingHorizontal: 12, borderRadius: 18, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBackButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.19)' },
  heroTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  headerBalance: { width: 36, height: 36 },
  pageTitle: { marginBottom: 16, color: COLORS.primary, textAlign: 'center', fontSize: 19, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 2, paddingBottom: 22 },
  hero: { minHeight: 262, paddingHorizontal: 16, paddingBottom: 42, borderRadius: 26, overflow: 'hidden', backgroundColor: '#C8102E', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  heroDecorOne: { position: 'absolute', top: 48, right: -56, width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  heroDecorTwo: { position: 'absolute', top: 86, right: -25, width: 128, height: 128, borderRadius: 64, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroDecorDrop: { position: 'absolute', left: 18, bottom: 34, opacity: 0.6, transform: [{ rotate: '-18deg' }] },
  heroProfile: { alignItems: 'center', paddingTop: 5 },
  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#F6D6DA', backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontSize: 26, fontWeight: '800' },
  avatarAvailabilityDot: { position: 'absolute', right: 1, bottom: 2, width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#C8102E', backgroundColor: '#18A765' },
  donorName: { maxWidth: '100%', color: COLORS.white, fontSize: 21, lineHeight: 27, fontWeight: '800', textAlign: 'center' },
  availabilityBadge: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 },
  available: { backgroundColor: COLORS.white },
  unavailable: { backgroundColor: 'rgba(255,255,255,0.18)' },
  availabilityDot: { width: 7, height: 7, borderRadius: 4 },
  availableDot: { backgroundColor: '#15945B' },
  unavailableDot: { backgroundColor: '#FFD9DE' },
  availabilityText: { fontSize: 10, fontWeight: '700' },
  availableText: { color: '#138150' },
  unavailableText: { color: COLORS.white },
  summaryCard: { minHeight: 96, marginTop: -30, marginHorizontal: 10, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1, borderColor: '#F5E5E7', backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.11, shadowRadius: 9, elevation: 5, zIndex: 2 },
  summaryColumn: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 4 },
  locationColumn: { flex: 1.35 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 44, backgroundColor: '#ECDADD' },
  summaryPrimary: { color: COLORS.primary, fontSize: 19, fontWeight: '800' },
  summaryLocation: { maxWidth: '100%', color: COLORS.text, fontSize: 11, fontWeight: '700' },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '600' },
  callIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  personalCard: { marginTop: 16, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4, borderRadius: 20, borderWidth: 1, borderColor: '#F0DEE1', backgroundColor: COLORS.white, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 7, elevation: 2 },
  personalTitle: { marginBottom: 4, color: COLORS.text, fontSize: 15, fontWeight: '800' },
  detailRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { flex: 1, minWidth: 0, color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  detailValue: { flex: 1.25, minWidth: 0, color: COLORS.text, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F1E3E5' },
  actionBar: { paddingTop: 10, paddingBottom: 6, borderTopWidth: 1, borderTopColor: '#F2E1E4', backgroundColor: COLORS.white, marginHorizontal: -14, paddingHorizontal: 14 },
  confirmButton: { minHeight: 52, paddingHorizontal: 14, borderRadius: 15, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  disabledButton: { opacity: 0.55 },
  confirmText: { color: COLORS.white, fontSize: 12, fontWeight: '800', textAlign: 'center', flexShrink: 1 },
  stateArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  stateTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stateText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: { marginTop: 3, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 11, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
});

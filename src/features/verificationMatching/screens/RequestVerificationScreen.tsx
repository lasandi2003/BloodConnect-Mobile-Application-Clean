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
import type { EmergencyRequest } from '../../donor/types/donor';
import type { VerificationMatchingStackParamList } from '../navigation/types';
import { getVerificationRequestById, verifyRequest } from '../services/verificationService';

type Props = NativeStackScreenProps<
  VerificationMatchingStackParamList,
  'RequestVerification'
>;

function displayValue(value: string | undefined, fallback = 'Not provided'): string {
  if (!value?.trim() || ['Patient', 'Hospital', 'Not specified', 'Location unavailable'].includes(value)) {
    return fallback;
  }

  return value;
}

function formatSubmittedAt(request: EmergencyRequest): string | null {
  const createdAt = request.createdAt;
  if (!createdAt) return null;

  try {
    return createdAt.toDate().toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIconBox}>
        <Ionicons name={icon} size={17} color={COLORS.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Ionicons name={icon} size={16} color={COLORS.primary} style={styles.rowIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">{value}</Text>
    </View>
  );
}

function DetailCard({
  icon,
  title,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <SectionHeading icon={icon} title={title} />
      <View style={styles.sectionRows}>{children}</View>
    </View>
  );
}

function RequirementTile({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <View style={styles.requirementTile}>
      <Text style={styles.tileLabel} numberOfLines={1}>{label}</Text>
      <Text style={[styles.tileValue, compact && styles.tileValueCompact]} numberOfLines={2} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

export default function RequestVerificationScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await getVerificationRequestById(requestId);
      setRequest(result);
    } catch (error) {
      console.error('Request verification load error:', error);
      setErrorMessage('We could not load this request. Check your connection and access, then try again.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  const onVerifyRequest = useCallback(async () => {
    if (!request || verifying) return;
    setVerifying(true);
    setVerificationError(null);
    try {
      await verifyRequest(request.id);
      navigation.navigate('MatchingDonors', { requestId: request.id });
    } catch (error) {
      console.error('Request verification action error:', error);
      setVerificationError('Could not verify this request. Check your access and try again.');
    } finally {
      setVerifying(false);
    }
  }, [navigation, request, verifying]);

  const submittedAt = request ? formatSubmittedAt(request) : null;
  const urgent = request?.urgency === 'critical' || request?.urgency === 'urgent';
  const secondarySummary = request
    ? [displayValue(request.patientName, ''), displayValue(request.hospitalName, ''), displayValue(request.location, '')]
      .filter(Boolean)
      .join(' · ')
    : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Pending Blood Requests"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={19} color={COLORS.primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.pageTitle}>Request verification</Text>
            <Text style={styles.pageSubtitle}>Back to requests</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Loading request details...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={30} color={COLORS.primary} />
            <Text style={styles.stateTitle}>Unable to load request</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadRequest()} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : !request ? (
          <View style={styles.stateCard}>
            <Ionicons name="document-text-outline" size={30} color={COLORS.textMuted} />
            <Text style={styles.stateTitle}>Request not found</Text>
            <Text style={styles.stateText}>This request may have been removed or is no longer available.</Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.detailsScroll}
              contentContainerStyle={styles.detailsContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.summaryCard}>
                <Ionicons name="pulse-outline" size={108} color="#FFFFFF" style={styles.summaryDecoration} />
                <View style={styles.summaryTop}>
                  <View style={styles.summaryIdBlock}>
                    <Text style={styles.summaryLabel}>Request ID</Text>
                    <Text style={styles.requestId} numberOfLines={1} ellipsizeMode="middle">#{request.id}</Text>
                  </View>
                  <View style={styles.urgencyBadge}>
                    <View style={[styles.urgencyDot, urgent && styles.urgencyDotHot]} />
                    <Text style={styles.urgencyText}>{request.urgency.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.summaryMain}>
                  <View style={styles.bloodGroupBadge}>
                    <Text style={styles.bloodGroupText}>{request.bloodGroup}</Text>
                  </View>
                  <View style={styles.summaryDescription}>
                    <Text style={styles.unitsText}>{request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'} needed</Text>
                    <Text style={styles.summaryPeople} numberOfLines={2}>{secondarySummary || 'Request details unavailable'}</Text>
                  </View>
                </View>

                {submittedAt ? (
                  <View style={styles.submittedRow}>
                    <Ionicons name="calendar-outline" size={15} color="#FFE5E9" />
                    <Text style={styles.submittedText}>Submitted on {submittedAt}</Text>
                  </View>
                ) : null}
              </View>

              <DetailCard icon="person-outline" title="Patient details">
                <DetailRow icon="person-outline" label="Name" value={displayValue(request.patientName)} />
                <DetailRow icon="calendar-outline" label="Age" value="Not provided" />
                <DetailRow icon="male-female-outline" label="Gender" value="Not provided" last />
              </DetailCard>

              <View style={styles.sectionCard}>
                <SectionHeading icon="water-outline" title="Blood requirement" />
                <View style={styles.requirementRow}>
                  <RequirementTile label="Blood group" value={displayValue(request.bloodGroup)} />
                  <RequirementTile label="Units" value={String(request.unitsRequired)} />
                  <RequirementTile label="Needed by" value={displayValue(request.requiredDate)} compact />
                </View>
              </View>

              <DetailCard icon="business-outline" title="Hospital details">
                <DetailRow icon="business-outline" label="Hospital" value={displayValue(request.hospitalName)} />
                <DetailRow icon="bed-outline" label="Ward" value="Not provided" />
                <DetailRow icon="location-outline" label="Location" value={displayValue(request.location)} last />
              </DetailCard>
            </ScrollView>

            {verificationError ? <Text accessibilityRole="alert" style={styles.actionError}>{verificationError}</Text> : null}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('MatchingDonors', { requestId })}
                style={styles.rejectButton}
              >
                <Ionicons name="close" size={18} color={COLORS.primary} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: verifying, busy: verifying }}
                disabled={verifying}
                onPress={() => void onVerifyRequest()}
                style={styles.verifyButton}
              >
                {verifying ? <ActivityIndicator size="small" color={COLORS.white} /> : <Ionicons name="shield-checkmark-outline" size={17} color={COLORS.white} />}
                <Text style={styles.verifyButtonText}>{verifying ? 'Verifying…' : 'Verify request'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    paddingHorizontal: 18,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F3E4E6',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  pageSubtitle: {
    marginTop: 2,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    paddingTop: 7,
    paddingBottom: 16,
    gap: 11,
  },
  summaryCard: {
    overflow: 'hidden',
    position: 'relative',
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryDecoration: {
    position: 'absolute',
    right: -9,
    top: 29,
    opacity: 0.09,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryIdBlock: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    color: '#FFE5E9',
    fontSize: 10,
    fontWeight: '600',
  },
  requestId: {
    marginTop: 2,
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4932E',
  },
  urgencyDotHot: {
    backgroundColor: COLORS.primary,
  },
  urgencyText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryMain: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bloodGroupBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  bloodGroupText: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  summaryDescription: {
    flex: 1,
    minWidth: 0,
  },
  unitsText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryPeople: {
    marginTop: 4,
    color: '#FFE5E9',
    fontSize: 11,
    lineHeight: 16,
  },
  submittedRow: {
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  submittedText: {
    flex: 1,
    color: '#FFE5E9',
    fontSize: 10,
    fontWeight: '500',
  },
  sectionCard: {
    padding: 13,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F4E6E8',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCEAEC',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionRows: {
    marginTop: 6,
  },
  detailRow: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5E9EB',
  },
  rowIcon: {
    width: 19,
  },
  detailLabel: {
    flex: 0.82,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  detailValue: {
    flex: 1.35,
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  requirementRow: {
    marginTop: 11,
    flexDirection: 'row',
    gap: 8,
  },
  requirementTile: {
    flex: 1,
    minWidth: 0,
    minHeight: 68,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: '#FFF3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    textAlign: 'center',
  },
  tileValue: {
    marginTop: 5,
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  tileValueCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  actions: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 2,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF5F5',
    borderTopWidth: 1,
    borderTopColor: '#F2E1E4',
  },
  actionError: {
    paddingTop: 6,
    color: COLORS.primary,
    fontSize: 11,
    textAlign: 'center',
  },
  rejectButton: {
    flex: 0.9,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  verifyButton: {
    flex: 1.1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  stateCard: {
    flex: 1,
    minHeight: 190,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

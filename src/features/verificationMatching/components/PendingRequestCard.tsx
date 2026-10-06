import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import type { EmergencyRequest } from '../../donor/types/donor';

interface Props {
  request: EmergencyRequest;
  onPress: () => void;
}

function formatRequestAge(request: EmergencyRequest): string | null {
  const createdAt = request.createdAt as
    | { toMillis?: () => number }
    | string
    | null
    | undefined;
  const timestamp = typeof createdAt === 'string'
    ? Date.parse(createdAt)
    : createdAt?.toMillis?.();

  if (!timestamp || Number.isNaN(timestamp)) {
    return null;
  }

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  return `${Math.floor(hours / 24)} days ago`;
}

export default function PendingRequestCard({ request, onPress }: Props) {
  const urgencyStyle = request.urgency === 'critical'
    ? styles.criticalBadge
    : request.urgency === 'urgent'
      ? styles.urgentBadge
      : styles.normalBadge;

  const urgencyTextStyle = request.urgency === 'critical'
    ? styles.criticalText
    : request.urgency === 'urgent'
      ? styles.urgentText
      : styles.normalText;
  const requestAge = formatRequestAge(request);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open pending verification request for ${request.patientName}, ${request.bloodGroup}, ${request.urgency} urgency`}
        accessibilityHint="Request details will be available in the next screen."
        onPress={onPress}
        style={({ pressed }) => [styles.cardContent, pressed && styles.pressed]}
      >
        <View style={styles.header}>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{request.bloodGroup}</Text>
          </View>
          <View style={styles.identity}>
            <Text style={styles.patientName} numberOfLines={1}>
              {request.patientName}
            </Text>
            <Text style={styles.requestId} numberOfLines={1}>
              #{request.id}
            </Text>
          </View>
          <View style={[styles.urgencyBadge, urgencyStyle]}>
            <Text style={[styles.urgencyText, urgencyTextStyle]}>
              {request.urgency}
            </Text>
          </View>
        </View>

        <View style={styles.metadataRow}>
          <View style={styles.metadataPill}>
            <Ionicons name="water-outline" size={11} color={COLORS.primary} />
            <Text style={styles.metadataText}>
              {request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'}
            </Text>
          </View>
          <View style={styles.metadataPill}>
            <Ionicons name="business-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.metadataText} numberOfLines={1}>
              {request.hospitalName}
            </Text>
          </View>
          <View style={styles.metadataPill}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.metadataText} numberOfLines={1}>
              {request.requiredDate}
            </Text>
          </View>
          {requestAge ? (
            <View style={styles.metadataPill}>
              <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.metadataText}>{requestAge}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={styles.detailsButton}
        >
          <Text style={styles.detailsButtonText}>View details</Text>
        </Pressable>
        <View accessibilityLabel="Verification action is not available yet" style={styles.verifyButton}>
          <Text style={styles.verifyButtonText}>Verify</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    padding: 9,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: { opacity: 0.82 },
  cardContent: {
    paddingHorizontal: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bloodBadge: {
    width: 31,
    height: 31,
    flexShrink: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  bloodText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  identity: { flex: 1, minWidth: 0 },
  patientName: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },
  requestId: {
    marginTop: 1,
    color: COLORS.textMuted,
    fontSize: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
  },
  urgencyText: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  criticalBadge: { backgroundColor: '#FCE5E8' },
  criticalText: { color: '#A8071A' },
  urgentBadge: { backgroundColor: '#FFF2DD' },
  urgentText: { color: '#A96800' },
  normalBadge: { backgroundColor: '#E8F7EF' },
  normalText: { color: COLORS.success },
  metadataRow: {
    marginTop: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  metadataPill: {
    maxWidth: '100%',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F8F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metadataText: {
    maxWidth: 145,
    color: COLORS.textSecondary,
    fontSize: 8,
  },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 7,
  },
  detailsButton: {
    flex: 1,
    minHeight: 27,
    borderRadius: 9,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '700',
  },
  verifyButton: {
    flex: 1,
    minHeight: 27,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '700',
  },
});

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
import StatusBadge from '../../donor/components/StatusBadge';

interface Props {
  request: EmergencyRequest;
  onPress: () => void;
}

export default function PendingRequestCard({ request, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open pending verification request for ${request.patientName}, ${request.bloodGroup}, ${request.urgency} urgency`}
      accessibilityHint="Request details will be available in the next screen."
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
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
            Request #{request.id}
          </Text>
        </View>
        <StatusBadge status={request.urgency} />
      </View>

      <View style={styles.hospitalRow}>
        <Ionicons name="business-outline" size={14} color={COLORS.textMuted} />
        <Text style={styles.hospital} numberOfLines={1}>{request.hospitalName}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Ionicons name="water-outline" size={14} color={COLORS.primary} />
          <Text style={styles.detailText}>
            {request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'}
          </Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>{request.requiredDate}</Text>
        </View>
        <View style={styles.pendingStatus}>
          <Ionicons name="time-outline" size={12} color="#A96800" />
          <Text style={styles.pendingText}>Pending verification</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color={COLORS.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 13,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressed: { opacity: 0.82 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  bloodBadge: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  bloodText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  identity: { flex: 1, minWidth: 0 },
  patientName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  requestId: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  hospitalRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hospital: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  detailsRow: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    maxWidth: 94,
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  pendingStatus: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pendingText: {
    color: '#A96800',
    fontSize: 9,
    fontWeight: '600',
  },
});

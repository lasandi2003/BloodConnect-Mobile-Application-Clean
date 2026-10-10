import React from 'react';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export type RequestApprovalDetails = {
  id: string;
  patientName: string;
  bloodGroup: string;
  requiredUnits: number;
  urgency: 'High' | 'Medium' | 'Low';
  hospital: string;

  // Optional details for the approval screen
  date?: string;
  time?: string;
  age?: number;
  gender?: string;
  patientId?: string;
};

type RequestApprovalDetailsScreenProps = {
  request: RequestApprovalDetails;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
};

export default function RequestApprovalDetailsScreen({
  request,
  onBack,
  onApprove,
  onReject,
}: RequestApprovalDetailsScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ========================================
            HEADER
        ======================================== */}

        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={onBack}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#333"
            />
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              Request Approval Details
            </Text>

            <Text style={styles.subtitle}>
              Review and approve blood request
            </Text>
          </View>

        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >

          {/* ========================================
              REQUEST ID + DATE
          ======================================== */}

          <View style={styles.requestTopRow}>

            <View style={styles.requestIdContainer}>

              <View style={styles.bloodIconContainer}>
                <Ionicons
                  name="water"
                  size={18}
                  color="#C8102E"
                />
              </View>

              <Text style={styles.requestId}>
                {request.id}
              </Text>

            </View>

            <View style={styles.dateContainer}>

              <Ionicons
                name="calendar-outline"
                size={14}
                color="#777"
              />

              <Text style={styles.dateText}>
                {request.date ?? '18 Sep 2026'}
              </Text>

              <Text style={styles.dateSeparator}>
                ,
              </Text>

              <Text style={styles.dateText}>
                {request.time ?? '10:30 AM'}
              </Text>

            </View>

          </View>

          {/* ========================================
              STATUS
          ======================================== */}

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              Pending
            </Text>
          </View>

          {/* ========================================
              PATIENT INFORMATION
          ======================================== */}

          <View style={styles.sectionCard}>

            <Text style={styles.sectionTitle}>
              Patient Information
            </Text>

            <View style={styles.infoRow}>

              <View style={styles.avatarContainer}>
                <Ionicons
                  name="person"
                  size={28}
                  color="#D99AA3"
                />
              </View>

              <View style={styles.patientInfo}>

                <InfoRow
                  label="Name"
                  value={request.patientName}
                />

                <InfoRow
                  label="Age"
                  value={
                    request.age
                      ? `${request.age} years`
                      : '32 years'
                  }
                />

                <InfoRow
                  label="Gender"
                  value={
                    request.gender ?? 'Male'
                  }
                />

                <InfoRow
                  label="Patient ID"
                  value={
                    request.patientId ??
                    'P24567'
                  }
                />

              </View>

            </View>

          </View>

          {/* ========================================
              REQUEST INFORMATION
          ======================================== */}

          <View style={styles.sectionCard}>

            <Text style={styles.sectionTitle}>
              Request Information
            </Text>

            {/* Blood Group */}

            <View style={styles.requestInfoRow}>

              <View style={styles.infoIconContainer}>
                <Ionicons
                  name="water-outline"
                  size={19}
                  color="#C8102E"
                />
              </View>

              <View style={styles.requestInfoText}>
                <Text style={styles.infoLabel}>
                  Blood Group
                </Text>

                <Text style={styles.infoValue}>
                  {request.bloodGroup}
                </Text>
              </View>

            </View>

            {/* Required Units */}

            <View style={styles.requestInfoRow}>

              <View style={styles.infoIconContainer}>
                <Ionicons
                  name="cube-outline"
                  size={19}
                  color="#555"
                />
              </View>

              <View style={styles.requestInfoText}>
                <Text style={styles.infoLabel}>
                  Required Units
                </Text>

                <Text style={styles.infoValue}>
                  {request.requiredUnits}
                </Text>
              </View>

            </View>

            {/* Hospital */}

            <View style={styles.requestInfoRow}>

              <View style={styles.infoIconContainer}>
                <Ionicons
                  name="business-outline"
                  size={19}
                  color="#555"
                />
              </View>

              <View style={styles.requestInfoText}>
                <Text style={styles.infoLabel}>
                  Hospital
                </Text>

                <Text style={styles.infoValue}>
                  {request.hospital}
                </Text>
              </View>

            </View>

            {/* Urgency */}

            <View style={styles.requestInfoRow}>

              <View
                style={[
                  styles.infoIconContainer,
                  styles.warningIconContainer,
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={21}
                  color="#E53935"
                />
              </View>

              <View style={styles.requestInfoText}>
                <Text style={styles.infoLabel}>
                  Urgency Level
                </Text>

                <View
                  style={[
                    styles.urgencyBadge,
                    request.urgency === 'High' &&
                      styles.highUrgencyBadge,
                    request.urgency === 'Medium' &&
                      styles.mediumUrgencyBadge,
                    request.urgency === 'Low' &&
                      styles.lowUrgencyBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.urgencyBadgeText,
                      request.urgency === 'High' &&
                        styles.highUrgencyText,
                      request.urgency === 'Medium' &&
                        styles.mediumUrgencyText,
                      request.urgency === 'Low' &&
                        styles.lowUrgencyText,
                    ]}
                  >
                    {request.urgency}
                  </Text>
                </View>
              </View>

            </View>

          </View>

          {/* ========================================
              ACTION BUTTONS
          ======================================== */}

          <View style={styles.actionContainer}>

            <Pressable
              style={styles.rejectButton}
              onPress={onReject}
            >
              <Text style={styles.rejectText}>
                Reject
              </Text>
            </Pressable>

            <Pressable
              style={styles.approveButton}
              onPress={onApprove}
            >
              <Text style={styles.approveText}>
                Approve
              </Text>
            </Pressable>

          </View>

        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

/* ========================================
   INFORMATION ROW
======================================== */

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({
  label,
  value,
}: InfoRowProps) {
  return (
    <View style={styles.patientInfoRow}>

      <Text style={styles.patientLabel}>
        {label}
      </Text>

      <Text style={styles.patientValue}>
        : {value}
      </Text>

    </View>
  );
}

/* ========================================
   STYLES
======================================== */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },

  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202020',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#777',
  },

  /* REQUEST TOP */

  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  requestIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  bloodIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  requestId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },

  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateText: {
    fontSize: 10,
    color: '#777',
    marginLeft: 4,
  },

  dateSeparator: {
    fontSize: 10,
    color: '#777',
  },

  /* STATUS */

  statusBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFF4D6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    marginBottom: 12,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A56A00',
  },

  /* SECTION CARD */

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 13,
  },

  /* PATIENT */

  infoRow: {
    flexDirection: 'row',
  },

  avatarContainer: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#F4DDE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  patientInfo: {
    flex: 1,
  },

  patientInfoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },

  patientLabel: {
    width: 70,
    fontSize: 11,
    color: '#777',
  },

  patientValue: {
    flex: 1,
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },

  /* REQUEST INFORMATION */

  requestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  infoIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  warningIconContainer: {
    backgroundColor: '#FFF0F0',
  },

  requestInfoText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  infoLabel: {
    fontSize: 11,
    color: '#777',
  },

  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },

  /* URGENCY */

  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F1F1',
  },

  urgencyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  highUrgencyBadge: {
    backgroundColor: '#FFF0F0',
  },

  highUrgencyText: {
    color: '#E53935',
  },

  mediumUrgencyBadge: {
    backgroundColor: '#FFF5E5',
  },

  mediumUrgencyText: {
    color: '#D68910',
  },

  lowUrgencyBadge: {
    backgroundColor: '#EDF8EF',
  },

  lowUrgencyText: {
    color: '#2E7D32',
  },

  /* ACTION BUTTONS */

  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },

  rejectButton: {
    flex: 1,
    height: 48,
    borderRadius: 9,
    backgroundColor: '#E9EAED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
  },

  approveButton: {
    flex: 1,
    height: 48,
    borderRadius: 9,
    backgroundColor: '#C8102E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  approveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

});
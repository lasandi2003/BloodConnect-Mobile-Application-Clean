import React, {
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import RequestApprovalDetailsScreen, {
  type RequestApprovalDetails,
} from './RequestApprovalDetailsScreen';

// ========================================
// TYPES
// ========================================

type RequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Completed'
  | 'Rejected';

export type EmergencyRequest =
  RequestApprovalDetails & {
    status: RequestStatus;
  };

type RequestManagementScreenProps = {
  onBack: () => void;
};

// ========================================
// INITIAL REQUEST DATA
// ========================================
//
// This is temporary local data.
//
// Later we will replace this with
// Firestore data.
//

const INITIAL_REQUESTS: EmergencyRequest[] = [
  {
    id: 'R 001',
    patientName: 'Kasun Perera',
    bloodGroup: 'O+',
    requiredUnits: 3,
    urgency: 'High',
    hospital: 'National Hospital',
    status: 'Pending',

    date: '18 Sep 2026',
    time: '10:30 AM',

    age: 32,
    gender: 'Male',
    patientId: 'P24567',
  },

  {
    id: 'R 002',
    patientName: 'Nimal Silva',
    bloodGroup: 'A-',
    requiredUnits: 2,
    urgency: 'Medium',
    hospital: 'City Hospital',
    status: 'Pending',

    date: '18 Sep 2026',
    time: '11:15 AM',

    age: 45,
    gender: 'Male',
    patientId: 'P24568',
  },

  {
    id: 'R 003',
    patientName: 'Amal Fernando',
    bloodGroup: 'B+',
    requiredUnits: 4,
    urgency: 'Low',
    hospital: 'General Hospital',
    status: 'Approved',

    date: '17 Sep 2026',
    time: '09:20 AM',

    age: 29,
    gender: 'Male',
    patientId: 'P24569',
  },
];

// ========================================
// SCREEN
// ========================================

export default function RequestManagementScreen({
  onBack,
}: RequestManagementScreenProps) {

  // ======================================
  // REQUESTS STATE
  // ======================================

  const [requests, setRequests] =
    useState<EmergencyRequest[]>(
      INITIAL_REQUESTS,
    );

  // ======================================
  // STATUS FILTER
  // ======================================

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState<RequestStatus>(
    'Pending',
  );

  // ======================================
  // SEARCH
  // ======================================

  const [
    search,
    setSearch,
  ] = useState('');

  // ======================================
  // SELECTED REQUEST
  // ======================================

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<EmergencyRequest | null>(
    null,
  );

  // ======================================
  // REAL-TIME LOCAL COUNTS
  // ======================================

  const pendingCount = useMemo(
    () =>
      requests.filter(
        request =>
          request.status === 'Pending',
      ).length,
    [requests],
  );

  const approvedCount = useMemo(
    () =>
      requests.filter(
        request =>
          request.status === 'Approved',
      ).length,
    [requests],
  );

  const completedCount = useMemo(
    () =>
      requests.filter(
        request =>
          request.status === 'Completed',
      ).length,
    [requests],
  );

  // ======================================
  // FILTER REQUESTS
  // ======================================

  const filteredRequests = useMemo(() => {

    const searchText =
      search
        .trim()
        .toLowerCase();

    return requests.filter(
      request => {

        // -------------------------------
        // STATUS FILTER
        // -------------------------------

        const matchesStatus =
          request.status ===
          selectedStatus;

        if (!matchesStatus) {
          return false;
        }

        // -------------------------------
        // SEARCH FILTER
        // -------------------------------

        if (!searchText) {
          return true;
        }

        return (
          request.id
            .toLowerCase()
            .includes(searchText) ||

          request.patientName
            .toLowerCase()
            .includes(searchText) ||

          request.bloodGroup
            .toLowerCase()
            .includes(searchText) ||

          request.hospital
            .toLowerCase()
            .includes(searchText)
        );
      },
    );

  }, [
    requests,
    search,
    selectedStatus,
  ]);

  // ========================================
  // VIEW DETAILS
  // ========================================

  function handleViewDetails(
    request: EmergencyRequest,
  ) {
    console.log(
      'Opening request details:',
      request.id,
    );

    setSelectedRequest(
      request,
    );
  }

  // ========================================
  // APPROVE REQUEST
  // ========================================

  function handleApprove() {

    if (!selectedRequest) {
      return;
    }

    const requestId =
      selectedRequest.id;

    console.log(
      'Approve request:',
      requestId,
    );

    // --------------------------------------
    // UPDATE REQUEST STATUS
    // --------------------------------------

    setRequests(
      previousRequests =>
        previousRequests.map(
          request =>
            request.id === requestId
              ? {
                  ...request,
                  status: 'Approved',
                }
              : request,
        ),
    );

    // --------------------------------------
    // CLOSE DETAILS SCREEN
    // --------------------------------------

    setSelectedRequest(null);

    // --------------------------------------
    // OPTIONAL MESSAGE
    // --------------------------------------

    Alert.alert(
      'Request Approved',
      `${requestId} has been approved successfully.`,
    );
  }

  // ========================================
  // REJECT REQUEST
  // ========================================

  function handleReject() {

    if (!selectedRequest) {
      return;
    }

    const requestId =
      selectedRequest.id;

    console.log(
      'Reject request:',
      requestId,
    );

    // --------------------------------------
    // UPDATE REQUEST STATUS
    // --------------------------------------

    setRequests(
      previousRequests =>
        previousRequests.map(
          request =>
            request.id === requestId
              ? {
                  ...request,
                  status: 'Rejected',
                }
              : request,
        ),
    );

    // --------------------------------------
    // CLOSE DETAILS SCREEN
    // --------------------------------------

    setSelectedRequest(null);

    // --------------------------------------
    // OPTIONAL MESSAGE
    // --------------------------------------

    Alert.alert(
      'Request Rejected',
      `${requestId} has been rejected.`,
    );
  }

  // ========================================
  // DETAILS SCREEN
  // ========================================

  if (selectedRequest) {

    return (
      <RequestApprovalDetailsScreen
        request={
          selectedRequest
        }

        onBack={() => {
          setSelectedRequest(
            null,
          );
        }}

        onApprove={
          handleApprove
        }

        onReject={
          handleReject
        }
      />
    );
  }

  // ========================================
  // REQUEST CARD
  // ========================================

  function renderRequest({
    item,
  }: {
    item: EmergencyRequest;
  }) {

    return (
      <View
        style={
          styles.requestCard
        }
      >

        {/* ==============================
            REQUEST HEADER
        =============================== */}

        <View
          style={
            styles.requestHeader
          }
        >

          <View
            style={
              styles.requestIdRow
            }
          >

            <Ionicons
              name="water-outline"
              size={15}
              color="#C8102E"
            />

            <Text
              style={
                styles.requestId
              }
            >
              {item.id}
            </Text>

          </View>

          <Text
            style={
              styles.patientName
            }
          >
            {item.patientName}
          </Text>

        </View>

        {/* ==============================
            REQUEST DETAILS
        =============================== */}

        <View
          style={
            styles.detailsRow
          }
        >

          {/* BLOOD GROUP */}

          <View
            style={
              styles.detailColumn
            }
          >

            <Text
              style={
                styles.detailLabel
              }
            >
              Blood group
            </Text>

            <Text
              style={
                styles.detailValue
              }
            >
              {item.bloodGroup}
            </Text>

          </View>

          {/* REQUIRED UNITS */}

          <View
            style={
              styles.detailColumn
            }
          >

            <Text
              style={
                styles.detailLabel
              }
            >
              Required
            </Text>

            <Text
              style={
                styles.detailValue
              }
            >
              {item.requiredUnits} units
            </Text>

          </View>

          {/* URGENCY */}

          <View
            style={
              styles.detailColumn
            }
          >

            <Text
              style={
                styles.detailLabel
              }
            >
              Urgency
            </Text>

            <Text
              style={[
                styles.urgencyText,

                item.urgency ===
                  'High' &&
                  styles.highUrgency,

                item.urgency ===
                  'Medium' &&
                  styles.mediumUrgency,

                item.urgency ===
                  'Low' &&
                  styles.lowUrgency,
              ]}
            >
              {item.urgency}
            </Text>

          </View>

        </View>

        {/* ==============================
            HOSPITAL
        =============================== */}

        <View
          style={
            styles.hospitalRow
          }
        >

          <Ionicons
            name="business-outline"
            size={16}
            color="#555"
          />

          <Text
            style={
              styles.hospitalText
            }
          >
            {item.hospital}
          </Text>

        </View>

        {/* ==============================
            BUTTONS
        =============================== */}

        <View
          style={
            styles.actionRow
          }
        >

          {/* VIEW DETAILS */}

          <Pressable
            style={
              styles.viewDetailsButton
            }
            onPress={() =>
              handleViewDetails(
                item,
              )
            }
          >

            <Text
              style={
                styles.viewDetailsText
              }
            >
              View Details
            </Text>

          </Pressable>

          {/* APPROVE */}

          {item.status ===
            'Pending' && (

            <Pressable
              style={
                styles.approveButton
              }
              onPress={() =>
                handleViewDetails(
                  item,
                )
              }
            >

              <Text
                style={
                  styles.approveText
                }
              >
                Approve
              </Text>

            </Pressable>

          )}

        </View>

      </View>
    );
  }

  // ========================================
  // MANAGEMENT SCREEN
  // ========================================

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >

      <View
        style={
          styles.container
        }
      >

        {/* ==============================
            HEADER
        =============================== */}

        <View
          style={
            styles.header
          }
        >

          <Pressable
            style={
              styles.backButton
            }
            onPress={
              onBack
            }
          >

            <Ionicons
              name="arrow-back"
              size={22}
              color="#333"
            />

          </Pressable>

          <View>

            <Text
              style={
                styles.title
              }
            >
              Request Management
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Manage emergency blood requests
            </Text>

          </View>

        </View>

        {/* ==============================
            STATUS FILTERS
        =============================== */}

        <View
          style={
            styles.statusContainer
          }
        >

          {/* PENDING */}

          <StatusCard
            title="Pending"
            count={
              pendingCount
            }
            icon="time-outline"
            selected={
              selectedStatus ===
              'Pending'
            }
            onPress={() =>
              setSelectedStatus(
                'Pending',
              )
            }
          />

          {/* APPROVED */}

          <StatusCard
            title="Approved"
            count={
              approvedCount
            }
            icon="checkmark-circle-outline"
            selected={
              selectedStatus ===
              'Approved'
            }
            onPress={() =>
              setSelectedStatus(
                'Approved',
              )
            }
          />

          {/* COMPLETED */}

          <StatusCard
            title="Completed"
            count={
              completedCount
            }
            icon="document-text-outline"
            selected={
              selectedStatus ===
              'Completed'
            }
            onPress={() =>
              setSelectedStatus(
                'Completed',
              )
            }
          />

        </View>

        {/* ==============================
            SEARCH
        =============================== */}

        <View
          style={
            styles.searchContainer
          }
        >

          <Ionicons
            name="search-outline"
            size={19}
            color="#777"
          />

          <TextInput
            value={search}
            onChangeText={
              setSearch
            }
            placeholder="Search Requests..."
            placeholderTextColor="#777"
            style={
              styles.searchInput
            }
          />

        </View>

        {/* ==============================
            REQUEST LIST
        =============================== */}

        <FlatList
          data={
            filteredRequests
          }
          keyExtractor={
            item => item.id
          }
          renderItem={
            renderRequest
          }
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={
            false
          }
          ListEmptyComponent={
            <View
              style={
                styles.emptyContainer
              }
            >

              <Ionicons
                name="document-outline"
                size={42}
                color="#CCC"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                No requests found
              </Text>

            </View>
          }
        />

      </View>

    </SafeAreaView>
  );
}

// ========================================
// STATUS CARD
// ========================================

type StatusCardProps = {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

function StatusCard({
  title,
  count,
  icon,
  selected,
  onPress,
}: StatusCardProps) {

  return (
    <Pressable
      onPress={
        onPress
      }
      style={[
        styles.statusCard,

        selected &&
          styles.statusCardSelected,
      ]}
    >

      <View
        style={[
          styles.statusIconContainer,

          selected &&
            styles.statusIconContainerSelected,
        ]}
      >

        <Ionicons
          name={icon}
          size={20}
          color={
            selected
              ? '#FFFFFF'
              : '#555'
          }
        />

      </View>

      <Text
        style={[
          styles.statusTitle,

          selected &&
            styles.statusTitleSelected,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.statusCount,

          selected &&
            styles.statusCountSelected,
        ]}
      >
        {count}
      </Text>

    </Pressable>
  );
}

// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({

    safeArea: {
      flex: 1,
      backgroundColor:
        '#F8F9FB',
    },

    container: {
      flex: 1,
      paddingHorizontal: 18,
    },

    // ====================================
    // HEADER
    // ====================================

    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingTop: 12,
      paddingBottom: 18,
    },

    backButton: {
      width: 38,
      height: 38,
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 8,
    },

    title: {
      fontSize: 22,
      fontWeight: '700',
      color: '#202020',
    },

    subtitle: {
      fontSize: 12,
      color: '#777',
      marginTop: 3,
    },

    // ====================================
    // STATUS CARDS
    // ====================================

    statusContainer: {
      flexDirection:
        'row',
      gap: 10,
      marginBottom: 14,
    },

    statusCard: {
      flex: 1,
      minHeight: 82,
      borderWidth: 1,
      borderColor: '#E4E4E4',
      borderRadius: 10,
      backgroundColor:
        '#FFFFFF',
      padding: 9,
      justifyContent:
        'center',
    },

    statusCardSelected: {
      borderColor:
        '#C8102E',
      backgroundColor:
        '#FFF5F6',
    },

    statusIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor:
        '#F0F0F0',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginBottom: 5,
    },

    statusIconContainerSelected: {
      backgroundColor:
        '#C8102E',
    },

    statusTitle: {
      fontSize: 11,
      color: '#666',
      fontWeight: '600',
    },

    statusTitleSelected: {
      color: '#C8102E',
    },

    statusCount: {
      position:
        'absolute',
      right: 9,
      top: 10,
      fontSize: 18,
      fontWeight: '700',
      color: '#333',
    },

    statusCountSelected: {
      color: '#C8102E',
    },

    // ====================================
    // SEARCH
    // ====================================

    searchContainer: {
      height: 44,
      borderRadius: 10,
      backgroundColor:
        '#E9EAED',
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 13,
      marginBottom: 14,
    },

    searchInput: {
      flex: 1,
      fontSize: 13,
      color: '#222',
      marginLeft: 8,
    },

    // ====================================
    // LIST
    // ====================================

    listContent: {
      paddingBottom: 30,
    },

    requestCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        '#EEEEEE',
    },

    // ====================================
    // REQUEST HEADER
    // ====================================

    requestHeader: {
      marginBottom: 12,
    },

    requestIdRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 3,
    },

    requestId: {
      marginLeft: 5,
      fontSize: 14,
      fontWeight: '700',
      color: '#333',
    },

    patientName: {
      fontSize: 12,
      color: '#555',
    },

    // ====================================
    // DETAILS
    // ====================================

    detailsRow: {
      flexDirection:
        'row',
      marginBottom: 13,
    },

    detailColumn: {
      flex: 1,
    },

    detailLabel: {
      fontSize: 10,
      color: '#888',
      marginBottom: 3,
    },

    detailValue: {
      fontSize: 13,
      color: '#333',
      fontWeight: '600',
    },

    // ====================================
    // URGENCY
    // ====================================

    urgencyText: {
      fontSize: 12,
      fontWeight: '700',
    },

    highUrgency: {
      color: '#E53935',
    },

    mediumUrgency: {
      color: '#F39C12',
    },

    lowUrgency: {
      color: '#4CAF50',
    },

    // ====================================
    // HOSPITAL
    // ====================================

    hospitalRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 14,
    },

    hospitalText: {
      fontSize: 12,
      color: '#555',
      marginLeft: 7,
    },

    // ====================================
    // ACTION BUTTONS
    // ====================================

    actionRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    viewDetailsButton: {
      paddingVertical: 7,
      paddingHorizontal: 11,
      borderRadius: 6,
      backgroundColor:
        '#FFF0F2',
    },

    viewDetailsText: {
      fontSize: 11,
      color: '#C8102E',
      fontWeight: '700',
    },

    approveButton: {
      paddingVertical: 8,
      paddingHorizontal: 17,
      borderRadius: 7,
      backgroundColor:
        '#C8102E',
    },

    approveText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },

    // ====================================
    // EMPTY STATE
    // ====================================

    emptyContainer: {
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingTop: 70,
    },

    emptyText: {
      marginTop: 10,
      fontSize: 14,
      color: '#888',
    },
  });
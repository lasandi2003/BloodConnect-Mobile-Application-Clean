import React, { useEffect, useState } from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  getBloodInventory,
  deleteBloodStock,
} from '../services/bloodInventoryService';

import { COLORS } from '../../../constants/colors';

import { useAuth } from '../../auth/context/AuthContext';

import UpdateStockScreen from './UpdateStockScreen';
import AddStockScreen from './AddStockScreen';
import RequestManagementScreen from '../../bloodBankRequests/screens/RequestManagementScreen';
import InventoryReportsScreen from './InventoryReportsScreen';

type BloodInventoryItem = {
  id: string;
  bloodGroup: string;
  availableUnits: number;
  status: string;
};

export default function BloodBankDashboardScreen() {
  // =====================================================
  // AUTH
  // =====================================================

  const { logout } = useAuth();

  // =====================================================
  // STATES
  // =====================================================

  const [inventory, setInventory] =
    useState<BloodInventoryItem[]>([]);

  const [showInventory, setShowInventory] =
    useState(false);

  const [showUpdateStock, setShowUpdateStock] =
    useState(false);

  const [showAddStock, setShowAddStock] =
    useState(false);

  const [showRequestManagement, setShowRequestManagement] =
    useState(false);

  const [showInventoryReports, setShowInventoryReports] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const data = await getBloodInventory();

      setInventory(data as BloodInventoryItem[]);

      console.log(
        'Blood inventory loaded:',
        data
      );
    } catch (error) {
      console.error(
        'Failed to load blood inventory:',
        error
      );

      if (
        typeof window !== 'undefined' &&
        window.alert
      ) {
        window.alert(
          'Failed to load blood inventory.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to load blood inventory.'
        );
      }
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error(
          'Logout failed:',
          error
        );

        if (
          typeof window !== 'undefined' &&
          window.alert
        ) {
          window.alert(
            'Logout failed. Please try again.'
          );
        } else {
          Alert.alert(
            'Logout Failed',
            'Please try again.'
          );
        }
      }
    };

    if (
      typeof window !== 'undefined' &&
      window.confirm
    ) {
      const confirmed = window.confirm(
        'Are you sure you want to logout?'
      );

      if (confirmed) {
        await performLogout();
      }

      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  }

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const totalUnits =
    inventory.reduce(
      (total, item) =>
        total + Number(item.availableUnits || 0),
      0
    );

  const bloodGroupCount =
    inventory.length;

  // =====================================================
  // DELETE STOCK
  // =====================================================

  function confirmDelete(
    item: BloodInventoryItem
  ) {
    if (
      typeof window !== 'undefined' &&
      window.confirm
    ) {
      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${item.bloodGroup} from the inventory?`
        );

      if (confirmed) {
        handleDelete(item.id);
      }

      return;
    }

    Alert.alert(
      'Delete Blood Stock',
      `Are you sure you want to delete ${item.bloodGroup} from the inventory?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            handleDelete(item.id);
          },
        },
      ]
    );
  }

  async function handleDelete(
    id: string
  ) {
    try {
      setDeletingId(id);

      await deleteBloodStock(id);

      setInventory(
        currentInventory =>
          currentInventory.filter(
            item => item.id !== id
          )
      );

      await loadInventory();

      if (
        typeof window !== 'undefined' &&
        window.alert
      ) {
        window.alert(
          'Blood stock deleted successfully.'
        );
      } else {
        Alert.alert(
          'Success',
          'Blood stock deleted successfully.'
        );
      }
    } catch (error) {
      console.error(
        'DELETE ERROR:',
        error
      );

      if (
        typeof window !== 'undefined' &&
        window.alert
      ) {
        window.alert(
          'Delete failed. Check the browser console for the error.'
        );
      } else {
        Alert.alert(
          'Delete Failed',
          'Delete failed. Check the console for the error.'
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  // =====================================================
  // ADD STOCK SCREEN
  // =====================================================

  if (showAddStock) {
    return (
      <AddStockScreen
        onBack={() => {
          setShowAddStock(false);
          loadInventory();
        }}
      />
    );
  }

  // =====================================================
  // UPDATE STOCK SCREEN
  // =====================================================

  if (showUpdateStock) {
    return (
      <UpdateStockScreen
        onBack={() => {
          setShowUpdateStock(false);
          loadInventory();
        }}
      />
    );
  }

  // =====================================================
  // EMERGENCY REQUEST SCREEN
  // =====================================================

  if (showRequestManagement) {
    return (
      <RequestManagementScreen
        onBack={() => {
          setShowRequestManagement(false);
        }}
      />
    );
  }

  // =====================================================
  // INVENTORY REPORTS SCREEN
  // =====================================================

  if (showInventoryReports) {
    return (
      <InventoryReportsScreen
        onBack={() => {
          setShowInventoryReports(false);
        }}
      />
    );
  }

  // =====================================================
  // BLOOD INVENTORY SCREEN
  // =====================================================

  if (showInventory) {
    return (
      <View style={styles.inventoryContainer}>

        {/* HEADER */}

        <View style={styles.inventoryHeader}>

          <Pressable
            style={styles.backButton}
            onPress={() => {
              setShowInventory(false);
            }}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
            />
          </Pressable>

          <View style={styles.headerText}>

            <Text style={styles.inventoryTitle}>
              Blood Inventory
            </Text>

            <Text style={styles.inventorySubtitle}>
              View and manage available stocks
            </Text>

          </View>

        </View>

        {/* SUMMARY */}

        <View style={styles.summaryCard}>

          <View style={styles.summaryItem}>

            <Ionicons
              name="water-outline"
              size={22}
              color={COLORS.primary}
            />

            <View>

              <Text style={styles.summaryNumber}>
                {bloodGroupCount}
              </Text>

              <Text style={styles.summaryText}>
                Blood Groups
              </Text>

            </View>

          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>

            <Ionicons
              name="cube-outline"
              size={22}
              color={COLORS.primary}
            />

            <View>

              <Text style={styles.summaryNumber}>
                {totalUnits}
              </Text>

              <Text style={styles.summaryText}>
                Total Units
              </Text>

            </View>

          </View>

        </View>

        {/* INVENTORY */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.inventoryList
          }
        >

          <View style={styles.tableHeader}>

            <View style={styles.groupColumn}>
              <Text style={styles.tableHeaderText}>
                Blood
              </Text>
              <Text style={styles.tableHeaderText}>
                Group
              </Text>
            </View>

            <View style={styles.unitsColumn}>
              <Text style={styles.tableHeaderText}>
                Available
              </Text>
              <Text style={styles.tableHeaderText}>
                Units
              </Text>
            </View>

            <View style={styles.statusColumn}>
              <Text style={styles.tableHeaderText}>
                Status
              </Text>
            </View>

            <View style={styles.actionColumn}>
              <Text style={styles.tableHeaderText}>
                Action
              </Text>
            </View>

          </View>

          {inventory.map(item => (

            <View
              key={item.id}
              style={styles.inventoryRow}
            >

              <View style={styles.groupColumn}>

                <Text style={styles.bloodGroup}>
                  {item.bloodGroup}
                </Text>

              </View>

              <View style={styles.unitsColumn}>

                <Text style={styles.unitsText}>
                  {item.availableUnits}
                </Text>

              </View>

              <View style={styles.statusColumn}>

                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Low Stock'
                      ? styles.lowStock
                      : styles.normalStock,
                  ]}
                >

                  <Text style={styles.statusText}>
                    {item.status}
                  </Text>

                </View>

              </View>

              <View style={styles.actionColumn}>

                <Pressable
                  style={styles.updateButton}
                  onPress={() => {
                    setShowUpdateStock(true);
                  }}
                >

                  <Text
                    style={
                      styles.updateButtonText
                    }
                  >
                    Update
                  </Text>

                </Pressable>

                <Pressable
                  style={[
                    styles.deleteButton,
                    deletingId === item.id &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    deletingId === item.id
                  }
                  onPress={() => {
                    confirmDelete(item);
                  }}
                >

                  <Text
                    style={
                      styles.deleteButtonText
                    }
                  >
                    {deletingId === item.id
                      ? '...'
                      : 'Delete'}
                  </Text>

                </Pressable>

              </View>

            </View>

          ))}

          <Pressable
            style={styles.addStockButton}
            onPress={() => {
              setShowAddStock(true);
            }}
          >

            <Ionicons
              name="add"
              size={19}
              color={COLORS.white}
            />

            <Text
              style={
                styles.addStockButtonText
              }
            >
              Add New Stock
            </Text>

          </Pressable>

        </ScrollView>

      </View>
    );
  }

  // =====================================================
  // MAIN DASHBOARD
  // =====================================================

  return (
    <View style={styles.dashboardContainer}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.dashboardContent
        }
      >

        {/* =================================================
            HEADER WITH LOGOUT
        ================================================= */}

        <View style={styles.topHeader}>

          <View>

            <Text style={styles.smallWelcome}>
              Welcome back,
            </Text>

            <Text style={styles.adminName}>
              Biguni Gunawardhana
            </Text>

          </View>

          {/* LOGOUT BUTTON */}

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >

            <Ionicons
              name="log-out-outline"
              size={21}
              color={COLORS.primary}
            />

          </Pressable>

        </View>

        {/* =================================================
            WELCOME CARD
        ================================================= */}

        <View style={styles.welcomeCard}>

          <View style={styles.welcomeIconBox}>

            <Ionicons
              name="water"
              size={26}
              color="#FFFFFF"
            />

          </View>

          <View style={styles.welcomeText}>

            <Text style={styles.welcomeTitle}>
              Blood Bank Dashboard
            </Text>

            <Text style={styles.welcomeSubtitle}>
              Manage blood inventory and
              emergency requests.
            </Text>

          </View>

        </View>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Text style={styles.sectionTitle}>
          Dashboard
        </Text>

        <View style={styles.dashboardGrid}>

          {/* BLOOD INVENTORY */}

          <Pressable
            style={[
              styles.dashboardCard,
              styles.inventoryCard,
            ]}
            onPress={() => {
              setShowInventory(true);
            }}
          >

            <View
              style={[
                styles.cardIcon,
                styles.inventoryIcon,
              ]}
            >

              <Ionicons
                name="water-outline"
                size={27}
                color="#DC1733"
              />

            </View>

            <Text style={styles.cardTitle}>
              Blood Inventory
            </Text>

            <Text style={styles.cardDescription}>
              {bloodGroupCount} blood groups
            </Text>

            <Text style={styles.cardValue}>
              {totalUnits} units available
            </Text>

            <View style={styles.cardBottom}>

              <Text
                style={[
                  styles.cardAction,
                  styles.redAction,
                ]}
              >
                View Inventory
              </Text>

              <View
                style={[
                  styles.arrowCircle,
                  styles.redArrow,
                ]}
              >

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#FFFFFF"
                />

              </View>

            </View>

          </Pressable>

          {/* UPDATE STOCK */}

          <Pressable
            style={[
              styles.dashboardCard,
              styles.updateCard,
            ]}
            onPress={() => {
              setShowUpdateStock(true);
            }}
          >

            <View
              style={[
                styles.cardIcon,
                styles.updateIcon,
              ]}
            >

              <Ionicons
                name="create-outline"
                size={27}
                color="#2563EB"
              />

            </View>

            <Text style={styles.cardTitle}>
              Update Stock
            </Text>

            <Text style={styles.cardDescription}>
              Add or update
            </Text>

            <Text style={styles.cardValue}>
              Blood quantities
            </Text>

            <View style={styles.cardBottom}>

              <Text
                style={[
                  styles.cardAction,
                  styles.blueAction,
                ]}
              >
                Manage Stock
              </Text>

              <View
                style={[
                  styles.arrowCircle,
                  styles.blueArrow,
                ]}
              >

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#FFFFFF"
                />

              </View>

            </View>

          </Pressable>

          {/* EMERGENCY REQUESTS */}

          <Pressable
            style={[
              styles.dashboardCard,
              styles.requestCard,
            ]}
            onPress={() => {
              setShowRequestManagement(true);
            }}
          >

            <View
              style={[
                styles.cardIcon,
                styles.requestIcon,
              ]}
            >

              <Ionicons
                name="alert-outline"
                size={28}
                color="#EA580C"
              />

            </View>

            <Text style={styles.cardTitle}>
              Emergency Requests
            </Text>

            <Text style={styles.cardDescription}>
              Review and manage
            </Text>

            <Text style={styles.cardValue}>
              Blood requests
            </Text>

            <View style={styles.cardBottom}>

              <Text
                style={[
                  styles.cardAction,
                  styles.orangeAction,
                ]}
              >
                View Requests
              </Text>

              <View
                style={[
                  styles.arrowCircle,
                  styles.orangeArrow,
                ]}
              >

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#FFFFFF"
                />

              </View>

            </View>

          </Pressable>

          {/* INVENTORY REPORTS */}

          <Pressable
            style={[
              styles.dashboardCard,
              styles.reportCard,
            ]}
            onPress={() => {
              setShowInventoryReports(true);
            }}
          >

            <View
              style={[
                styles.cardIcon,
                styles.reportIcon,
              ]}
            >

              <Ionicons
                name="bar-chart-outline"
                size={27}
                color="#7C3AED"
              />

            </View>

            <Text style={styles.cardTitle}>
              Inventory Reports
            </Text>

            <Text style={styles.cardDescription}>
              View blood availability
            </Text>

            <Text style={styles.cardValue}>
              Inventory reports
            </Text>

            <View style={styles.cardBottom}>

              <Text
                style={[
                  styles.cardAction,
                  styles.purpleAction,
                ]}
              >
                View Reports
              </Text>

              <View
                style={[
                  styles.arrowCircle,
                  styles.purpleArrow,
                ]}
              >

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#FFFFFF"
                />

              </View>

            </View>

          </Pressable>

        </View>

        {/* =================================================
            BLOOD BANK SUMMARY
        ================================================= */}

        <Text style={styles.sectionTitle}>
          Blood Bank Summary
        </Text>

        <View style={styles.summaryDashboardCard}>

          <View style={styles.summaryDashboardItem}>

            <View
              style={[
                styles.summaryDashboardIcon,
                {
                  backgroundColor: '#FFE5E8',
                },
              ]}
            >

              <Ionicons
                name="water"
                size={19}
                color={COLORS.primary}
              />

            </View>

            <View>

              <Text
                style={
                  styles.summaryDashboardNumber
                }
              >
                {totalUnits}
              </Text>

              <Text
                style={
                  styles.summaryDashboardLabel
                }
              >
                Total Units
              </Text>

            </View>

          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryDashboardItem}>

            <View
              style={[
                styles.summaryDashboardIcon,
                {
                  backgroundColor: '#E8F0FF',
                },
              ]}
            >

              <Ionicons
                name="layers-outline"
                size={19}
                color="#2563EB"
              />

            </View>

            <View>

              <Text
                style={
                  styles.summaryDashboardNumber
                }
              >
                {bloodGroupCount}
              </Text>

              <Text
                style={
                  styles.summaryDashboardLabel
                }
              >
                Blood Groups
              </Text>

            </View>

          </View>

        </View>

        <View style={{ height: 25 }} />

      </ScrollView>

      {/* =================================================
          IMPORTANT:
          NO FOOTER HERE.
          
          The main navigation/root navigation should
          provide the single bottom navigation.
      ================================================= */}

    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({

  dashboardContainer: {
    flex: 1,
    backgroundColor: '#FFF9FA',
  },

  dashboardContent: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 20,
  },

  // =====================================================
  // HEADER
  // =====================================================

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  smallWelcome: {
    fontSize: 11,
    color: '#777777',
    marginBottom: 2,
  },

  adminName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#202020',
  },

  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFE3E7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // =====================================================
  // WELCOME CARD
  // =====================================================

  welcomeCard: {
    minHeight: 105,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 17,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 21,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },

  welcomeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  welcomeText: {
    flex: 1,
  },

  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 5,
  },

  welcomeSubtitle: {
    color: '#FFECEF',
    fontSize: 10.5,
    lineHeight: 15,
  },

  // =====================================================
  // SECTION
  // =====================================================

  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#222222',
    marginBottom: 11,
  },

  // =====================================================
  // DASHBOARD GRID
  // =====================================================

  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 21,
  },

  dashboardCard: {
    width: '48.2%',
    minHeight: 190,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  inventoryCard: {
    borderColor: '#FFD2D8',
    backgroundColor: '#FFF8F9',
  },

  updateCard: {
    borderColor: '#D5E3FF',
    backgroundColor: '#F8FAFF',
  },

  requestCard: {
    borderColor: '#FFE0C7',
    backgroundColor: '#FFFAF6',
  },

  reportCard: {
    borderColor: '#E5D9FF',
    backgroundColor: '#FBF9FF',
  },

  // =====================================================
  // ICONS
  // =====================================================

  cardIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  inventoryIcon: {
    backgroundColor: '#FFE1E6',
  },

  updateIcon: {
    backgroundColor: '#E4EDFF',
  },

  requestIcon: {
    backgroundColor: '#FFE9D7',
  },

  reportIcon: {
    backgroundColor: '#EEE6FF',
  },

  // =====================================================
  // CARD TEXT
  // =====================================================

  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#222222',
    lineHeight: 18,
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 9.5,
    color: '#777777',
    lineHeight: 14,
  },

  cardValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555555',
    lineHeight: 14,
  },

  cardBottom: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },

  cardAction: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  redAction: {
    color: '#DC1733',
  },

  blueAction: {
    color: '#2563EB',
  },

  orangeAction: {
    color: '#EA580C',
  },

  purpleAction: {
    color: '#7C3AED',
  },

  arrowCircle: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  redArrow: {
    backgroundColor: '#DC1733',
  },

  blueArrow: {
    backgroundColor: '#2563EB',
  },

  orangeArrow: {
    backgroundColor: '#EA580C',
  },

  purpleArrow: {
    backgroundColor: '#7C3AED',
  },

  // =====================================================
  // SUMMARY
  // =====================================================

  summaryDashboardCard: {
    minHeight: 82,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  summaryDashboardItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  summaryDashboardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryDashboardNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#222222',
  },

  summaryDashboardLabel: {
    fontSize: 9,
    color: '#777777',
    marginTop: 2,
  },

  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#E7E7E7',
  },

  // =====================================================
  // INVENTORY SCREEN
  // =====================================================

  inventoryContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  inventoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },

  inventorySubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  summaryCard: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FFF1F1',
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  summaryNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  summaryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  inventoryList: {
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 30,
  },

  tableHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tableHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 12,
  },

  inventoryRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  groupColumn: {
    width: '18%',
    paddingLeft: 6,
    justifyContent: 'center',
  },

  unitsColumn: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusColumn: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionColumn: {
    width: '37%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bloodGroup: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  unitsText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
    minWidth: 54,
    alignItems: 'center',
  },

  normalStock: {
    backgroundColor: '#E5F7ED',
  },

  lowStock: {
    backgroundColor: '#FFF0E5',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  updateButton: {
    minWidth: 58,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  updateButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },

  deleteButton: {
    minWidth: 58,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D32F2F',
  },

  disabledButton: {
    opacity: 0.5,
  },

  addStockButton: {
    height: 48,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  addStockButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
});
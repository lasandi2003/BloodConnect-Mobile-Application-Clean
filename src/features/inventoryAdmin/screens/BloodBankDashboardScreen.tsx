import React, {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import RoleDashboard from '../../../components/RoleDashboard';

import {
  getBloodInventory,
  deleteBloodStock,
} from '../services/bloodInventoryService';

import { COLORS } from '../../../constants/colors';

import UpdateStockScreen from './UpdateStockScreen';
import AddStockScreen from './AddStockScreen';

// ========================================
// TYPE
// ========================================

type BloodInventoryItem = {
  id: string;
  bloodGroup: string;
  availableUnits: number;
  status: string;
};

// ========================================
// COMPONENT
// ========================================

export default function BloodBankDashboardScreen() {
  const [inventory, setInventory] =
    useState<BloodInventoryItem[]>([]);

  const [showInventory, setShowInventory] =
    useState(false);

  const [showUpdateStock, setShowUpdateStock] =
    useState(false);

  const [showAddStock, setShowAddStock] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // ========================================
  // LOAD INVENTORY
  // ========================================

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const data = await getBloodInventory();

      setInventory(
        data as BloodInventoryItem[]
      );

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
        typeof window !== 'undefined'
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

  // ========================================
  // TOTAL UNITS
  // ========================================

  const totalUnits =
    inventory.reduce(
      (total, item) =>
        total + item.availableUnits,
      0
    );

  // ========================================
  // DELETE CONFIRMATION
  // ========================================

  function confirmDelete(
    item: BloodInventoryItem
  ) {
    console.log(
      'CONFIRM DELETE:',
      item.id,
      item.bloodGroup
    );

    /*
     * WEB
     */

    if (
      typeof window !== 'undefined'
    ) {
      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${item.bloodGroup} from the inventory?`
        );

      console.log(
        'Delete confirmation result:',
        confirmed
      );

      if (confirmed) {
        handleDelete(item.id);
      }

      return;
    }

    /*
     * MOBILE
     */

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

  // ========================================
  // DELETE BLOOD STOCK
  // ========================================

  async function handleDelete(
    id: string
  ) {
    console.log(
      'HANDLE DELETE STARTED:',
      id
    );

    try {
      setDeletingId(id);

      console.log(
        'Calling Firebase delete...'
      );

      await deleteBloodStock(id);

      console.log(
        'Firebase delete successful:',
        id
      );

      /*
       * Remove from screen immediately
       */

      setInventory(
        currentInventory =>
          currentInventory.filter(
            item => item.id !== id
          )
      );

      console.log(
        'Inventory UI updated.'
      );

      /*
       * Reload from Firebase
       */

      await loadInventory();

      if (
        typeof window !== 'undefined'
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
        typeof window !== 'undefined'
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

  // ========================================
  // ADD STOCK SCREEN
  // ========================================

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

  // ========================================
  // UPDATE STOCK SCREEN
  // ========================================

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

  // ========================================
  // INVENTORY SCREEN
  // ========================================

  if (showInventory) {
    return (
      <View
        style={
          styles.inventoryContainer
        }
      >

        {/* HEADER */}

        <View
          style={
            styles.inventoryHeader
          }
        >
          <Pressable
            style={
              styles.backButton
            }
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

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.inventoryTitle
              }
            >
              Blood Inventory
            </Text>

            <Text
              style={
                styles.inventorySubtitle
              }
            >
              View and manage available stocks
            </Text>
          </View>
        </View>

        {/* SUMMARY */}

        <View
          style={
            styles.summaryCard
          }
        >
          <View
            style={
              styles.summaryItem
            }
          >
            <Ionicons
              name="water-outline"
              size={22}
              color={COLORS.primary}
            />

            <View>
              <Text
                style={
                  styles.summaryNumber
                }
              >
                {inventory.length}
              </Text>

              <Text
                style={
                  styles.summaryText
                }
              >
                Blood Groups
              </Text>
            </View>
          </View>

          <View
            style={
              styles.summaryDivider
            }
          />

          <View
            style={
              styles.summaryItem
            }
          >
            <Ionicons
              name="cube-outline"
              size={22}
              color={COLORS.primary}
            />

            <View>
              <Text
                style={
                  styles.summaryNumber
                }
              >
                {totalUnits}
              </Text>

              <Text
                style={
                  styles.summaryText
                }
              >
                Total Units
              </Text>
            </View>
          </View>
        </View>

        {/* INVENTORY LIST */}

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.inventoryList
          }
        >

          {/* TABLE HEADER */}

          <View
            style={
              styles.tableHeader
            }
          >
            <View
              style={
                styles.groupColumn
              }
            >
              <Text
                style={
                  styles.tableHeaderText
                }
              >
                Blood
              </Text>

              <Text
                style={
                  styles.tableHeaderText
                }
              >
                Group
              </Text>
            </View>

            <View
              style={
                styles.unitsColumn
              }
            >
              <Text
                style={
                  styles.tableHeaderText
                }
              >
                Available
              </Text>

              <Text
                style={
                  styles.tableHeaderText
                }
              >
                Units
              </Text>
            </View>

            <View
              style={
                styles.statusColumn
              }
            >
              <Text
                style={
                  styles.tableHeaderText
                }
              >
                Status
              </Text>
            </View>

            <View
              style={
                styles.actionColumn
              }
            >
              <Text
                style={
                  styles.tableHeaderText
                }
              >
                Action
              </Text>
            </View>
          </View>

          {/* BLOOD ROWS */}

          {inventory.map(
            item => (
              <View
                key={item.id}
                style={
                  styles.inventoryRow
                }
              >

                {/* BLOOD GROUP */}

                <View
                  style={
                    styles.groupColumn
                  }
                >
                  <Text
                    style={
                      styles.bloodGroup
                    }
                  >
                    {item.bloodGroup}
                  </Text>
                </View>

                {/* UNITS */}

                <View
                  style={
                    styles.unitsColumn
                  }
                >
                  <Text
                    style={
                      styles.unitsText
                    }
                  >
                    {item.availableUnits}
                  </Text>
                </View>

                {/* STATUS */}

                <View
                  style={
                    styles.statusColumn
                  }
                >
                  <View
                    style={[
                      styles.statusBadge,
                      item.status ===
                      'Low Stock'
                        ? styles.lowStock
                        : styles.normalStock,
                    ]}
                  >
                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* ACTION BUTTONS */}

                <View
                  style={
                    styles.actionColumn
                  }
                >

                  {/* UPDATE */}

                  <Pressable
                    style={
                      styles.updateButton
                    }
                    onPress={() => {
                      console.log(
                        'UPDATE CLICKED:',
                        item.id,
                        item.bloodGroup
                      );

                      setShowUpdateStock(
                        true
                      );
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

                  {/* DELETE */}

                  <Pressable
                    style={[
                      styles.deleteButton,
                      deletingId ===
                      item.id &&
                        styles.disabledButton,
                    ]}
                    disabled={
                      deletingId ===
                      item.id
                    }
                    onPress={() => {
                      console.log(
                        'DELETE BUTTON PRESSED:',
                        item.id,
                        item.bloodGroup
                      );

                      confirmDelete(
                        item
                      );
                    }}
                  >
                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      {deletingId ===
                      item.id
                        ? '...'
                        : 'Delete'}
                    </Text>
                  </Pressable>

                </View>
              </View>
            )
          )}

          {/* ADD NEW STOCK */}

          <Pressable
            style={
              styles.addStockButton
            }
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

  // ========================================
  // MAIN DASHBOARD
  // ========================================

  return (
    <RoleDashboard
      title="Blood Bank Dashboard"
      subtitle="Manage blood inventory and emergency request information."
      items={[
        {
          title:
            'Blood Inventory',

          description:
            inventory.length > 0
              ? `${inventory.length} blood groups • ${totalUnits} total units available.`
              : 'View current blood group availability.',

          icon:
            'water-outline',

          onPress: () => {
            setShowInventory(
              true
            );
          },
        },

        {
          title:
            'Update Stock',

          description:
            'Add or update blood stock quantities.',

          icon:
            'create-outline',

          onPress: () => {
            setShowUpdateStock(
              true
            );
          },
        },

        {
          title:
            'Emergency Requests',

          description:
            'Review emergency blood requests.',

          icon:
            'alert-outline',
        },

        {
          title:
            'Inventory Reports',

          description:
            'View blood availability and inventory reports.',

          icon:
            'bar-chart-outline',
        },
      ]}
    />
  );
}

// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({

    inventoryContainer: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    inventoryHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 15,
      backgroundColor:
        COLORS.white,
      borderBottomWidth: 1,
      borderBottomColor:
        COLORS.border,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.primaryLight,
      alignItems:
        'center',
      justifyContent:
        'center',
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

    // ========================================
    // SUMMARY
    // ========================================

    summaryCard: {
      marginHorizontal: 18,
      marginTop: 10,
      marginBottom: 6,
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor:
        '#FFF1F1',
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    summaryItem: {
      flex: 1,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
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

    summaryDivider: {
      width: 1,
      height: 32,
      backgroundColor:
        COLORS.border,
    },

    // ========================================
    // INVENTORY LIST
    // ========================================

    inventoryList: {
      paddingHorizontal: 18,
      paddingTop: 5,
      paddingBottom: 30,
    },

    // ========================================
    // TABLE HEADER
    // ========================================

    tableHeader: {
      minHeight: 42,
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        '#F3F3F3',
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    tableHeaderText: {
      fontSize: 13,
      fontWeight: '800',
      color: COLORS.text,
      lineHeight: 12,
    },

    // ========================================
    // INVENTORY ROW
    // ========================================

    inventoryRow: {
      minHeight: 76,
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        COLORS.white,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor:
        COLORS.border,
    },

    // ========================================
    // COLUMNS
    // ========================================

    groupColumn: {
      width: '18%',
      paddingLeft: 6,
      justifyContent:
        'center',
    },

    unitsColumn: {
      width: '20%',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    statusColumn: {
      width: '25%',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    actionColumn: {
      width: '37%',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    // ========================================
    // BLOOD GROUP
    // ========================================

    bloodGroup: {
      fontSize: 15,
      fontWeight: '800',
      color: COLORS.text,
    },

    // ========================================
    // UNITS
    // ========================================

    unitsText: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.text,
    },

    // ========================================
    // STATUS
    // ========================================

    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderRadius: 10,
      minWidth: 54,
      alignItems:
        'center',
    },

    normalStock: {
      backgroundColor:
        '#E5F7ED',
    },

    lowStock: {
      backgroundColor:
        '#FFF0E5',
    },

    statusText: {
      fontSize: 13,
      fontWeight: '800',
      color: COLORS.text,
    },

    // ========================================
    // UPDATE BUTTON
    // ========================================

    updateButton: {
      minWidth: 58,
      height: 28,
      borderRadius: 6,
      backgroundColor:
        COLORS.white,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginBottom: 5,
    },

    updateButtonText: {
      fontSize: 10,
      fontWeight: '800',
      color: COLORS.primary,
    },

    // ========================================
    // DELETE BUTTON
    // ========================================

    deleteButton: {
      minWidth: 58,
      height: 28,
      borderRadius: 6,
      backgroundColor:
        '#FFF0F0',
      borderWidth: 1,
      borderColor:
        '#D32F2F',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    deleteButtonText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#D32F2F',
    },

    disabledButton: {
      opacity: 0.5,
    },

    // ========================================
    // ADD STOCK BUTTON
    // ========================================

    addStockButton: {
      height: 48,
      marginTop: 14,
      marginBottom: 10,
      borderRadius: 8,
      backgroundColor:
        COLORS.primary,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 6,
    },

    addStockButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: COLORS.white,
    },
  });
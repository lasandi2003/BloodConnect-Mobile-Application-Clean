import React, { useEffect, useState } from 'react';

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  getBloodInventory,
  updateBloodStock,
} from '../services/bloodInventoryService';

import { COLORS } from '../../../constants/colors';

type BloodInventoryItem = {
  id: string;
  bloodGroup: string;
  availableUnits: number;
  status: string;
};

interface Props {
  onBack: () => void;
  bloodItem?: BloodInventoryItem;
}

const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

export default function UpdateStockScreen({
  onBack,
  bloodItem,
}: Props) {
  const [inventory, setInventory] =
    useState<BloodInventoryItem[]>([]);

  const [selectedGroup, setSelectedGroup] =
    useState(
      bloodItem?.bloodGroup ?? 'A+'
    );

  const [showGroupPicker, setShowGroupPicker] =
    useState(false);

  const [operation, setOperation] =
    useState<'add' | 'remove'>('add');

  const [units, setUnits] =
    useState('');

  const [expiryDate, setExpiryDate] =
    useState('');

  const [reason, setReason] =
    useState('');

  const [updating, setUpdating] =
    useState(false);

  // --------------------------------
  // LOAD INVENTORY
  // --------------------------------

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const data =
        await getBloodInventory();

      const inventoryData =
        data as BloodInventoryItem[];

      setInventory(inventoryData);

    } catch (error) {
      console.error(
        'Failed to load blood inventory:',
        error
      );
    }
  }

  // --------------------------------
  // SELECTED ITEM
  // --------------------------------

  const selectedItem =
    bloodItem ??
    inventory.find(
      item =>
        item.bloodGroup === selectedGroup
    ) ??
    null;

  const currentUnits =
    selectedItem?.availableUnits ?? 0;

  // --------------------------------
  // ENTERED UNITS
  // --------------------------------

  const enteredUnits =
    Number(units) || 0;

  // --------------------------------
  // NEW TOTAL
  // --------------------------------

  const newTotalUnits =
    operation === 'add'
      ? currentUnits + enteredUnits
      : Math.max(
          0,
          currentUnits - enteredUnits
        );

  // --------------------------------
  // STATUS
  // --------------------------------

  const status =
    newTotalUnits <= 20
      ? 'Low Stock'
      : 'Normal';

  // --------------------------------
  // UPDATE STOCK
  // --------------------------------

  async function handleUpdateStock() {
    if (!selectedItem) {
      Alert.alert(
        'Select Blood Group',
        'Please select a blood group.'
      );
      return;
    }

    if (
      !units ||
      enteredUnits <= 0
    ) {
      Alert.alert(
        'Invalid Quantity',
        'Please enter a valid number of units.'
      );
      return;
    }

    if (
      operation === 'remove' &&
      enteredUnits > currentUnits
    ) {
      Alert.alert(
        'Invalid Quantity',
        `You cannot remove more than ${currentUnits} units.`
      );
      return;
    }

    try {
      setUpdating(true);

      await updateBloodStock(
        selectedItem.id,
        newTotalUnits
      );

      Alert.alert(
        'Stock Updated',
        `${selectedGroup} stock has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onBack();
            },
          },
        ]
      );

    } catch (error) {
      console.error(
        'Failed to update blood stock:',
        error
      );

      Alert.alert(
        'Update Failed',
        'Unable to update blood stock. Please try again.'
      );

    } finally {
      setUpdating(false);
    }
  }

  // --------------------------------
  // SELECT BLOOD GROUP
  // --------------------------------

  function selectBloodGroup(
    group: string
  ) {
    setSelectedGroup(group);
    setShowGroupPicker(false);
    setUnits('');
  }

  // --------------------------------
  // SCREEN
  // --------------------------------

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.text}
          />
        </Pressable>

        <View style={styles.headerText}>

          <Text style={styles.headerTitle}>
            Update Blood Stock
          </Text>

          <Text style={styles.headerSubtitle}>
            Modify existing blood stock details
          </Text>

        </View>

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* STOCK HEADER */}

        <View style={styles.stockHeaderCard}>

          <View style={styles.bloodIcon}>

            <Ionicons
              name="water-outline"
              size={22}
              color={COLORS.primary}
            />

          </View>

          <View style={styles.stockHeaderInfo}>

            <Text style={styles.stockGroup}>
              {selectedGroup} Blood Stock
            </Text>

            <Text style={styles.stockSubtitle}>
              Update the details below
            </Text>

          </View>

          <View
            style={[
              styles.stockStatus,
              status === 'Low Stock'
                ? styles.lowStatus
                : styles.normalStatus,
            ]}
          >

            <Text
              style={styles.stockStatusText}
            >
              {status}
            </Text>

          </View>

        </View>

        {/* BLOOD GROUP */}

        <Text style={styles.label}>
          Blood group
          <Text style={styles.required}>
            {' '}*
          </Text>
        </Text>

        <Pressable
          style={styles.selectBox}
          onPress={() =>
            setShowGroupPicker(true)
          }
        >

          <View style={styles.selectLeft}>

            <Ionicons
              name="water-outline"
              size={18}
              color={COLORS.primary}
            />

            <Text style={styles.selectText}>
              {selectedGroup}
            </Text>

          </View>

          <Ionicons
            name="chevron-down"
            size={20}
            color={COLORS.textSecondary}
          />

        </Pressable>

        {/* CURRENT UNITS */}

        <Text style={styles.label}>
          Current Units
        </Text>

        <View style={styles.currentUnitsBox}>

          <View style={styles.smallIconBox}>

            <Ionicons
              name="cube-outline"
              size={18}
              color={COLORS.textSecondary}
            />

          </View>

          <Text style={styles.currentUnitsText}>
            {currentUnits}
          </Text>

        </View>

        {/* ADD / REMOVE */}

        <Text style={styles.label}>
          Add / Remove Units
          <Text style={styles.required}>
            {' '}*
          </Text>
        </Text>

        <View style={styles.operationRow}>

          {/* ADD */}

          <Pressable
            style={[
              styles.operationButton,
              operation === 'add' &&
                styles.operationButtonActive,
            ]}
            onPress={() =>
              setOperation('add')
            }
          >

            <View
              style={[
                styles.radio,
                operation === 'add' &&
                  styles.radioActive,
              ]}
            >

              {operation === 'add' && (
                <View
                  style={styles.radioDot}
                />
              )}

            </View>

            <Ionicons
              name="add"
              size={18}
              color={
                operation === 'add'
                  ? COLORS.primary
                  : COLORS.textSecondary
              }
            />

            <Text
              style={[
                styles.operationText,
                operation === 'add' &&
                  styles.operationTextActive,
              ]}
            >
              Add Units
            </Text>

          </Pressable>

          {/* REMOVE */}

          <Pressable
            style={[
              styles.operationButton,
              operation === 'remove' &&
                styles.operationButtonActive,
            ]}
            onPress={() =>
              setOperation('remove')
            }
          >

            <View
              style={[
                styles.radio,
                operation === 'remove' &&
                  styles.radioActive,
              ]}
            >

              {operation === 'remove' && (
                <View
                  style={styles.radioDot}
                />
              )}

            </View>

            <Ionicons
              name="remove"
              size={18}
              color={
                operation === 'remove'
                  ? COLORS.primary
                  : COLORS.textSecondary
              }
            />

            <Text
              style={[
                styles.operationText,
                operation === 'remove' &&
                  styles.operationTextActive,
              ]}
            >
              Remove Units
            </Text>

          </Pressable>

        </View>

        {/* NUMBER OF UNITS */}

        <Text style={styles.label}>
          Number of Units
          <Text style={styles.required}>
            {' '}*
          </Text>
        </Text>

        <View style={styles.inputBox}>

          <Ionicons
            name="cube-outline"
            size={18}
            color={COLORS.textSecondary}
          />

          <TextInput
            value={units}
            onChangeText={text =>
              setUnits(
                text.replace(
                  /[^0-9]/g,
                  ''
                )
              )
            }
            placeholder="Enter number of units"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            style={styles.input}
          />

        </View>

        {/* NEW TOTAL */}

        <View style={styles.totalRow}>

          <Text style={styles.totalLabel}>
            New total units
          </Text>

          <View
            style={styles.totalValueBox}
          >

            <Ionicons
              name="cube-outline"
              size={16}
              color={COLORS.textSecondary}
            />

            <Text style={styles.totalValue}>
              {newTotalUnits}
            </Text>

          </View>

        </View>

        {/* EXPIRY DATE */}

        <Text style={styles.label}>
          Expiry Date
        </Text>

        <View style={styles.inputBox}>

          <Ionicons
            name="calendar-outline"
            size={18}
            color={COLORS.textSecondary}
          />

          <TextInput
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="dd / mm / yyyy"
            placeholderTextColor="#A0A0A0"
            style={styles.input}
          />

        </View>

        {/* REASON */}

        <Text style={styles.label}>
          Reason for Update
        </Text>

        <View style={styles.inputBox}>

          <Ionicons
            name="document-text-outline"
            size={18}
            color={COLORS.textSecondary}
          />

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Enter reason"
            placeholderTextColor="#A0A0A0"
            style={styles.input}
          />

        </View>

        {/* BUTTONS */}

        <View style={styles.buttonRow}>

          <Pressable
            style={styles.cancelButton}
            onPress={onBack}
            disabled={updating}
          >

            <Text style={styles.cancelText}>
              Cancel
            </Text>

          </Pressable>

          <Pressable
            style={[
              styles.updateButton,
              updating &&
                styles.updateButtonDisabled,
            ]}
            onPress={
              handleUpdateStock
            }
            disabled={updating}
          >

            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color={COLORS.white}
            />

            <Text style={styles.updateText}>
              {updating
                ? 'Updating...'
                : 'Update Stock'}
            </Text>

          </Pressable>

        </View>

      </ScrollView>

      {/* BLOOD GROUP MODAL */}

      <Modal
        visible={showGroupPicker}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowGroupPicker(false)
        }
      >

        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setShowGroupPicker(false)
          }
        >

          <Pressable
            style={styles.modalCard}
            onPress={() => {}}
          >

            <Text style={styles.modalTitle}>
              Select Blood Group
            </Text>

            {BLOOD_GROUPS.map(
              group => {

                const item =
                  inventory.find(
                    blood =>
                      blood.bloodGroup ===
                      group
                  );

                return (
                  <Pressable
                    key={group}
                    style={[
                      styles.groupOption,
                      selectedGroup ===
                        group &&
                        styles.selectedGroupOption,
                    ]}
                    onPress={() =>
                      selectBloodGroup(
                        group
                      )
                    }
                  >

                    <View
                      style={
                        styles.groupOptionLeft
                      }
                    >

                      <View
                        style={
                          styles.modalBloodIcon
                        }
                      >

                        <Ionicons
                          name="water-outline"
                          size={17}
                          color={
                            COLORS.primary
                          }
                        />

                      </View>

                      <View>

                        <Text
                          style={
                            styles.groupName
                          }
                        >
                          {group}
                        </Text>

                        <Text
                          style={
                            styles.groupUnits
                          }
                        >
                          {item?.availableUnits ??
                            0}{' '}
                          units available
                        </Text>

                      </View>

                    </View>

                    {selectedGroup ===
                      group && (
                      <Ionicons
                        name="checkmark-circle"
                        size={21}
                        color={
                          COLORS.primary
                        }
                      />
                    )}

                  </Pressable>
                );
              }
            )}

          </Pressable>

        </Pressable>

      </Modal>

    </View>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
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

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 35,
  },

  stockHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  bloodIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  stockHeaderInfo: {
    flex: 1,
  },

  stockGroup: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  stockSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  stockStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  normalStatus: {
    backgroundColor: '#E8F7EE',
  },

  lowStatus: {
    backgroundColor: '#FFF1E8',
  },

  stockStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 7,
  },

  required: {
    color: COLORS.primary,
  },

  selectBox: {
    height: 47,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  selectText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  currentUnitsBox: {
    height: 47,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  smallIconBox: {
    marginRight: 8,
  },

  currentUnitsText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },

  operationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },

  operationButton: {
    flex: 1,
    minHeight: 47,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  operationButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF7F7',
  },

  radio: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#A0A0A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  radioActive: {
    borderColor: COLORS.primary,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  operationText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },

  operationTextActive: {
    color: COLORS.primary,
  },

  inputBox: {
    minHeight: 47,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 0,
  },

  totalRow: {
    minHeight: 47,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },

  totalValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  totalValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E9E9E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  updateButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  updateButtonDisabled: {
    opacity: 0.6,
  },

  updateText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },

  groupOption: {
    minHeight: 58,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedGroupOption: {
    backgroundColor: '#FFF1F1',
  },

  groupOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalBloodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  groupName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  groupUnits: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

});
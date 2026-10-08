import React, { useEffect, useRef, useState } from 'react';

import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

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
  // =====================================================
  // STATE
  // =====================================================

  const [inventory, setInventory] =
    useState<BloodInventoryItem[]>([]);

  const [selectedGroup, setSelectedGroup] =
    useState(
      bloodItem?.bloodGroup ?? 'A+'
    );

  const [showGroupPicker, setShowGroupPicker] =
    useState(false);

  const [units, setUnits] =
    useState('');

  const [expiryDate, setExpiryDate] =
    useState<Date | null>(null);

  const [showExpiryPicker, setShowExpiryPicker] =
    useState(false);

  const [reason, setReason] =
    useState('');

  const [updating, setUpdating] =
    useState(false);

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const data = await getBloodInventory();

      setInventory(
        data as BloodInventoryItem[]
      );
    } catch (error) {
      console.error(
        'Failed to load blood inventory:',
        error
      );
    }
  }

  // =====================================================
  // SELECTED BLOOD
  // =====================================================

  const selectedItem =
    bloodItem ??
    inventory.find(
      item =>
        item.bloodGroup === selectedGroup
    ) ??
    null;

  const currentUnits =
    selectedItem?.availableUnits ?? 0;

  // =====================================================
  // ENTERED UNITS
  // =====================================================

  const enteredUnits =
    Number(units) || 0;

  const newTotalUnits =
    currentUnits + enteredUnits;

  // =====================================================
  // STATUS
  // =====================================================

  const status =
    newTotalUnits <= 20
      ? 'Low Stock'
      : 'Normal';

  // =====================================================
  // DATE HELPERS
  // =====================================================

  function formatDate(date: Date | null) {
    if (!date) {
      return '';
    }

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    const year = date.getFullYear();

    return `${month} / ${day} / ${year}`;
  }

  function formatDateForWeb(date: Date | null) {
    if (!date) {
      return '';
    }

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function parseWebDate(
    value: string
  ): Date | null {
    if (!value) {
      return null;
    }

    const parts = value.split('-');

    if (parts.length !== 3) {
      return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  // =====================================================
  // WEB CALENDAR
  // =====================================================

  function WebDateInput() {
    if (Platform.OS !== 'web') {
      return null;
    }

    const inputRef = useRef<any>(null);

    function openCalendar() {
      try {
        if (inputRef.current?.showPicker) {
          inputRef.current.showPicker();
        } else {
          inputRef.current?.focus();
          inputRef.current?.click();
        }
      } catch {
        inputRef.current?.focus();
      }
    }

    return (
      <View style={styles.webDateWrapper}>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={COLORS.textSecondary}
        />

        <Text
          style={[
            styles.dateText,
            !expiryDate &&
              styles.placeholderText,
          ]}
        >
          {expiryDate
            ? formatDate(expiryDate)
            : 'dd / mm / yyyy'}
        </Text>

        <Pressable
          style={styles.calendarButton}
          onPress={openCalendar}
        >
          <Ionicons
            name="calendar-outline"
            size={17}
            color={COLORS.textSecondary}
          />
        </Pressable>

        {React.createElement(
          'input',
          {
            ref: inputRef,
            type: 'date',
            value: formatDateForWeb(
              expiryDate
            ),
            min: formatDateForWeb(
              new Date()
            ),
            onChange: (event: any) => {
              const selectedDate =
                parseWebDate(
                  event.target.value
                );

              if (selectedDate) {
                setExpiryDate(
                  selectedDate
                );
              }
            },
            style: {
              position: 'absolute',
              right: 0,
              top: 0,
              width: 48,
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            },
          }
        )}
      </View>
    );
  }

  // =====================================================
  // UPDATE STOCK
  // =====================================================

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

    try {
      setUpdating(true);

      await updateBloodStock(
        selectedItem.id,
        newTotalUnits
      );

      setUpdating(false);

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
      setUpdating(false);

      console.error(
        'Failed to update blood stock:',
        error
      );

      Alert.alert(
        'Update Failed',
        'Unable to update blood stock. Please try again.'
      );
    }
  }

  // =====================================================
  // SELECT BLOOD GROUP
  // =====================================================

  function selectBloodGroup(
    group: string
  ) {
    setSelectedGroup(group);
    setShowGroupPicker(false);

    // Reset quantity when changing blood group
    setUnits('');
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={onBack}
          disabled={updating}
        >
          <Ionicons
            name="arrow-back"
            size={21}
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

      {/* =================================================
          FORM
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >

        {/* =================================================
            STOCK SUMMARY CARD
        ================================================= */}

        <View style={styles.stockHeaderCard}>

          <View style={styles.bloodIcon}>
            <Ionicons
              name="water-outline"
              size={23}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.stockHeaderInfo}>

            <Text style={styles.stockGroup}>
              {selectedGroup}
              {'\n'}
              Blood Stock
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
            <Text style={styles.stockStatusText}>
              {status}
            </Text>
          </View>

        </View>

        {/* =================================================
            BLOOD GROUP
        ================================================= */}

        <Text style={styles.label}>
          Blood group
          <Text style={styles.required}>
            {' '}*
          </Text>
        </Text>

        <Pressable
          style={styles.selectBox}
          onPress={() =>
            setShowGroupPicker(
              !showGroupPicker
            )
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
            name={
              showGroupPicker
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={19}
            color={COLORS.textSecondary}
          />

        </Pressable>

        {/* =================================================
            BLOOD GROUP DROPDOWN
        ================================================= */}

        {showGroupPicker && (
          <View style={styles.dropdown}>

            <Text style={styles.dropdownTitle}>
              Select Blood Group
            </Text>

            {BLOOD_GROUPS.map(group => {

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
                    selectBloodGroup(group)
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
                        {item
                          ?.availableUnits ??
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
            })}

          </View>
        )}

        {/* =================================================
            CURRENT UNITS
        ================================================= */}

        <Text style={styles.label}>
          Current Units
        </Text>

        <View style={styles.currentUnitsBox}>

          <Ionicons
            name="cube-outline"
            size={18}
            color={
              COLORS.textSecondary
            }
          />

          <Text
            style={styles.currentUnitsText}
          >
            {currentUnits}
          </Text>

        </View>

        {/* =================================================
            NUMBER OF UNITS
        ================================================= */}

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
            color={
              COLORS.textSecondary
            }
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

        {/* =================================================
            NEW TOTAL
        ================================================= */}

        <View style={styles.totalRow}>

          <Text style={styles.totalLabel}>
            New total{'\n'}units
          </Text>

          <View
            style={styles.totalValueBox}
          >

            <Ionicons
              name="cube-outline"
              size={16}
              color={
                COLORS.textSecondary
              }
            />

            <Text
              style={styles.totalValue}
            >
              {newTotalUnits}
            </Text>

          </View>

        </View>

        {/* =================================================
            EXPIRY DATE
        ================================================= */}

        <Text style={styles.label}>
          Expiry Date
        </Text>

        {Platform.OS === 'web' ? (
          <WebDateInput />
        ) : (
          <>
            <Pressable
              style={styles.inputBox}
              onPress={() =>
                setShowExpiryPicker(
                  true
                )
              }
            >

              <Ionicons
                name="calendar-outline"
                size={18}
                color={
                  COLORS.textSecondary
                }
              />

              <Text
                style={[
                  styles.dateText,
                  !expiryDate &&
                    styles.placeholderText,
                ]}
              >
                {expiryDate
                  ? formatDate(
                      expiryDate
                    )
                  : 'dd / mm / yyyy'}
              </Text>

              <Ionicons
                name="calendar-outline"
                size={17}
                color={
                  COLORS.textSecondary
                }
              />

            </Pressable>

            {showExpiryPicker && (
              <DateTimePicker
                value={
                  expiryDate ||
                  new Date()
                }
                mode="date"
                display="default"
                minimumDate={
                  new Date()
                }
                onChange={(
                  event,
                  selectedDate
                ) => {

                  setShowExpiryPicker(
                    false
                  );

                  if (selectedDate) {
                    setExpiryDate(
                      selectedDate
                    );
                  }

                }}
              />
            )}
          </>
        )}

        {/* =================================================
            REASON
        ================================================= */}

        <Text style={styles.label}>
          Reason for Update
        </Text>

        <View style={styles.inputBox}>

          <Ionicons
            name="document-text-outline"
            size={18}
            color={
              COLORS.textSecondary
            }
          />

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Enter reason"
            placeholderTextColor="#A0A0A0"
            style={styles.input}
          />

        </View>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <View style={styles.buttonRow}>

          <Pressable
            style={styles.cancelButton}
            onPress={onBack}
            disabled={updating}
          >
            <Text
              style={styles.cancelText}
            >
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
              size={18}
              color={COLORS.white}
            />

            <Text
              style={styles.updateText}
            >
              {updating
                ? 'Updating...'
                : 'Update Stock'}
            </Text>

          </Pressable>

        </View>

      </ScrollView>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // ===================================================
  // HEADER
  // ===================================================

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
    backgroundColor:
      COLORS.primaryLight,
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

  // ===================================================
  // FORM
  // ===================================================

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 35,
  },

  // ===================================================
  // STOCK CARD
  // ===================================================

  stockHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  bloodIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor:
      COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  stockHeaderInfo: {
    flex: 1,
  },

  stockGroup: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: COLORS.text,
  },

  stockSubtitle: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  stockStatus: {
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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

  // ===================================================
  // LABEL
  // ===================================================

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 7,
  },

  required: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  // ===================================================
  // BLOOD GROUP
  // ===================================================

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
  },

  selectText: {
    marginLeft: 9,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // ===================================================
  // DROPDOWN
  // ===================================================

  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: -7,
    marginBottom: 15,
    overflow: 'hidden',
  },

  dropdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },

  groupOption: {
    minHeight: 58,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    marginBottom: 5,
    borderRadius: 9,
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
    backgroundColor:
      COLORS.primaryLight,
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

  // ===================================================
  // CURRENT UNITS
  // ===================================================

  currentUnitsBox: {
    height: 47,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  currentUnitsText: {
    marginLeft: 9,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },

  // ===================================================
  // INPUT
  // ===================================================

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

  placeholderText: {
    color: '#A0A0A0',
    fontWeight: '400',
  },

  // ===================================================
  // TOTAL
  // ===================================================

  totalRow: {
    minHeight: 47,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
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

  // ===================================================
  // DATE
  // ===================================================

  dateText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  webDateWrapper: {
    height: 47,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingLeft: 11,
    paddingRight: 3,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
    overflow: 'hidden',
  },

  calendarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===================================================
  // BUTTONS
  // ===================================================

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
});
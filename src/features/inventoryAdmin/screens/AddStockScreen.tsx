import React, { useEffect, useState } from 'react';

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

export default function AddStockScreen({
  onBack,
}: Props) {
  const [inventory, setInventory] =
    useState<BloodInventoryItem[]>([]);

  const [bloodGroup, setBloodGroup] =
    useState('');

  const [quantity, setQuantity] =
    useState('');

  const [collectionDate, setCollectionDate] =
    useState<Date | null>(null);

  const [expiryDate, setExpiryDate] =
    useState<Date | null>(null);

  const [showBloodGroups, setShowBloodGroups] =
    useState(false);

  const [showCollectionPicker, setShowCollectionPicker] =
    useState(false);

  const [showExpiryPicker, setShowExpiryPicker] =
    useState(false);

  const [donorSource, setDonorSource] =
    useState('');

  const [notes, setNotes] =
    useState('');

  const [saving, setSaving] =
    useState(false);

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
        'Failed to load inventory:',
        error
      );
    }
  }

  // --------------------------------
  // DATE FORMAT
  // --------------------------------

  function formatDate(date: Date | null) {
    if (!date) {
      return '';
    }

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const year = date.getFullYear();

    return `${day} / ${month} / ${year}`;
  }

  // --------------------------------
  // WEB DATE VALUE
  // --------------------------------

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

    return date;
  }

  // --------------------------------
  // SELECTED BLOOD
  // --------------------------------

  const selectedBlood =
    inventory.find(
      item =>
        item.bloodGroup === bloodGroup
    );

  const currentUnits =
    selectedBlood?.availableUnits ?? 0;

  const quantityNumber =
    Number(quantity) || 0;

  const newTotal =
    currentUnits + quantityNumber;

  // --------------------------------
  // SAVE STOCK
  // --------------------------------

  async function handleSaveStock() {
    if (!bloodGroup) {
      Alert.alert(
        'Required',
        'Please select a blood group.'
      );
      return;
    }

    if (!quantity || quantityNumber <= 0) {
      Alert.alert(
        'Required',
        'Please enter a valid quantity.'
      );
      return;
    }

    if (!collectionDate) {
      Alert.alert(
        'Required',
        'Please select the collection date.'
      );
      return;
    }

    if (!expiryDate) {
      Alert.alert(
        'Required',
        'Please select the expiry date.'
      );
      return;
    }

    if (expiryDate <= collectionDate) {
      Alert.alert(
        'Invalid Date',
        'Expiry date must be after the collection date.'
      );
      return;
    }

    if (!donorSource.trim()) {
      Alert.alert(
        'Required',
        'Please enter the donor or source details.'
      );
      return;
    }

    if (!selectedBlood) {
      Alert.alert(
        'Blood Group Not Found',
        'This blood group does not exist in the inventory.'
      );
      return;
    }

    try {
      setSaving(true);

      await updateBloodStock(
        selectedBlood.id,
        newTotal
      );

      setSaving(false);

      /*
       * Automatically return to
       * Blood Inventory.
       */
      onBack();

      /*
       * Show success message after
       * returning to inventory.
       */
      setTimeout(() => {
        Alert.alert(
          'Stock Added',
          `${quantityNumber} units of ${bloodGroup} have been added successfully.`
        );
      }, 300);

    } catch (error) {
      setSaving(false);

      console.error(
        'Failed to add stock:',
        error
      );

      Alert.alert(
        'Error',
        'Failed to add blood stock. Please try again.'
      );
    }
  }

  // --------------------------------
  // WEB COLLECTION DATE
  // --------------------------------

  function renderWebCollectionDate() {
    if (Platform.OS !== 'web') {
      return null;
    }

    return React.createElement('input', {
      type: 'date',
      value: formatDateForWeb(
        collectionDate
      ),
      max: formatDateForWeb(
        new Date(
          new Date().setFullYear(
            new Date().getFullYear() + 1
          )
        )
      ),
      onChange: (
        event: any
      ) => {
        const selectedDate =
          parseWebDate(
            event.target.value
          );

        if (selectedDate) {
          setCollectionDate(
            selectedDate
          );

          if (
            expiryDate &&
            selectedDate >= expiryDate
          ) {
            setExpiryDate(null);
          }
        }
      },
      style: {
        flex: 1,
        marginLeft: 8,
        height: 40,
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        color: '#1F1F1F',
        fontSize: 13,
        fontWeight: 600,
      },
    });
  }

  // --------------------------------
  // WEB EXPIRY DATE
  // --------------------------------

  function renderWebExpiryDate() {
    if (Platform.OS !== 'web') {
      return null;
    }

    const minimumDate =
      collectionDate
        ? new Date(
            collectionDate.getTime() +
              24 * 60 * 60 * 1000
          )
        : new Date();

    return React.createElement('input', {
      type: 'date',
      value: formatDateForWeb(
        expiryDate
      ),
      min: formatDateForWeb(
        minimumDate
      ),
      onChange: (
        event: any
      ) => {
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
        flex: 1,
        marginLeft: 8,
        height: 40,
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        color: '#1F1F1F',
        fontSize: 13,
        fontWeight: 600,
      },
    });
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={onBack}
          disabled={saving}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.text}
          />
        </Pressable>

        <View style={styles.headerText}>

          <Text style={styles.headerTitle}>
            Add Blood Stock
          </Text>

          <Text style={styles.headerSubtitle}>
            Enter details of new blood donation
          </Text>

        </View>

      </View>

      {/* CONTENT */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

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
            setShowBloodGroups(
              !showBloodGroups
            )
          }
        >

          <View style={styles.selectLeft}>

            <Ionicons
              name="water-outline"
              size={18}
              color={COLORS.primary}
            />

            <Text
              style={[
                styles.selectText,
                !bloodGroup &&
                  styles.placeholderText,
              ]}
            >
              {bloodGroup ||
                'Select blood group'}
            </Text>

          </View>

          <Ionicons
            name={
              showBloodGroups
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={20}
            color={COLORS.textSecondary}
          />

        </Pressable>

        {/* BLOOD GROUP DROPDOWN */}

        {showBloodGroups && (
          <View style={styles.dropdown}>

            {BLOOD_GROUPS.map(
              group => (
                <Pressable
                  key={group}
                  style={[
                    styles.dropdownItem,
                    bloodGroup === group &&
                      styles.selectedDropdownItem,
                  ]}
                  onPress={() => {
                    setBloodGroup(
                      group
                    );

                    setShowBloodGroups(
                      false
                    );
                  }}
                >

                  <Text
                    style={[
                      styles.dropdownText,
                      bloodGroup ===
                        group &&
                        styles.selectedDropdownText,
                    ]}
                  >
                    {group}
                  </Text>

                  {bloodGroup ===
                    group && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={
                        COLORS.primary
                      }
                    />
                  )}

                </Pressable>
              )
            )}

          </View>
        )}

        {/* QUANTITY */}

        <Text style={styles.label}>
          Quantity (Units)
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
            value={quantity}
            onChangeText={text =>
              setQuantity(
                text.replace(
                  /[^0-9]/g,
                  ''
                )
              )
            }
            placeholder="Enter quantity"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            style={styles.input}
          />

        </View>

        {/* COLLECTION DATE */}

        <Text style={styles.label}>
          Collection Date
          <Text style={styles.required}>
            {' '}*
          </Text>
        </Text>

        {Platform.OS === 'web' ? (
          <View style={styles.inputBox}>

            <Ionicons
              name="calendar-outline"
              size={18}
              color={
                COLORS.textSecondary
              }
            />

            {renderWebCollectionDate()}

          </View>
        ) : (
          <>
            <Pressable
              style={styles.inputBox}
              onPress={() =>
                setShowCollectionPicker(
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
                  !collectionDate &&
                    styles.placeholderText,
                ]}
              >
                {collectionDate
                  ? formatDate(
                      collectionDate
                    )
                  : 'Select collection date'}
              </Text>

            </Pressable>

            {showCollectionPicker && (
              <DateTimePicker
                value={
                  collectionDate ||
                  new Date()
                }
                mode="date"
                display="default"
                maximumDate={
                  new Date(
                    new Date().setFullYear(
                      new Date().getFullYear() +
                        1
                    )
                  )
                }
                onChange={(
                  event,
                  selectedDate
                ) => {
                  setShowCollectionPicker(
                    false
                  );

                  if (
                    selectedDate
                  ) {
                    setCollectionDate(
                      selectedDate
                    );

                    if (
                      expiryDate &&
                      selectedDate >=
                        expiryDate
                    ) {
                      setExpiryDate(
                        null
                      );
                    }
                  }
                }}
              />
            )}
          </>
        )}

        {/* EXPIRY DATE */}

        <Text style={styles.label}>
          Expiry Date
          <Text style={styles.required}>
            {' '}*
          </Text>
        </Text>

        {Platform.OS === 'web' ? (
          <View style={styles.inputBox}>

            <Ionicons
              name="calendar-outline"
              size={18}
              color={
                COLORS.textSecondary
              }
            />

            {renderWebExpiryDate()}

          </View>
        ) : (
          <>
            <Pressable
              style={styles.inputBox}
              onPress={() => {
                if (!collectionDate) {
                  Alert.alert(
                    'Collection Date Required',
                    'Please select the collection date first.'
                  );
                  return;
                }

                setShowExpiryPicker(
                  true
                );
              }}
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
                  : 'Select expiry date'}
              </Text>

            </Pressable>

            {showExpiryPicker && (
              <DateTimePicker
                value={
                  expiryDate ||
                  new Date(
                    collectionDate
                      ? collectionDate.getTime() +
                          24 *
                            60 *
                            60 *
                            1000
                      : Date.now()
                  )
                }
                mode="date"
                display="default"
                minimumDate={
                  collectionDate
                    ? new Date(
                        collectionDate.getTime() +
                          24 *
                            60 *
                            60 *
                            1000
                      )
                    : new Date()
                }
                onChange={(
                  event,
                  selectedDate
                ) => {
                  setShowExpiryPicker(
                    false
                  );

                  if (
                    selectedDate
                  ) {
                    setExpiryDate(
                      selectedDate
                    );
                  }
                }}
              />
            )}
          </>
        )}

        {/* DONOR / SOURCE */}

        <Text style={styles.label}>
          Donor / Source Details
          <Text style={styles.required}>
            {' '}*
          </Text>
        </Text>

        <View style={styles.inputBox}>

          <Ionicons
            name="person-outline"
            size={18}
            color={
              COLORS.textSecondary
            }
          />

          <TextInput
            value={donorSource}
            onChangeText={
              setDonorSource
            }
            placeholder="Enter donor name / source"
            placeholderTextColor="#A0A0A0"
            style={styles.input}
          />

        </View>

        {/* NOTES */}

        <Text style={styles.label}>
          Notes (Optional)
        </Text>

        <View
          style={[
            styles.inputBox,
            styles.notesBox,
          ]}
        >

          <Ionicons
            name="document-text-outline"
            size={18}
            color={
              COLORS.textSecondary
            }
          />

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter additional notes"
            placeholderTextColor="#A0A0A0"
            style={[
              styles.input,
              styles.notesInput,
            ]}
            multiline
          />

        </View>

        {/* STOCK SUMMARY */}

        {bloodGroup &&
          quantity && (
            <View
              style={
                styles.previewCard
              }
            >

              <Text
                style={
                  styles.previewTitle
                }
              >
                Stock Summary
              </Text>

              <View
                style={
                  styles.previewRow
                }
              >

                <Text
                  style={
                    styles.previewLabel
                  }
                >
                  Current units
                </Text>

                <Text
                  style={
                    styles.previewValue
                  }
                >
                  {currentUnits}
                </Text>

              </View>

              <View
                style={
                  styles.previewRow
                }
              >

                <Text
                  style={
                    styles.previewLabel
                  }
                >
                  Units to add
                </Text>

                <Text
                  style={
                    styles.previewValue
                  }
                >
                  +{quantityNumber}
                </Text>

              </View>

              <View
                style={
                  styles.previewDivider
                }
              />

              <View
                style={
                  styles.previewRow
                }
              >

                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  New total units
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  {newTotal}
                </Text>

              </View>

            </View>
          )}

        {/* BUTTONS */}

        <View style={styles.buttonRow}>

          <Pressable
            style={
              styles.cancelButton
            }
            onPress={onBack}
            disabled={saving}
          >
            <Text
              style={
                styles.cancelText
              }
            >
              Cancel
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.saveButton,
              saving &&
                styles.disabledButton,
            ]}
            onPress={
              handleSaveStock
            }
            disabled={saving}
          >

            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color={
                COLORS.white
              }
            />

            <Text
              style={
                styles.saveText
              }
            >
              {saving
                ? 'Saving...'
                : 'Save Stock'}
            </Text>

          </Pressable>

        </View>

      </ScrollView>

    </View>
  );
}

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

  scrollContent: {
    padding: 16,
    paddingBottom: 35,
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

  placeholderText: {
    color: '#A0A0A0',
    fontWeight: '400',
  },

  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 15,
    overflow: 'hidden',
  },

  dropdownItem: {
    minHeight: 43,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  selectedDropdownItem: {
    backgroundColor: '#FFF3F3',
  },

  dropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  selectedDropdownText: {
    color: COLORS.primary,
    fontWeight: '800',
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

  dateText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  notesBox: {
    minHeight: 58,
    alignItems: 'flex-start',
    paddingTop: 12,
  },

  notesInput: {
    minHeight: 35,
    textAlignVertical: 'top',
  },

  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 15,
  },

  previewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },

  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },

  previewLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  previewValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  previewDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 7,
  },

  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },

  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
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

  saveButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
});
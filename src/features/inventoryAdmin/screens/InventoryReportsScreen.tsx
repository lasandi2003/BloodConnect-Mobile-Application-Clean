import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { getBloodInventory } from '../services/bloodInventoryService';

type BloodInventoryItem = {
  id: string;
  bloodGroup: string;
  availableUnits: number;
  status?: string;
};

type Props = {
  onBack: () => void;
};

const LOW_STOCK_LIMIT = 20;

export default function InventoryReportsScreen({
  onBack,
}: Props) {
  const [inventory, setInventory] = useState<
    BloodInventoryItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ========================================
  // LOAD INVENTORY
  // ========================================

  const loadInventory = useCallback(
    async () => {
      try {
        setError(null);

        const data =
          await getBloodInventory();

        /*
         * Firebase service currently does not
         * expose a detailed TypeScript type.
         *
         * We explicitly describe the fields
         * returned by the bloodInventory collection.
         */

        const rawData = data as Array<{
          id: string;
          bloodGroup?: string;
          availableUnits?: number;
          status?: string;
        }>;

        const formattedData =
          rawData.map(item => ({
            id: String(item.id),

            bloodGroup: String(
              item.bloodGroup ?? '',
            ),

            availableUnits: Number(
              item.availableUnits ?? 0,
            ),

            status: String(
              item.status ?? '',
            ),
          }));

        setInventory(formattedData);
      } catch (err) {
        console.error(
          'Inventory reports loading error:',
          err,
        );

        setError(
          'Unable to load blood inventory.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // ========================================
  // REFRESH
  // ========================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  // ========================================
  // TOTAL BLOOD UNITS
  // ========================================

  const totalBloodUnits = useMemo(() => {
    return inventory.reduce(
      (total, item) =>
        total + item.availableUnits,
      0,
    );
  }, [inventory]);

  // ========================================
  // GROUPS IN STOCK
  // ========================================

  const groupsInStock = useMemo(() => {
    return inventory.filter(
      item => item.availableUnits > 0,
    ).length;
  }, [inventory]);

  // ========================================
  // LOW STOCK GROUPS
  // ========================================

  const lowStockGroups = useMemo(() => {
    return inventory.filter(
      item =>
        item.availableUnits <=
        LOW_STOCK_LIMIT,
    ).length;
  }, [inventory]);

  // ========================================
  // MAXIMUM VALUE
  // ========================================

  const maxUnits = useMemo(() => {
    if (inventory.length === 0) {
      return 1;
    }

    return Math.max(
      ...inventory.map(
        item => item.availableUnits,
      ),
      1,
    );
  }, [inventory]);

  // ========================================
  // SORT BLOOD GROUPS
  // ========================================

  const sortedInventory = useMemo(() => {
    const order = [
      'A+',
      'A-',
      'B+',
      'B-',
      'AB+',
      'AB-',
      'O+',
      'O-',
    ];

    return [...inventory].sort(
      (a, b) => {
        const aIndex =
          order.indexOf(a.bloodGroup);

        const bIndex =
          order.indexOf(b.bloodGroup);

        return (
          (aIndex === -1
            ? 999
            : aIndex) -
          (bIndex === -1
            ? 999
            : bIndex)
        );
      },
    );
  }, [inventory]);

  // ========================================
  // BAR HEIGHT
  // ========================================

  function getBarHeight(
    units: number,
  ) {
    if (units <= 0) {
      return 4;
    }

    const percentage =
      units / maxUnits;

    return Math.max(
      8,
      percentage * 135,
    );
  }

  // ========================================
  // BAR COLOR
  // ========================================

  function getBarColor(
    units: number,
  ) {
    if (units <= LOW_STOCK_LIMIT) {
      return '#F5A623';
    }

    return '#20A66A';
  }

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#C8102E"
        />

        <Text style={styles.loadingText}>
          Loading inventory reports...
        </Text>
      </View>
    );
  }

  // ========================================
  // MAIN SCREEN
  // ========================================

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#C8102E"
          />
        }
      >
        {/* ==================================
            HEADER
        ================================== */}

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

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Reports & Analytics
            </Text>

            <Text style={styles.subtitle}>
              Insights on blood inventory
              & requests
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons
              name="refresh-outline"
              size={20}
              color="#C8102E"
            />
          </Pressable>
        </View>

        {/* ==================================
            ERROR
        ================================== */}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#C8102E"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              onPress={loadInventory}
            >
              <Text
                style={styles.retryText}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {/* ==================================
            BLOOD STOCK LEVELS
        ================================== */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Blood Stock Levels
            </Text>

            <Text style={styles.sectionSubtitle}>
              Available units by blood group
            </Text>
          </View>

          <View style={styles.legend}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    '#20A66A',
                },
              ]}
            />

            <Text style={styles.legendText}>
              Normal
            </Text>

            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    '#F5A623',
                },
              ]}
            />

            <Text style={styles.legendText}>
              Low
            </Text>
          </View>
        </View>

        {/* ==================================
            BAR CHART
        ================================== */}

        <View style={styles.chartCard}>
          {sortedInventory.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons
                name="bar-chart-outline"
                size={40}
                color="#CCC"
              />

              <Text
                style={styles.emptyChartText}
              >
                No blood inventory found
              </Text>
            </View>
          ) : (
            <View style={styles.chart}>
              {/* Y AXIS */}

              <View style={styles.yAxis}>
                <Text
                  style={styles.axisLabel}
                >
                  {maxUnits}
                </Text>

                <Text
                  style={styles.axisLabel}
                >
                  {Math.round(
                    maxUnits * 0.75,
                  )}
                </Text>

                <Text
                  style={styles.axisLabel}
                >
                  {Math.round(
                    maxUnits * 0.5,
                  )}
                </Text>

                <Text
                  style={styles.axisLabel}
                >
                  {Math.round(
                    maxUnits * 0.25,
                  )}
                </Text>

                <Text
                  style={styles.axisLabel}
                >
                  0
                </Text>
              </View>

              {/* CHART AREA */}

              <View style={styles.chartArea}>
                {/* GRID LINES */}

                <View
                  style={[
                    styles.gridLine,
                    { top: 0 },
                  ]}
                />

                <View
                  style={[
                    styles.gridLine,
                    { top: '25%' },
                  ]}
                />

                <View
                  style={[
                    styles.gridLine,
                    { top: '50%' },
                  ]}
                />

                <View
                  style={[
                    styles.gridLine,
                    { top: '75%' },
                  ]}
                />

                <View
                  style={[
                    styles.gridLine,
                    { bottom: 0 },
                  ]}
                />

                {/* BARS */}

                <View
                  style={styles.barsContainer}
                >
                  {sortedInventory.map(
                    item => (
                      <View
                        key={item.id}
                        style={styles.barItem}
                      >
                        <Text
                          style={
                            styles.barValue
                          }
                        >
                          {
                            item.availableUnits
                          }
                        </Text>

                        <View
                          style={
                            styles.barWrapper
                          }
                        >
                          <View
                            style={[
                              styles.bar,
                              {
                                height:
                                  getBarHeight(
                                    item.availableUnits,
                                  ),

                                backgroundColor:
                                  getBarColor(
                                    item.availableUnits,
                                  ),
                              },
                            ]}
                          />
                        </View>

                        <Text
                          style={
                            styles.barLabel
                          }
                        >
                          {
                            item.bloodGroup
                          }
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ==================================
            SUMMARY
        ================================== */}

        <Text style={styles.summaryTitle}>
          Summary
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="water-outline"
            value={totalBloodUnits}
            label={'Total Blood\nUnits'}
          />

          <SummaryCard
            icon="cube-outline"
            value={groupsInStock}
            label={'Groups in\nStock'}
          />

          <SummaryCard
            icon="warning-outline"
            value={lowStockGroups}
            label={'Groups Low\nStock'}
            warning={
              lowStockGroups > 0
            }
          />

          <SummaryCard
            icon="document-text-outline"
            value="—"
            label={'Total\nRequests'}
            disabled
          />
        </View>

        {/* ==================================
            INVENTORY DETAILS
        ================================== */}

        <Text style={styles.detailsTitle}>
          Inventory Details
        </Text>

        <View style={styles.inventoryCard}>
          {sortedInventory.map(
            (item, index) => {
              const isLow =
                item.availableUnits <=
                LOW_STOCK_LIMIT;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.inventoryRow,
                    index ===
                      sortedInventory.length -
                        1 &&
                      styles.lastInventoryRow,
                  ]}
                >
                  <View
                    style={
                      styles.bloodGroupCircle
                    }
                  >
                    <Ionicons
                      name="water-outline"
                      size={18}
                      color="#C8102E"
                    />
                  </View>

                  <View
                    style={
                      styles.inventoryInfo
                    }
                  >
                    <Text
                      style={
                        styles.inventoryGroup
                      }
                    >
                      {item.bloodGroup}
                    </Text>

                    <Text
                      style={
                        styles.inventoryStatus
                      }
                    >
                      {isLow
                        ? 'Low Stock'
                        : 'Normal'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.inventoryUnits
                    }
                  >
                    {item.availableUnits}
                  </Text>

                  <Text
                    style={
                      styles.unitsLabel
                    }
                  >
                    units
                  </Text>
                </View>
              );
            },
          )}
        </View>

        {/* ==================================
            NOTE
        ================================== */}

        <View style={styles.noteBox}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#777"
          />

          <Text style={styles.noteText}>
            Low stock is identified when
            available blood units are 20 or
            below.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ========================================
// SUMMARY CARD
// ========================================

type SummaryCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  warning?: boolean;
  disabled?: boolean;
};

function SummaryCard({
  icon,
  value,
  label,
  warning = false,
  disabled = false,
}: SummaryCardProps) {
  return (
    <View
      style={[
        styles.summaryCard,
        disabled &&
          styles.summaryCardDisabled,
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          warning &&
            styles.summaryIconWarning,
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={
            warning
              ? '#E53935'
              : '#C8102E'
          }
        />
      </View>

      <Text
        style={[
          styles.summaryValue,
          disabled &&
            styles.disabledValue,
        ]}
      >
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  // ======================================
  // LOADING
  // ======================================

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#777',
  },

  // ======================================
  // HEADER
  // ======================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
  },

  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#202020',
  },

  subtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ======================================
  // ERROR
  // ======================================

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#555',
  },

  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C8102E',
  },

  // ======================================
  // SECTION HEADER
  // ======================================

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },

  sectionSubtitle: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 6,
    marginRight: 3,
  },

  legendText: {
    fontSize: 8,
    color: '#777',
  },

  // ======================================
  // CHART
  // ======================================

  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 12,
    marginBottom: 20,
  },

  chart: {
    height: 190,
    flexDirection: 'row',
  },

  yAxis: {
    width: 30,
    height: 155,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 19,
  },

  axisLabel: {
    fontSize: 8,
    color: '#999',
  },

  chartArea: {
    flex: 1,
    height: 175,
    position: 'relative',
    marginLeft: 4,
  },

  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#ECECEC',
  },

  barsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },

  barItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  barValue: {
    fontSize: 8,
    color: '#555',
    marginBottom: 3,
  },

  barWrapper: {
    height: 135,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  bar: {
    width: 17,
    minHeight: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  barLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
    marginTop: 5,
  },

  emptyChart: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyChartText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },

  // ======================================
  // SUMMARY
  // ======================================

  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginBottom: 9,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  summaryCard: {
    width: '48.5%',
    minHeight: 112,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8102E',
    padding: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },

  summaryCardDisabled: {
    borderColor: '#E4E4E4',
  },

  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  summaryIconWarning: {
    backgroundColor: '#FFF1F1',
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C8102E',
  },

  disabledValue: {
    color: '#999',
  },

  summaryLabel: {
    fontSize: 10,
    lineHeight: 13,
    color: '#555',
    fontWeight: '600',
    marginTop: 2,
  },

  // ======================================
  // INVENTORY DETAILS
  // ======================================

  detailsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginBottom: 9,
  },

  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    paddingHorizontal: 12,
  },

  inventoryRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  lastInventoryRow: {
    borderBottomWidth: 0,
  },

  bloodGroupCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inventoryInfo: {
    flex: 1,
    marginLeft: 10,
  },

  inventoryGroup: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },

  inventoryStatus: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },

  inventoryUnits: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },

  unitsLabel: {
    fontSize: 9,
    color: '#888',
    marginLeft: 3,
    marginRight: 4,
  },

  // ======================================
  // NOTE
  // ======================================

  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 4,
  },

  noteText: {
    flex: 1,
    fontSize: 10,
    color: '#888',
    marginLeft: 7,
    lineHeight: 15,
  },
});
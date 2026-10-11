import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  COLORS,
} from '../../../constants/colors';

import DonorScreenShell from '../../donor/components/DonorScreenShell';

import type {
  BloodGroup,
  DonorProfile,
} from '../../donor/types/donor';

import {
  getDonorProfiles,
} from '../../donor/services/donorService';

type BloodGroupFilter = 'all' | BloodGroup;

const BLOOD_GROUPS: BloodGroupFilter[] = [
  'all',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

function getLoadErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'permission-denied'
  ) {
    return 'Firestore denied access to donor profiles. Check the rules for this signed-in admin account.';
  }

  return 'Donor profiles could not be loaded. Check your connection and try again.';
}

function DonorCard({ donor }: { donor: DonorProfile }) {
  const location = [donor.city, donor.district]
    .filter(value => typeof value === 'string' && value.trim())
    .join(', ');

  return (
    <View style={styles.donorCard}>
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={22} color={COLORS.primary} />
      </View>

      <View style={styles.donorDetails}>
        <Text style={styles.donorName} numberOfLines={1}>
          {donor.fullName.trim() || 'Name unavailable'}
        </Text>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>
            {location || 'Location unavailable'}
          </Text>
        </View>

        {donor.phone.trim() ? (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.detailText} numberOfLines={1}>
              {donor.phone}
            </Text>
          </View>
        ) : null}

        <View style={styles.availabilityRow}>
          <View
            style={[
              styles.availabilityDot,
              donor.isAvailable ? styles.availableDot : styles.unavailableDot,
            ]}
          />
          <Text
            style={[
              styles.availabilityText,
              donor.isAvailable ? styles.availableText : styles.unavailableText,
            ]}
          >
            {donor.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>

      <View style={styles.bloodBadge}>
        <Text style={styles.bloodBadgeText}>{donor.bloodGroup ?? '--'}</Text>
      </View>
    </View>
  );
}

export default function DonorManagementScreen() {
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] =
    useState<BloodGroupFilter>('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDonors() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const profiles = await getDonorProfiles();
        if (active) {
          setDonors(profiles);
        }
      } catch (error) {
        console.error('Donor management load error:', error);
        if (active) {
          setErrorMessage(getLoadErrorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDonors();

    return () => {
      active = false;
    };
  }, []);

  const filteredDonors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return donors.filter(donor => {
      const matchesBloodGroup =
        selectedBloodGroup === 'all' ||
        donor.bloodGroup === selectedBloodGroup;
      const matchesSearch =
        query.length === 0 ||
        [donor.fullName, donor.city, donor.district].some(value =>
          (value ?? '').toLowerCase().includes(query),
        );

      return matchesBloodGroup && matchesSearch;
    });
  }, [donors, search, selectedBloodGroup]);

  return (
    <DonorScreenShell>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="people-outline" size={21} color={COLORS.primary} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Donor Management</Text>
            <Text style={styles.subtitle}>Search and review registered donors.</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={COLORS.textMuted} />
          <TextInput
            accessibilityLabel="Search donors by name or location"
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, city, or district"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search.length > 0 ? (
            <Ionicons
              accessibilityLabel="Clear search"
              name="close-circle"
              size={18}
              color={COLORS.textMuted}
              onPress={() => setSearch('')}
            />
          ) : null}
        </View>

        <Text style={styles.filterTitle}>Blood group</Text>
        <View style={styles.filterGrid}>
          {BLOOD_GROUPS.map(group => {
            const active = selectedBloodGroup === group;
            return (
              <Pressable
                key={group}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedBloodGroup(group)}
                style={[styles.filter, active && styles.activeFilter]}
              >
                <Text style={[styles.filterText, active && styles.activeFilterText]}>
                  {group === 'all' ? 'All' : group}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Donors</Text>
          {!loading && !errorMessage ? (
            <Text style={styles.resultsCount}>{filteredDonors.length}</Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Loading donors...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={30} color={COLORS.primary} />
            <Text style={styles.stateTitle}>Unable to load donors</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : filteredDonors.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="people-outline" size={30} color={COLORS.textMuted} />
            <Text style={styles.stateTitle}>No donors found</Text>
            <Text style={styles.stateText}>
              {donors.length === 0
                ? 'There are no donor profiles to display yet.'
                : 'Try changing your search or blood group filter.'}
            </Text>
          </View>
        ) : (
          <View style={styles.donorList}>
            {filteredDonors.map(donor => (
              <DonorCard key={donor.userId} donor={donor} />
            ))}
          </View>
        )}
      </ScrollView>
    </DonorScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  searchBox: {
    height: 48,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    color: COLORS.text,
    fontSize: 13,
  },
  filterTitle: {
    marginTop: 18,
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filter: {
    minWidth: 54,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  activeFilter: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeFilterText: {
    color: COLORS.white,
  },
  resultsHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  resultsCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  donorList: {
    gap: 10,
  },
  donorCard: {
    minHeight: 100,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 43,
    height: 43,
    marginRight: 11,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorDetails: {
    flex: 1,
    minWidth: 0,
  },
  donorName: {
    marginBottom: 4,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  detailRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    flexShrink: 1,
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  availabilityRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  availabilityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availableDot: {
    backgroundColor: COLORS.success,
  },
  unavailableDot: {
    backgroundColor: COLORS.textMuted,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  availableText: {
    color: COLORS.success,
  },
  unavailableText: {
    color: COLORS.textMuted,
  },
  bloodBadge: {
    minWidth: 42,
    height: 42,
    marginLeft: 9,
    paddingHorizontal: 6,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  stateCard: {
    minHeight: 170,
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});

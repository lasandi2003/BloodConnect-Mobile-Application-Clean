import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import PlaceholderScreen from '../../../components/PlaceholderScreen';
import RoleAppShell from '../../../components/RoleAppShell';
import type { DonorProfile, EmergencyRequest } from '../../donor/types/donor';
import type { VerificationMatchingStackParamList } from '../navigation/types';
import { getMatchingDonors, getVerificationRequestById } from '../services/verificationService';

type Props = NativeStackScreenProps<VerificationMatchingStackParamList, 'MatchingDonors'>;

function valueOrEmpty(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || ['Not specified', 'Location unavailable', 'null', 'undefined'].includes(trimmed)) {
    return '';
  }
  return trimmed;
}

function donorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

function RequestSummary({
  request,
  selectedCount,
}: {
  request: EmergencyRequest;
  selectedCount: number;
}) {
  const requestDetails = [
    valueOrEmpty(request.patientName) === 'Patient' ? '' : valueOrEmpty(request.patientName),
    valueOrEmpty(request.hospitalName) === 'Hospital' ? '' : valueOrEmpty(request.hospitalName),
    valueOrEmpty(request.location),
  ].filter(Boolean);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View>
          <Text style={styles.summaryEyebrow}>MATCHING FOR</Text>
          <Text style={styles.requestId} numberOfLines={1} ellipsizeMode="middle">#{request.id}</Text>
        </View>
        <View style={styles.verifiedPill}>
          <Ionicons name="checkmark-circle" size={14} color="#15945B" />
          <Text style={styles.verifiedText}>VERIFIED</Text>
        </View>
      </View>
      <View style={styles.summaryMain}>
        <View style={styles.summaryBloodBadge}><Text style={styles.summaryBloodText}>{request.bloodGroup}</Text></View>
        <View style={styles.summaryDescription}>
          <Text style={styles.unitsText}>{request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'} needed</Text>
          {requestDetails.length ? (
            <Text style={styles.summaryDetails} numberOfLines={2}>{requestDetails.join(' · ')}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.selectionProgress}>
        <View style={styles.progressHeading}>
          <Text style={styles.progressLabel}>Donors selected</Text>
          <Text style={styles.progressCount}>{selectedCount} of {requiredDonorCount(request)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent(selectedCount, requiredDonorCount(request))}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function requiredDonorCount(request: EmergencyRequest): number {
  return Number.isFinite(request.unitsRequired)
    ? Math.max(0, Math.floor(request.unitsRequired))
    : 0;
}

function progressPercent(selected: number, required: number): number {
  return required > 0 ? Math.min(100, (selected / required) * 100) : 0;
}

function DonorCard({
  donor,
  selected,
  selectionDisabled,
  onToggle,
  onView,
}: {
  donor: DonorProfile;
  selected: boolean;
  selectionDisabled: boolean;
  onToggle: () => void;
  onView: () => void;
}) {
  const donorName = valueOrEmpty(donor.fullName) || 'Donor';
  const location = [valueOrEmpty(donor.city), valueOrEmpty(donor.district)].filter(Boolean).join(', ');
  const lastDonation = valueOrEmpty(donor.lastDonationDate);

  return (
    <View style={[styles.donorCard, selected && styles.donorCardSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${donorName}`}
        accessibilityState={{ selected, disabled: selectionDisabled }}
        disabled={selectionDisabled}
        onPress={onToggle}
        style={styles.donorSelectArea}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{donorInitials(donorName) || 'D'}</Text></View>
          {selected ? <View style={styles.selectedCheck}><Ionicons name="checkmark" size={10} color={COLORS.white} /></View> : null}
        </View>
        <View style={styles.donorCopy}>
          <View style={styles.nameLine}>
            <Text style={styles.donorName} numberOfLines={1}>{donorName}</Text>
            <View style={styles.availableBadge}>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>Available</Text>
            </View>
          </View>
          <View style={styles.donorMetaLine}>
            <Text style={styles.donorBloodBadge}>{donor.bloodGroup}</Text>
            {location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
              </View>
            ) : null}
          </View>
          {lastDonation ? (
            <Text style={styles.lastDonation} numberOfLines={1}>Last donation: {lastDonation}</Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View details for ${donorName}`}
        onPress={onView}
        style={styles.viewButton}
      >
        <Text style={styles.viewButtonText}>View</Text>
      </Pressable>
    </View>
  );
}

function MatchingDonorsContent({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [requestLoading, setRequestLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [donorsError, setDonorsError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDonorIds, setSelectedDonorIds] = useState<string[]>([]);
  const requiredCount = request ? requiredDonorCount(request) : 0;
  const selectedDonorIdFromDetails = route.params.selectedDonorId;

  useEffect(() => {
    if (!selectedDonorIdFromDetails) return;
    setSelectedDonorIds(current => {
      if (current.includes(selectedDonorIdFromDetails) || current.length >= requiredCount) {
        return current;
      }
      return [...current, selectedDonorIdFromDetails];
    });
    navigation.setParams({ selectedDonorId: undefined });
  }, [navigation, requiredCount, selectedDonorIdFromDetails]);

  const loadRequest = useCallback(async () => {
    setRequestLoading(true);
    setRequestError(null);
    try {
      const loadedRequest = await getVerificationRequestById(requestId);
      setRequest(loadedRequest?.verified ? loadedRequest : null);
      if (!loadedRequest) setRequestError('This request could not be found.');
      else if (!loadedRequest.verified) setRequestError('This request has not been verified yet.');
    } catch (error) {
      console.error('Matching request load error:', error);
      setRequestError('Unable to load the verified request. Check your connection and access.');
    } finally {
      setRequestLoading(false);
    }
  }, [requestId]);

  const loadDonors = useCallback(async () => {
    if (!request) return;
    setDonorsLoading(true);
    setDonorsError(null);
    try {
      setDonors(await getMatchingDonors(request.bloodGroup));
    } catch (error) {
      console.error('Matching donor load error:', error);
      setDonors([]);
      setDonorsError('Unable to load matching donors. Check your connection and access.');
    } finally {
      setDonorsLoading(false);
    }
  }, [request]);

  useEffect(() => { void loadRequest(); }, [loadRequest]);
  useEffect(() => { if (request) void loadDonors(); }, [loadDonors, request]);

  const filteredDonors = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return donors;
    return donors.filter(donor =>
      [donor.fullName, donor.city, donor.district]
        .some(value => valueOrEmpty(value).toLocaleLowerCase().includes(needle)),
    );
  }, [donors, search]);

  const toggleDonor = useCallback((donorId: string) => {
    setSelectedDonorIds(current => {
      if (current.includes(donorId)) {
        return current.filter(id => id !== donorId);
      }
      if (current.length >= requiredCount) {
        return current;
      }
      return [...current, donorId];
    });
  }, [requiredCount]);

  const listHeader = request ? (
    <>
      <RequestSummary request={request} selectedCount={selectedDonorIds.length} />
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionHeadingCopy}>
          <Text style={styles.sectionTitle}>Matching donors ({request.bloodGroup})</Text>
          <Text style={styles.sectionSubtitle}>Available donors with the same blood group</Text>
        </View>
        {!donorsLoading && !donorsError ? <Text style={styles.foundCount}>{donors.length} available</Text> : null}
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search matching donors..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search matching donors"
          />
          {search ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </>
  ) : null;

  const listEmpty = () => {
    if (donorsLoading) {
      return <View style={styles.listState}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.stateText}>Finding matching donors...</Text></View>;
    }
    if (donorsError) {
      return (
        <View style={styles.listState}>
          <Ionicons name="cloud-offline-outline" size={30} color={COLORS.primary} />
          <Text style={styles.stateTitle}>Unable to load matching donors</Text>
          <Text style={styles.stateText}>{donorsError}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadDonors()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.listState}>
        <View style={styles.emptyIcon}><Ionicons name="people-outline" size={27} color={COLORS.primary} /></View>
        <Text style={styles.stateTitle}>{search.trim() ? 'No donors match your search' : 'No matching donors found'}</Text>
        <Text style={styles.stateText}>
          {search.trim()
            ? 'Try another name or location.'
            : `We couldn't find an available ${request?.bloodGroup ?? ''} donor for this request.`}
        </Text>
      </View>
    );
  };

  if (requestLoading || requestError || !request) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to request" onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={19} color={COLORS.primary} />
            </Pressable>
            <View><Text style={styles.pageTitle}>Donor matching</Text><Text style={styles.pageSubtitle}>Back to request</Text></View>
          </View>
          <View style={styles.listState}>
            {requestLoading ? <ActivityIndicator size="large" color={COLORS.primary} /> : <Ionicons name="cloud-offline-outline" size={30} color={COLORS.primary} />}
            <Text style={styles.stateTitle}>{requestLoading ? 'Loading verified request...' : 'Unable to load request'}</Text>
            {requestError ? <Text style={styles.stateText}>{requestError}</Text> : null}
            {requestError ? <Pressable accessibilityRole="button" onPress={() => void loadRequest()} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable> : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to request" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={19} color={COLORS.primary} />
          </Pressable>
          <View><Text style={styles.pageTitle}>Donor matching</Text><Text style={styles.pageSubtitle}>Back to request</Text></View>
        </View>
        <FlatList
          data={filteredDonors}
          keyExtractor={donor => donor.userId}
          renderItem={({ item }) => {
            const selected = selectedDonorIds.includes(item.userId);
            return (
              <DonorCard
                donor={item}
                selected={selected}
                selectionDisabled={!selected && selectedDonorIds.length >= requiredCount}
                onToggle={() => toggleDonor(item.userId)}
                onView={() => navigation.navigate('DonorDetails', {
                  requestId,
                  donorId: item.userId,
                  donorAlreadySelected: selected,
                  canSelectDonor: selected || selectedDonorIds.length < requiredCount,
                })}
              />
            );
          }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={donorsLoading && donors.length > 0} onRefresh={() => void loadDonors()} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        />
        <View style={styles.actionBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Confirm match, ${selectedDonorIds.length} of ${requiredCount} donors selected`}
            accessibilityHint="Match confirmation is not available yet."
            accessibilityState={{ disabled: true }}
            disabled
            style={styles.confirmButton}
          >
            <Ionicons name="checkmark-done-circle-outline" size={19} color={COLORS.white} />
            <Text style={styles.confirmButtonText}>Confirm match ({selectedDonorIds.length} of {requiredCount})</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function MatchingDonorsScreen(props: Props) {
  const { navigation } = props;

  return (
    <RoleAppShell
      home={<PlaceholderScreen title="Healthcare dashboard" description="Return to your verification dashboard." />}
      activityContent={<PlaceholderScreen title="Pending requests" description="Review blood requests waiting for verification." />}
      activity={{ title: 'Pending Requests', description: 'Requests waiting for healthcare verification.' }}
      servicesContent={<MatchingDonorsContent {...props} />}
      services={{ title: 'Donor Matching', description: 'Review available donors for the verified request.' }}
      profile={{ title: 'Healthcare Profile', description: 'Healthcare account details.' }}
      initialTab="services"
      tabLabels={{ home: 'Home', activity: 'Requests', services: 'Donors', profile: 'Profile' }}
      activeTabColor="#C8102E"
      bottomBorderColor="#F3C9CF"
      tabIcons={{
        activity: { icon: 'document-text-outline', activeIcon: 'document-text' },
        services: { icon: 'people-outline', activeIcon: 'people' },
      }}
      tabPressHandlers={{
        home: () => navigation.popToTop(),
        activity: () => navigation.navigate('PendingBloodRequests'),
      }}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF5F5' },
  page: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 18 },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F3E4E6' },
  pageTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  pageSubtitle: { marginTop: 2, color: COLORS.textSecondary, fontSize: 11 },
  listContent: { paddingTop: 7, paddingBottom: 22, flexGrow: 1 },
  summaryCard: { padding: 15, borderRadius: 19, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 9, elevation: 4 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryEyebrow: { color: '#FFE5E9', fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  requestId: { marginTop: 3, color: COLORS.white, fontSize: 17, fontWeight: '800' },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 18, backgroundColor: COLORS.white },
  verifiedText: { color: '#138150', fontSize: 8, fontWeight: '800' },
  summaryMain: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  summaryBloodBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  summaryBloodText: { color: COLORS.primary, fontSize: 17, fontWeight: '800' },
  summaryDescription: { flex: 1, minWidth: 0 },
  unitsText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  summaryDetails: { marginTop: 4, color: '#FFE5E9', fontSize: 10, lineHeight: 14 },
  selectionProgress: { marginTop: 13 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: '#FFE5E9', fontSize: 10, fontWeight: '600' },
  progressCount: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  progressTrack: { height: 5, marginTop: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.3)' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.white },
  sectionTitleRow: { marginTop: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionHeadingCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { marginTop: 2, color: COLORS.textSecondary, fontSize: 10 },
  foundCount: { color: COLORS.primary, backgroundColor: '#FCEAEC', overflow: 'hidden', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '700' },
  searchRow: { marginBottom: 12 },
  searchBox: { minHeight: 44, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: '#F0DEE1', backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 8, color: COLORS.text, fontSize: 12 },
  donorCard: { minHeight: 78, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#F2E4E6', backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  donorCardSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF8F9' },
  donorSelectArea: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  selectedCheck: { position: 'absolute', right: -3, bottom: -3, width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white },
  donorCopy: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  donorName: { flex: 1, minWidth: 0, color: COLORS.text, fontSize: 12, fontWeight: '800' },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 10, backgroundColor: '#E8F6EF' },
  availableDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#15945B' },
  availableText: { color: '#138150', fontSize: 8, fontWeight: '700' },
  donorMetaLine: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  donorBloodBadge: { overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: '#FCEAEC', color: COLORS.primary, fontSize: 9, fontWeight: '800' },
  metaItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { flex: 1, color: COLORS.textSecondary, fontSize: 9 },
  lastDonation: { marginTop: 4, color: COLORS.textMuted, fontSize: 9 },
  viewButton: { minWidth: 48, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#E9B8C0', alignItems: 'center', justifyContent: 'center', opacity: 0.65 },
  viewButtonText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  itemSeparator: { height: 9 },
  actionBar: { paddingTop: 9, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#F2E1E4', backgroundColor: '#FFF5F5' },
  confirmButton: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.78, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 5, elevation: 3 },
  confirmButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  listState: { flexGrow: 1, minHeight: 210, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  stateTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  stateText: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  retryButton: { marginTop: 3, paddingHorizontal: 17, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
});

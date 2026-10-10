import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../../constants/colors';
import { auth } from '../../../config/firebase';
import { useAuth } from '../../auth/context/AuthContext';
import DonorScreenShell from '../components/DonorScreenShell';
import type { DonorStackParamList } from '../navigation/types';
import type { Coordinates, DonationCentre } from '../types/donationCentre';
import { getDonationCentreError, watchActiveDonationCentres } from '../services/donationCentreService';
import { centrePhoneUrl, directionsUrl, nearbyCentres, validCoordinates } from '../utils/donationCentres';

type Props = NativeStackScreenProps<DonorStackParamList, 'FindDonationCentres'>;

export default function FindDonationCentresScreen({ navigation }: Props) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [result, setResult] = useState<{ uid: string; centres: DonationCentre[]; cached: boolean; skipped: number } | null>(null);
  const [position, setPosition] = useState<{ uid: string; coordinates: Coordinates } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [retry, setRetry] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Use your location to see the closest centres first.');
  const [actionError, setActionError] = useState('');
  const locationAttempt = useRef(0);
  const locationLock = useRef(false);
  const visible = useRef(false);

  useFocusEffect(useCallback(() => {
    visible.current = true;
    setLocating(false);
    setLocationMessage('Location is optional. Browse centres or use your location to sort by distance.');
    return () => {
      visible.current = false;
      locationAttempt.current++; locationLock.current = false;
    };
  }, [uid]));

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(''); setResult(null); setActionError('');
    if (!uid) {
      setLoading(false); setError('Please sign in to view donation centres.');
      return () => { active = false; };
    }
    const stop = watchActiveDonationCentres(uid, (centres, cached, skipped) => {
      if (!active) return;
      setResult({ uid, centres, cached, skipped }); setLoading(false); setError('');
    }, failure => {
      if (!active) return;
      setResult(null); setLoading(false); setError(getDonationCentreError(failure));
    });
    return () => {
      active = false; stop();
    };
  }, [uid, retry]));

  const current = result?.uid === uid ? result : null;
  const origin = position?.uid === uid ? position?.coordinates ?? null : null;
  const centres = useMemo(() => nearbyCentres(current?.centres ?? [], origin, search), [current, origin, search]);

  async function useLocation() {
    if (!uid || locationLock.current) return;
    locationLock.current = true;
    const attempt = ++locationAttempt.current;
    const stillActive = () => visible.current && locationAttempt.current === attempt && auth.currentUser?.uid === uid;
    setLocating(true); setLocationMessage('Waiting for location permission...');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!stillActive()) return;
      if (permission.status !== 'granted') {
        setPosition(null);
        setLocationMessage('Location permission is denied. You can still browse and search. Enable location in your device or browser settings to sort by distance.');
        return;
      }
      if (!await Location.hasServicesEnabledAsync()) throw new Error('Location services are switched off. Turn them on and retry, or continue browsing.');
      if (!stillActive()) return;
      setLocationMessage('Finding your location...');
      const fix = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Location took too long. Try again outdoors, or continue searching without it.')), 20000); }),
      ]);
      if (!stillActive()) return;
      const coordinates = { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
      if (!validCoordinates(coordinates)) throw new Error('Your location could not be read. Please retry.');
      setPosition({ uid, coordinates });
      setLocationMessage('Sorted nearest first. Distances are approximate, straight-line distances—not travel distances.');
    } catch (failure) {
      if (stillActive()) setLocationMessage(failure instanceof Error ? failure.message : 'Unable to find your location. You can still browse and search.');
    } finally {
      if (timer) clearTimeout(timer);
      if (stillActive()) { locationLock.current = false; setLocating(false); }
    }
  }

  async function openAction(url: string, label: string) {
    setActionError('');
    try { await Linking.openURL(url); }
    catch { if (visible.current) setActionError(`Unable to open ${label} on this device. Please try on a phone or open it manually.`); }
  }

  return (
    <DonorScreenShell>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back to donor dashboard"><Ionicons name="chevron-back" size={25} color={COLORS.text} /></Pressable>
          <Text style={styles.heading}>Donation Centres</Text>
          <Pressable style={styles.headerButton} onPress={() => setRetry(value => value + 1)} accessibilityRole="button" accessibilityLabel="Refresh donation centres"><Ionicons name="refresh" size={22} color={COLORS.primary} /></Pressable>
        </View>
        <FlatList data={centres} keyExtractor={item => item.id} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          refreshing={loading} onRefresh={() => setRetry(value => value + 1)}
          ListHeaderComponent={<>
            <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="location-outline" size={29} color={COLORS.white} /></View><Text style={styles.heroTitle}>Find Nearby Donation Centres</Text><Text style={styles.heroText}>Find a donation location and plan your visit.</Text></View>
            <View style={styles.locationCard}>
              <Text style={styles.cardTitle}>{origin ? 'Your nearest centres' : 'Discover centres near you'}</Text>
              <Text style={styles.description}>{locationMessage}</Text>
              <Pressable style={[styles.locationButton, locating && styles.disabled]} onPress={useLocation} disabled={locating} accessibilityRole="button" accessibilityState={{ disabled: locating }}>
                {locating ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />}<Text style={styles.link}>{locating ? 'Finding location...' : origin ? 'Update my location' : 'Use my location'}</Text>
              </Pressable>
            </View>
            <View style={styles.searchBox}><Ionicons name="search-outline" size={20} color={COLORS.textMuted} /><TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Search centre name or district" placeholderTextColor={COLORS.textMuted} accessibilityLabel="Search centres by name or district" />{!!search && <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search"><Ionicons name="close-circle" size={22} color={COLORS.textMuted} /></Pressable>}</View>
            <Text style={styles.note}>Contact the centre to confirm donation hours, eligibility and availability before visiting.</Text>
            {loading && <ActivityIndicator style={styles.loading} color={COLORS.primary} accessibilityLabel="Loading donation centres" />}
            {!!error && <View style={styles.stateCard}><Text style={styles.error}>{error}</Text><Pressable style={styles.retry} onPress={() => setRetry(value => value + 1)} accessibilityRole="button"><Text style={styles.link}>Try again</Text></Pressable></View>}
            {!!actionError && <Text style={styles.error}>{actionError}</Text>}
            {current?.cached && <Text style={styles.note}>Showing cached centres. Connect to the internet to confirm the latest listing.</Text>}
            {!!current?.skipped && <Text style={styles.error}>{current.skipped} listing(s) have incomplete or invalid details and could not be displayed. Please contact the administrator.</Text>}
            {!!current && <View style={styles.results}><Text style={styles.cardTitle}>{centres.length} {centres.length === 1 ? 'centre' : 'centres'}</Text><Text style={styles.note}>{origin ? 'Nearest first' : 'Name A–Z'}</Text></View>}
          </>}
          ListEmptyComponent={!loading && !error && current && !current.skipped ? <View style={styles.stateCard}><Ionicons name="location-outline" size={38} color={COLORS.primary} /><Text style={styles.cardTitle}>{search.trim() && current.centres.length ? 'No matching centres' : current.cached ? 'No cached centres' : 'No active centres listed'}</Text><Text style={styles.description}>{search.trim() && current.centres.length ? 'Try another centre name or district.' : current.cached ? 'Connect to the internet and refresh.' : 'Donation centres will appear when verified details are added by the administrator.'}</Text></View> : null}
          renderItem={({ item }) => <View style={styles.centreCard}>
            <View style={styles.cardTop}><View style={styles.centreIcon}><Ionicons name="business-outline" size={23} color={COLORS.primary} /></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.district}>{item.district}</Text></View>{item.distanceKm !== null && <View style={styles.distance}><Text style={styles.link}>{item.distanceKm.toFixed(1)} km</Text></View>}</View>
            <Text style={styles.address}>{item.address}</Text><Text selectable style={styles.phone}>{item.phone}</Text>
            <View style={styles.actions}><Pressable style={styles.callButton} onPress={() => openAction(centrePhoneUrl(item.phone), 'the phone dialer')} accessibilityRole="button" accessibilityLabel={`Call ${item.name}`}><Ionicons name="call-outline" size={18} color={COLORS.primary} /><Text style={styles.link}>Call</Text></Pressable><Pressable style={styles.directionsButton} onPress={() => openAction(directionsUrl(item), 'Google Maps')} accessibilityRole="button" accessibilityLabel={`Get directions to ${item.name}`}><Ionicons name="navigate-outline" size={18} color={COLORS.white} /><Text style={styles.whiteText}>Get Directions</Text></Pressable></View>
          </View>} />
      </View>
    </DonorScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }, headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, heading: { flex: 1, color: COLORS.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  content: { padding: 18, paddingTop: 4, paddingBottom: 30, gap: 14 }, hero: { padding: 22, borderRadius: 20, backgroundColor: COLORS.primary, marginBottom: 16 }, heroIcon: { marginBottom: 12 }, heroTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', lineHeight: 31 }, heroText: { color: COLORS.white, marginTop: 9, lineHeight: 21 },
  locationCard: { padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, backgroundColor: COLORS.white, marginBottom: 16 }, cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', lineHeight: 23 }, description: { color: COLORS.textSecondary, lineHeight: 21, marginTop: 8 }, locationButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 10 }, link: { color: COLORS.primary, fontWeight: '700', fontSize: 13 }, disabled: { opacity: 0.6 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 13, paddingHorizontal: 14, marginBottom: 12 }, search: { flex: 1, minHeight: 50, color: COLORS.text, fontSize: 14 }, note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19 }, loading: { margin: 20 }, error: { color: COLORS.danger, lineHeight: 21, marginTop: 10 }, retry: { minHeight: 44, justifyContent: 'center' }, stateCard: { padding: 22, gap: 10, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }, results: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 4 },
  centreCard: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 18 }, cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, centreIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: COLORS.softBackground, justifyContent: 'center', alignItems: 'center' }, cardCopy: { flex: 1 }, district: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }, distance: { backgroundColor: COLORS.softBackground, padding: 8, borderRadius: 10 }, address: { color: COLORS.textSecondary, lineHeight: 22, marginTop: 16 }, phone: { color: COLORS.textSecondary, marginTop: 8 }, actions: { flexDirection: 'row', gap: 10, marginTop: 18 }, callButton: { flex: 1, minHeight: 46, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, borderRadius: 11, borderWidth: 1, borderColor: COLORS.border }, directionsButton: { flex: 2, minHeight: 46, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, borderRadius: 11, backgroundColor: COLORS.primary }, whiteText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});

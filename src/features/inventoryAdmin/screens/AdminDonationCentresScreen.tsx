import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';
import CentreLocationPicker from '../components/CentreLocationPicker';
import { validMapCoordinates } from '../components/centreMapHtml';
import { adminCentreError, centreForm, newCentreId, saveAdminCentre, validateCentre, watchAdminCentres, type AdminCentre, type CentreFields, type CentreForm } from '../services/adminDonationCentreService';

const labels = { name: 'Centre name', address: 'Address', district: 'District', phone: 'Phone number', latitude: 'Latitude', longitude: 'Longitude' } as const;
export default function AdminDonationCentresScreen() {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const authorized = !!uid && profile?.uid === uid && profile.role === 'admin' && profile.status === 'active';
  const [centres, setCentres] = useState<AdminCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState<{ id: string; original: AdminCentre | null } | null>(null);
  const [form, setForm] = useState<CentreForm>(centreForm());
  const [errors, setErrors] = useState<Partial<Record<keyof CentreForm, string>>>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const busy = useRef(false);
  const [confirmation, setConfirmation] = useState<{ id: string; original: AdminCentre; fields: CentreFields; fromEditor: boolean } | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    setCentres([]); setLoading(true); setError(''); setEditor(null); setConfirmation(null); setMapOpen(false);
    if (!uid || !authorized) { setLoading(false); setError('An active administrator account is required.'); return; }
    const unsubscribe = watchAdminCentres(uid, (items, fromCache) => { if (active) { setCentres(items); setCached(fromCache); setLoading(false); } }, failure => { if (active) { setCentres([]); setError(adminCentreError(failure)); setLoading(false); } });
    return () => { active = false; unsubscribe(); };
  }, [uid, authorized, retry]));
  function edit(item: AdminCentre | null) {
    setMapOpen(false);
    setForm(centreForm(item?.data)); setErrors({}); setSaveError(''); setNotice('');
    setEditor({ id: item?.id ?? newCentreId(), original: item });
  }
  async function persist(id: string, fields: CentreFields, original: AdminCentre | null, fromEditor: boolean) {
    if (busy.current || !uid || !authorized) return;
    busy.current = true; setSaving(true); setSaveError(''); setError(''); setNotice('');
    try { await saveAdminCentre(uid, id, fields, original); setConfirmation(null); if (fromEditor) setEditor(null); setNotice('Donation centre saved.'); }
    catch (failure) { const message = adminCentreError(failure); if (fromEditor) setSaveError(message); else setError(message); setConfirmation(null); }
    finally { busy.current = false; setSaving(false); }
  }
  function submit() {
    if (!editor) return;
    const result = validateCentre(form); setErrors(result.errors); setSaveError('');
    if (!result.fields) return;
    if (editor.original?.data.isActive === true && !result.fields.isActive) setConfirmation({ ...editor, original: editor.original, fields: result.fields, fromEditor: true });
    else void persist(editor.id, result.fields, editor.original, true);
  }
  function toggle(item: AdminCentre) {
    const result = validateCentre({ ...centreForm(item.data), isActive: item.data.isActive !== true });
    if (!result.fields) { edit(item); setErrors(result.errors); setSaveError('Correct this centre’s details before changing its status.'); return; }
    if (!result.fields.isActive) setConfirmation({ id: item.id, original: item, fields: result.fields, fromEditor: false });
    else void persist(item.id, result.fields, item, false);
  }
  const query = search.trim().toLowerCase();
  const coordinateCandidate = { latitude: Number(form.latitude), longitude: Number(form.longitude) };
  const coordinates = form.latitude.trim() && form.longitude.trim() && validMapCoordinates(coordinateCandidate) ? coordinateCandidate : null;
  const rows = authorized ? centres.filter(item => [item.data.name, item.data.district].some(value => typeof value === 'string' && value.toLowerCase().includes(query))) : [];
  return <View style={styles.root}>
    <View style={styles.header}><View style={styles.grow}><Text style={styles.title}>Manage Donation Centres</Text><Text style={styles.muted}>Public listings for the donor locator.</Text></View><Pressable disabled={!authorized || saving} style={styles.button} onPress={() => edit(null)} accessibilityRole="button"><Text style={styles.white}>+ Add</Text></Pressable></View>
    <TextInput value={search} onChangeText={setSearch} placeholder="Search name or district" accessibilityLabel="Search donation centres" style={styles.input} />
    {!!notice && <Text style={styles.muted} accessibilityLiveRegion="polite">{notice}</Text>}
    {!!error && <View><Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text><Pressable onPress={() => setRetry(value => value + 1)} style={styles.secondary}><Text style={styles.red}>Retry</Text></Pressable></View>}
    {loading && <ActivityIndicator color={COLORS.primary} accessibilityLabel="Loading donation centres" />}
    {cached && !loading && !error && <Text style={styles.muted}>Showing cached listings. Changes require an internet connection.</Text>}
    <FlatList data={rows} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled" refreshing={loading} onRefresh={() => setRetry(value => value + 1)} contentContainerStyle={styles.list}
      ListEmptyComponent={!loading && !error ? <Text style={styles.muted}>{centres.length ? 'No centres match your search.' : 'No donation centres yet. Add a verified public listing.'}</Text> : null}
      renderItem={({ item }) => <View style={styles.card}><Text style={styles.cardTitle}>{String(item.data.name ?? 'Name missing')}</Text><Text style={styles.red}>{item.data.isActive === true ? 'Active' : 'Inactive'}</Text><Text style={styles.muted}>{String(item.data.address ?? 'Address missing')}</Text><Text style={styles.muted}>{String(item.data.district ?? 'District missing')} • {String(item.data.phone ?? 'Phone missing')}</Text><Text style={styles.muted}>Opening Hours: {typeof item.data.openingHours === 'string' && item.data.openingHours.trim() ? item.data.openingHours : 'Not recorded'}</Text><Text style={styles.muted}>Coordinates: {String(item.data.latitude ?? 'Missing')}, {String(item.data.longitude ?? 'Missing')}</Text><View style={styles.actions}><Pressable disabled={saving} style={styles.secondary} onPress={() => edit(item)} accessibilityRole="button"><Text style={styles.red}>Edit</Text></Pressable><Pressable disabled={saving} style={styles.secondary} onPress={() => toggle(item)} accessibilityRole="button"><Text style={styles.red}>{item.data.isActive === true ? 'Deactivate' : 'Activate'}</Text></Pressable></View></View>} />
    <Modal visible={!!editor && authorized} animationType="slide" onRequestClose={() => { if (mapOpen) setMapOpen(false); else if (!saving) setEditor(null); }}>
      <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{mapOpen ? <CentreLocationPicker initial={coordinates} onCancel={() => setMapOpen(false)} onSelect={point => {
        setForm(current => ({ ...current, latitude: point.latitude.toFixed(6), longitude: point.longitude.toFixed(6) }));
        setErrors(current => ({ ...current, latitude: undefined, longitude: undefined }));
        setMapOpen(false);
      }} /> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
        <Text style={styles.title}>{editor?.original ? 'Edit Donation Centre' : 'Add Donation Centre'}</Text><Text style={styles.muted}>Use verified contact details and coordinates. Active listings are visible to donors.</Text>
        <View style={styles.card}><Pressable disabled={saving || !!confirmation} style={styles.secondary} onPress={() => setMapOpen(true)} accessibilityRole="button"><Text style={styles.red}>Select Location on Map</Text></Pressable><Text style={styles.muted}>Tap a point on the map, or enter coordinates manually below.</Text><Text selectable style={styles.muted} accessibilityLiveRegion="polite">{coordinates ? `Selected coordinates: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}` : 'No valid coordinates selected yet.'}</Text></View>
        {(Object.keys(labels) as (keyof typeof labels)[]).map(key => <View key={key}><Text style={styles.label}>{labels[key]} *</Text><TextInput value={form[key]} editable={!saving} onChangeText={value => setForm(current => ({ ...current, [key]: value }))} style={styles.input} accessibilityLabel={labels[key]} keyboardType={key === 'phone' ? 'phone-pad' : 'default'} inputMode={key === 'latitude' || key === 'longitude' ? 'text' : key === 'phone' ? 'tel' : 'text'} autoCapitalize={key === 'latitude' || key === 'longitude' || key === 'phone' ? 'none' : 'sentences'} multiline={key === 'address'} />{!!errors[key] && <Text style={styles.error}>{errors[key]}</Text>}</View>)}
        <View><Text style={styles.label}>Opening Hours (optional)</Text><Text style={styles.muted}>Enter confirmed days and hours only. Leave blank if unknown.</Text><TextInput value={form.openingHours ?? ''} editable={!saving} onChangeText={openingHours => setForm(current => ({ ...current, openingHours }))} placeholder="e.g. Mon–Fri: 8:00 AM–4:00 PM; weekends: closed" multiline maxLength={500} style={styles.input} accessibilityLabel="Confirmed opening hours" />{!!errors.openingHours && <Text style={styles.error}>{errors.openingHours}</Text>}</View>
        <View style={styles.actions}><Text style={styles.label}>Active listing</Text><Switch disabled={saving} value={form.isActive} onValueChange={isActive => setForm(current => ({ ...current, isActive }))} trackColor={{ true: COLORS.primary }} accessibilityLabel="Active listing" /></View>
        {!!saveError && <Text style={styles.error} accessibilityLiveRegion="polite">{saveError}</Text>}
        <View style={styles.actions}><Pressable disabled={saving} style={styles.secondary} onPress={() => setEditor(null)}><Text style={styles.red}>Cancel</Text></Pressable><Pressable disabled={saving} style={styles.button} onPress={submit}><Text style={styles.white}>{saving ? 'Saving…' : 'Save Centre'}</Text></Pressable></View>
        {!!confirmation && <View style={styles.card}><Text style={styles.cardTitle}>Deactivate this centre?</Text><Text style={styles.muted}>It will disappear from donor searches. Its saved record will remain.</Text><View style={styles.actions}><Pressable disabled={saving} style={styles.secondary} onPress={() => setConfirmation(null)}><Text style={styles.red}>Keep active</Text></Pressable><Pressable disabled={saving} style={styles.button} onPress={() => void persist(confirmation.id, confirmation.fields, confirmation.original, true)}><Text style={styles.white}>{saving ? 'Saving…' : 'Deactivate'}</Text></Pressable></View></View>}
      </ScrollView>}</KeyboardAvoidingView>
    </Modal>
    <Modal visible={!!confirmation && !confirmation.fromEditor && authorized} transparent animationType="fade" onRequestClose={() => { if (!saving) setConfirmation(null); }}><View style={styles.overlay}><View style={styles.card}><Text style={styles.cardTitle}>Deactivate this centre?</Text><Text style={styles.muted}>Hide it from donors while keeping its saved record.</Text><View style={styles.actions}><Pressable disabled={saving} style={styles.secondary} onPress={() => setConfirmation(null)}><Text style={styles.red}>Cancel</Text></Pressable><Pressable disabled={saving} style={styles.button} onPress={() => { if (confirmation) void persist(confirmation.id, confirmation.fields, confirmation.original, false); }}><Text style={styles.white}>{saving ? 'Saving…' : 'Deactivate'}</Text></Pressable></View></View></View></Modal>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, padding: 18, gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, grow: { flex: 1 }, title: { fontSize: 22, fontWeight: '700', color: COLORS.text }, muted: { color: COLORS.textSecondary, lineHeight: 21, marginTop: 5 }, red: { color: COLORS.primary, fontWeight: '600' }, white: { color: COLORS.white, fontWeight: '700' },
  button: { backgroundColor: COLORS.primary, minHeight: 44, padding: 13, borderRadius: 12, justifyContent: 'center' }, secondary: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, minHeight: 44, padding: 13, borderRadius: 12, justifyContent: 'center' }, input: { color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 13, minHeight: 48, backgroundColor: COLORS.white }, list: { gap: 12, paddingBottom: 24 }, card: { padding: 18, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border }, cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text }, actions: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }, label: { color: COLORS.text, fontWeight: '600', marginBottom: 7 }, error: { color: COLORS.danger, lineHeight: 21 }, modal: { flex: 1, backgroundColor: COLORS.background }, form: { padding: 24, paddingTop: 50, gap: 18, paddingBottom: 60 }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
});

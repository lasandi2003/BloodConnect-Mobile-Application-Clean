import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';
import { ADMIN_SECTIONS, loadAdminOverview, type AdminOverview, type AdminSection } from '../services/adminOverviewService';
import PendingApprovalsScreen from './PendingApprovalsScreen';
import AdminDonationCentresScreen from './AdminDonationCentresScreen';

const labels: Record<AdminSection, string> = { users: 'Users', donorProfiles: 'Donors', emergencyRequests: 'Requests', bloodInventory: 'Inventory', donorResponses: 'Responses', donorMatches: 'Matches' };
type Section = AdminSection | 'overview' | 'profile' | 'approvals' | 'centres';
const sectionIcons: Record<Section, React.ComponentProps<typeof Ionicons>['name']> = {
  overview: 'analytics-outline', approvals: 'people-outline', centres: 'location-outline',
  users: 'people-circle-outline', donorProfiles: 'heart-outline', emergencyRequests: 'medical-outline',
  bloodInventory: 'water-outline', donorResponses: 'chatbubble-ellipses-outline', donorMatches: 'git-network-outline', profile: 'person-circle-outline',
};
function SectionIcon({ section }: { section: Section }) {
  return <View style={styles.iconBadge} accessible={false}><Ionicons name={sectionIcons[section]} size={24} color={COLORS.primary} accessible={false} /></View>;
}

export default function AdminDashboardScreen() {
  const { user, profile, logout } = useAuth();
  const [data, setData] = useState<{ uid: string; overview: AdminOverview } | null>(null);
  const [section, setSection] = useState<Section>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [retry, setRetry] = useState(0);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const uid = user?.uid;
  const authorized = !!uid && profile?.uid === uid && profile.role === 'admin';
  useFocusEffect(useCallback(() => {
    let active = true;
    setData(null); setError(''); setLoading(true);
    if (!uid || !authorized) {
      setLoading(false); setError('Sign in with an administrator account to view this dashboard.');
      return () => { active = false; };
    }
    loadAdminOverview(uid).then(overview => { if (active) setData({ uid, overview }); })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Unable to load dashboard. Please refresh.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid, authorized, retry]));
  const overview = authorized && data?.uid === uid ? data.overview : null;
  const current = section !== 'overview' && section !== 'profile' && section !== 'approvals' && section !== 'centres' ? overview?.[section] : null;
  const query = search.trim().toLowerCase();
  const rows = current?.rows.filter(row => [row.id, row.title, ...row.details].some(value => value.toLowerCase().includes(query))) ?? [];
  function open(next: Section) { setSection(next); setSearch(''); }
  async function signOut() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } catch { setError('Unable to sign out. Please retry.'); }
    finally { setLoggingOut(false); setLogoutVisible(false); }
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerText}><Text style={styles.heading}>Admin Dashboard</Text><Text style={styles.welcome}>Welcome, {authorized ? profile.fullName : 'Administrator'}</Text></View>
        <Pressable onPress={() => setRetry(value => value + 1)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Refresh dashboard"><Ionicons name="refresh" size={22} color={COLORS.white} /></Pressable>
        <Pressable onPress={() => setLogoutVisible(true)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Sign out"><Ionicons name="log-out-outline" size={22} color={COLORS.white} /></Pressable>
      </View>
      <View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {(['overview', 'approvals', 'centres', ...ADMIN_SECTIONS, 'profile'] as const).map(key => <Pressable key={key} onPress={() => open(key)} accessibilityRole="button" accessibilityState={{ selected: section === key }} style={({ pressed }) => [styles.tab, section === key && styles.selectedTab, pressed && styles.pressed]}><Ionicons name={sectionIcons[key]} size={18} color={section === key ? COLORS.white : COLORS.primary} accessible={false} /><Text style={[styles.tabText, section === key && styles.selectedText]}>{key === 'overview' ? 'Overview' : key === 'profile' ? 'Profile' : key === 'approvals' ? 'Pending Approvals' : key === 'centres' ? 'Manage Centres' : labels[key]}</Text></Pressable>)}
      </ScrollView></View>
      {loading && <ActivityIndicator style={styles.loading} color={COLORS.primary} accessibilityLabel="Loading administration data" />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {section === 'centres' ? <AdminDonationCentresScreen key={`${uid}-${retry}`} /> : section === 'approvals' ? <PendingApprovalsScreen key={`${uid}-${retry}`} /> : section === 'overview' ? <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cardHeading}><SectionIcon section="overview" /><Text style={styles.title}>System Overview</Text></View><Text style={styles.description}>Read-only summaries of saved BloodConnect records. Refresh to load the latest changes.</Text>
        <Pressable style={({ pressed }) => [styles.card, styles.cardHeading, pressed && styles.pressed]} onPress={() => open('approvals')} accessibilityRole="button" accessibilityLabel="Pending Staff Approvals" accessibilityHint="Review healthcare and blood-bank applications"><SectionIcon section="approvals" /><View style={styles.cardCopy}><Text style={styles.cardTitle}>Pending Staff Approvals</Text><Text style={styles.description}>Review new healthcare and blood-bank applications.</Text></View><Ionicons name="chevron-forward" size={20} color={COLORS.primary} accessible={false} /></Pressable>
        <Pressable style={({ pressed }) => [styles.card, styles.cardHeading, pressed && styles.pressed]} onPress={() => open('centres')} accessibilityRole="button" accessibilityLabel="Manage Donation Centres" accessibilityHint="Add, edit or change visibility of donation centres"><SectionIcon section="centres" /><View style={styles.cardCopy}><Text style={styles.cardTitle}>Manage Donation Centres</Text><Text style={styles.description}>Add, edit and activate public donor listings.</Text></View><Ionicons name="chevron-forward" size={20} color={COLORS.primary} accessible={false} /></Pressable>
        <View style={styles.grid}>{ADMIN_SECTIONS.map(key => <Pressable key={key} onPress={() => open(key)} style={({ pressed }) => [styles.metric, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`View ${labels[key]}, ${overview?.[key].error ? 'unavailable' : overview ? overview[key].rows.length : 'loading'} saved records`}><View style={styles.cardHeading}><SectionIcon section={key} /><Ionicons name="arrow-forward" size={18} color={COLORS.primary} accessible={false} /></View><Text style={[styles.count, !!overview?.[key].error && styles.unavailable]}>{overview?.[key].error ? 'Unavailable' : overview ? overview[key].rows.length : '—'}</Text><Text style={styles.metricLabel}>{labels[key]}</Text><Text style={styles.description}>{overview?.[key].error ? 'Access or connection issue' : 'View saved records'}</Text></Pressable>)}</View>
        <View style={styles.card}><View style={styles.cardHeading}><SectionIcon section="overview" /><Text style={styles.cardTitle}>Module overview</Text></View><Text style={styles.description}>Requester: request creation and monitoring{'\n'}Healthcare: verification and donor matching{'\n'}Donor: availability and donation responses{'\n'}Blood bank: stock and request management</Text></View>
      </ScrollView> : section === 'profile' ? <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Administrator Profile</Text><View style={styles.card}><Text style={styles.cardTitle}>{authorized ? profile.fullName : 'Unavailable'}</Text><Text selectable style={styles.description}>{authorized ? profile.email : ''}</Text><Text selectable style={styles.description}>{authorized ? profile.phone || 'Phone not provided' : ''}</Text><Text style={styles.description}>Role: Administrator</Text><Text style={styles.description}>Status: {authorized ? profile.status : 'Unavailable'}</Text></View>
      </ScrollView> : <>
        <Text style={styles.listTitle}>{labels[section]}{current && !current.error ? ` (${rows.length})` : ''}</Text>
        <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Search records" accessibilityLabel={`Search ${labels[section]}`} placeholderTextColor={COLORS.textMuted} />
        {!!current?.error && <Text style={styles.error}>{current.error}</Text>}
        <FlatList data={rows} keyExtractor={item => item.id} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshing={loading} onRefresh={() => setRetry(value => value + 1)}
          ListEmptyComponent={!loading && !error && current && !current.error ? <Text style={styles.description}>{current.rows.length ? 'No records match your search.' : 'No saved records in this section.'}</Text> : null}
          renderItem={({ item }) => <View style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text>{item.details.map((detail, index) => <Text key={index} selectable style={styles.description}>{detail}</Text>)}<Text selectable style={styles.recordId}>ID: {item.id}</Text></View>} />
      </>}
      <Modal visible={logoutVisible} transparent animationType="fade" onRequestClose={() => { if (!loggingOut) setLogoutVisible(false); }}><View style={styles.overlay}><View style={styles.dialog}><Text style={styles.title}>Sign out?</Text><Text style={styles.description}>You will return to the login page.</Text><View style={styles.actions}><Pressable disabled={loggingOut} style={styles.tab} onPress={() => setLogoutVisible(false)} accessibilityRole="button"><Text style={styles.tabText}>Cancel</Text></Pressable><Pressable disabled={loggingOut} style={[styles.tab, styles.selectedTab]} onPress={signOut} accessibilityRole="button"><Text style={styles.selectedText}>{loggingOut ? 'Signing out...' : 'Sign out'}</Text></Pressable></View></View></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 18, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { flex: 1 }, heading: { color: COLORS.white, fontSize: 22, fontWeight: '800' }, welcome: { color: COLORS.white, marginTop: 6 },
  iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  tabs: { padding: 14, gap: 8 }, tab: { minHeight: 46, paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  selectedTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, tabText: { color: COLORS.textSecondary, fontWeight: '600' }, selectedText: { color: COLORS.white, fontWeight: '600' },
  content: { padding: 18, gap: 16, paddingBottom: 30, width: '100%', maxWidth: 960, alignSelf: 'center' }, title: { color: COLORS.text, fontSize: 22, fontWeight: '700', flexShrink: 1 }, description: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, metric: { flexGrow: 1, flexBasis: 160, padding: 18, backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.primaryDeep, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }, count: { color: COLORS.primary, fontSize: 28, fontWeight: '800', marginTop: 16 }, unavailable: { fontSize: 17 }, metricLabel: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginTop: 6 },
  card: { backgroundColor: COLORS.white, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.primaryDeep, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }, cardTitle: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  cardHeading: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between' }, cardCopy: { flex: 1 }, iconBadge: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.softBackground, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.75 },
  recordId: { color: COLORS.textMuted, fontSize: 11, marginTop: 10 }, listTitle: { fontSize: 20, color: COLORS.text, fontWeight: '700', paddingHorizontal: 18, marginTop: 8 },
  search: { margin: 18, marginBottom: 0, padding: 13, minHeight: 48, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
  loading: { margin: 15 }, error: { color: COLORS.danger, padding: 18, lineHeight: 21 }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }, dialog: { width: '100%', maxWidth: 360, backgroundColor: COLORS.white, borderRadius: 18, padding: 24 }, actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/context/AuthContext';
import RoleAppShell from '../../../components/RoleAppShell';
import { COLORS } from '../../../constants/colors';
import { getDonorProfile } from '../../donor/services/donorService';
import type { DonorProfile, EmergencyRequest } from '../../donor/types/donor';
import type { VerificationMatchingStackParamList } from '../navigation/types';
import { sendMatchMessage, subscribeToMatchMessages, type MatchMessage } from '../services/communicationService';
import { getVerificationRequestById } from '../services/verificationService';

type Props = NativeStackScreenProps<VerificationMatchingStackParamList, 'DonorCommunication'>;

function present(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && !['null', 'undefined'].includes(normalized.toLowerCase()) ? normalized : fallback;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function errorDetails(error: unknown): { code: string; message: string } {
  if (error && typeof error === 'object') {
    const details = error as { code?: unknown; message?: unknown };
    return {
      code: typeof details.code === 'string' ? details.code : 'unknown',
      message: typeof details.message === 'string' ? details.message : String(error),
    };
  }
  return { code: 'unknown', message: String(error) };
}

function messageTime(value: unknown): string {
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (value && typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === 'function') date = timestamp.toDate();
  }
  return date ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
}

function QuickAction({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={disabled ? 'This action is not connected yet.' : undefined}
      disabled={disabled}
      onPress={onPress}
      style={[styles.quickAction, disabled && styles.quickActionDisabled]}
    >
      <Ionicons name={icon} size={15} color={COLORS.primary} />
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

function DonorCommunicationContent({ route, navigation }: Props) {
  const { requestId, donorId } = route.params;
  const { user, profile, initializing: authInitializing } = useAuth();
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [subscriptionRetry, setSubscriptionRetry] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const stickToLatest = useRef(true);
  const sendingRef = useRef(false);

  const loadMatchedDetails = useCallback(async () => {
    if (!requestId?.trim() || !donorId?.trim()) {
      setError('This conversation is missing its request or donor reference.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [loadedRequest, loadedDonor] = await Promise.all([
        getVerificationRequestById(requestId),
        getDonorProfile(donorId),
      ]);
      if (!loadedRequest) {
        setRequest(null);
        setDonor(null);
        setError('The blood request linked to this match could not be found.');
      } else if (!loadedDonor.fullName?.trim() && !loadedDonor.phone?.trim() && !loadedDonor.email?.trim()) {
        setRequest(null);
        setDonor(null);
        setError('The donor profile linked to this match could not be found.');
      } else {
        setRequest(loadedRequest);
        setDonor(loadedDonor);
      }
    } catch (loadError) {
      const details = errorDetails(loadError);
      console.error('[DonorCommunication] Could not load matched request and donor.', details, loadError);
      setRequest(null);
      setDonor(null);
      setError('Unable to load this donor and request. Check your connection and Firestore access, then try again.');
    } finally {
      setLoading(false);
    }
  }, [donorId, requestId]);

  useEffect(() => { void loadMatchedDetails(); }, [loadMatchedDetails]);

  useEffect(() => {
    if (loading || error || !request || !donor || authInitializing) return undefined;
    if (!user || !profile || profile.uid !== user.uid) {
      setMessagesLoading(false);
      setMessagesError('Your signed-in user profile is unavailable. Sign in again to load messages.');
      return undefined;
    }
    if (profile.role !== 'healthcare' && profile.role !== 'donor') {
      setMessagesLoading(false);
      setMessagesError('Messaging is available to healthcare users and matched donors.');
      return undefined;
    }

    setMessagesLoading(true);
    setMessagesError(null);
    try {
      return subscribeToMatchMessages(
        requestId,
        donorId,
        nextMessages => {
          setMessages(nextMessages);
          setMessagesLoading(false);
        },
        subscriptionError => {
          const details = errorDetails(subscriptionError);
          console.error('[DonorCommunication] Message subscription failed.', details, subscriptionError);
          setMessagesLoading(false);
          setMessagesError(details.code === 'permission-denied'
            ? 'You do not have permission to read messages for this match.'
            : 'Unable to load messages. Check your connection and try again.');
        },
      );
    } catch (subscriptionError) {
      const details = errorDetails(subscriptionError);
      console.error('[DonorCommunication] Could not subscribe to match messages.', details, subscriptionError);
      setMessagesLoading(false);
      setMessagesError('Unable to load messages. Check your connection and try again.');
      return undefined;
    }
  }, [authInitializing, donor, error, loading, profile, request, requestId, donorId, subscriptionRetry, user]);

  const donorName = present(donor?.fullName, 'Matched donor');
  const urgency = useMemo(() => present(request?.urgency, 'Status unavailable'), [request]);
  const canSend = Boolean(
    user && profile && profile.uid === user.uid &&
    (profile.role === 'healthcare' || profile.role === 'donor'),
  );

  const callDonor = async () => {
    const phone = donor?.phone?.trim().replace(/[^\d+]/g, '') ?? '';
    if (!/\d/.test(phone)) {
      setComposerNotice('There is no usable phone number in this donor profile.');
      return;
    }
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (callError) {
      console.warn('[DonorCommunication] Could not open donor phone dialer.', callError);
      setComposerNotice('This device could not open the phone dialer.');
    }
  };

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sendingRef.current) return;
    if (!requestId?.trim() || !donorId?.trim() || !user || !profile || profile.uid !== user.uid) {
      setComposerNotice('Your signed-in account could not be verified. The message was not sent.');
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setComposerNotice(null);
    try {
      await sendMatchMessage(requestId, donorId, trimmed, profile.role);
      setDraft('');
    } catch (sendError) {
      const details = errorDetails(sendError);
      console.error('[DonorCommunication] Message send failed.', details, sendError);
      setComposerNotice(details.code === 'permission-denied'
        ? 'You do not have permission to send messages for this match.'
        : `Message not sent: ${details.message}`);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to notification status"
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
          >
            <Ionicons name="arrow-back" size={19} color={COLORS.primary} />
          </Pressable>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(donorName)}</Text></View>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.donorName} numberOfLines={1}>{donorName}</Text>
            <View style={styles.onlineLabelRow}>
              <View style={styles.onlineLabelDot} />
              <Text style={styles.onlineLabel}>Online</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call donor"
            onPress={() => void callDonor()}
            style={styles.callButton}
          >
            <Ionicons name="call" size={18} color={COLORS.white} />
          </Pressable>
        </View>

        {request && donor ? (
          <View style={styles.requestCard}>
            <View style={styles.bloodBadge}><Text style={styles.bloodBadgeText}>{request.bloodGroup || '—'}</Text></View>
            <View style={styles.requestCopy}>
              <Text style={styles.requestEyebrow}>Blood request</Text>
              <Text style={styles.hospitalName} numberOfLines={1}>{present(request.hospitalName, 'Hospital not specified')}</Text>
            </View>
            <View style={[styles.urgencyBadge, urgencyTone(urgency)]}>
              <Text style={[styles.urgencyText, urgencyTextTone(urgency)]} numberOfLines={1}>{urgency}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.conversation}>
          {loading ? (
            <View style={styles.stateContent}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.stateText}>Loading conversation details…</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContent}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color={COLORS.primary} />
              <Text style={styles.stateTitle}>Conversation unavailable</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => void loadMatchedDetails()} style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onScroll={event => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                stickToLatest.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 100;
              }}
              scrollEventThrottle={16}
              onContentSizeChange={() => {
                if (stickToLatest.current) scrollRef.current?.scrollToEnd({ animated: true });
              }}
            >
              <View style={styles.dateDivider}>
                <View style={styles.dateLine} />
                <Text style={styles.dateLabel}>Today</Text>
                <View style={styles.dateLine} />
              </View>
              {messagesError ? (
                <View style={styles.messageErrorRow}>
                  <Text style={styles.messageErrorText}>{messagesError}</Text>
                  <Pressable accessibilityRole="button" onPress={() => setSubscriptionRetry(value => value + 1)}>
                    <Text style={styles.retryTextInline}>Retry</Text>
                  </Pressable>
                </View>
              ) : null}
              {messagesLoading && messages.length === 0 ? (
                <View style={styles.messageLoading}><ActivityIndicator size="small" color={COLORS.primary} /></View>
              ) : messages.length > 0 ? messages.map(message => {
                const ownMessage = message.senderId === user?.uid;
                const time = messageTime(message.createdAt);
                return (
                  <View key={message.id} style={[styles.messageRow, ownMessage ? styles.ownMessageRow : styles.otherMessageRow]}>
                    <View style={[styles.messageBubble, ownMessage ? styles.ownMessageBubble : styles.otherMessageBubble]}>
                      <Text style={[styles.messageText, ownMessage ? styles.ownMessageText : styles.otherMessageText]}>{message.text}</Text>
                      {time ? <Text style={[styles.messageTime, ownMessage ? styles.ownMessageTime : styles.otherMessageTime]}>{time}</Text> : null}
                    </View>
                  </View>
                );
              }) : !messagesLoading && !messagesError ? (
                <View style={styles.emptyChat}>
                  <View style={styles.emptyChatIcon}><Ionicons name="chatbubble-ellipses-outline" size={22} color={COLORS.primary} /></View>
                  <Text style={styles.emptyChatTitle}>No messages yet</Text>
                  <Text style={styles.emptyChatText}>Messages for this match will appear here.</Text>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>

        <View style={styles.bottomArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
            <QuickAction icon="location-outline" label="Share location" disabled />
            <QuickAction icon="calendar-outline" label="Schedule time" disabled />
            <QuickAction icon="call-outline" label="Call donor" onPress={() => void callDonor()} />
          </ScrollView>
          {composerNotice ? <Text accessibilityLiveRegion="polite" style={styles.composerNotice}>{composerNotice}</Text> : null}
          <View style={styles.composerRow}>
            <View style={styles.inputPill}>
              <TextInput
                accessibilityLabel="Message draft"
                value={draft}
                onChangeText={value => { setDraft(value); setComposerNotice(null); }}
                placeholder="Type your message..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                multiline
                maxLength={2000}
                editable={!loading && !error && !authInitializing && canSend}
                returnKeyType="default"
                textAlignVertical="center"
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Attach file" disabled style={styles.attachmentButton}>
                <Ionicons name="attach-outline" size={21} color={COLORS.textMuted} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityHint={sending ? 'Sending message.' : undefined}
              disabled={!draft.trim() || loading || Boolean(error) || authInitializing || !canSend || sending}
              onPress={() => void sendMessage()}
              style={[styles.sendButton, (!draft.trim() || loading || Boolean(error) || !canSend || sending) && styles.sendButtonDisabled]}
            >
              {sending ? <ActivityIndicator size="small" color={COLORS.white} /> : <Ionicons name="paper-plane" size={17} color={COLORS.white} />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function urgencyTone(value: string) {
  const status = value.toLowerCase();
  if (status === 'critical') return styles.urgencyCritical;
  if (status === 'urgent' || status === 'high') return styles.urgencyUrgent;
  return styles.urgencyNormal;
}

function urgencyTextTone(value: string) {
  const status = value.toLowerCase();
  if (status === 'critical') return styles.urgencyTextCritical;
  if (status === 'urgent' || status === 'high') return styles.urgencyTextUrgent;
  return styles.urgencyTextNormal;
}

export default function DonorCommunicationScreen(props: Props) {
  const { navigation } = props;
  return (
    <RoleAppShell
      home={<View />}
      activity={{ title: 'Pending Requests', description: 'Review requests awaiting verification.' }}
      servicesContent={<DonorCommunicationContent {...props} />}
      services={{ title: 'Donor Matching', description: 'View matched donor status.' }}
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
  page: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 14, backgroundColor: '#FFF5F5' },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, marginHorizontal: -14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F3E5E7' },
  headerIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  onlineDot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#2E8B57', borderWidth: 2, borderColor: COLORS.white },
  headerCopy: { flex: 1, minWidth: 0 },
  donorName: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  onlineLabelRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineLabelDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E8B57' },
  onlineLabel: { color: '#2E8B57', fontSize: 10, fontWeight: '600' },
  callButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#C8102E', alignItems: 'center', justifyContent: 'center', shadowColor: '#C8102E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 2 },
  requestCard: { marginTop: 12, minHeight: 72, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: '#F1E2E4' },
  bloodBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  bloodBadgeText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  requestCopy: { flex: 1, minWidth: 0 },
  requestEyebrow: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  hospitalName: { marginTop: 4, color: COLORS.text, fontSize: 12, fontWeight: '700' },
  urgencyBadge: { maxWidth: 82, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  urgencyCritical: { backgroundColor: '#FCEAEC' },
  urgencyUrgent: { backgroundColor: '#FFF1D9' },
  urgencyNormal: { backgroundColor: '#E7F4EC' },
  urgencyText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  urgencyTextCritical: { color: '#9F1026' },
  urgencyTextUrgent: { color: '#A86600' },
  urgencyTextNormal: { color: '#2E8B57' },
  conversation: { flex: 1, minHeight: 130, marginTop: 8 },
  chatContent: { flexGrow: 1, paddingVertical: 14 },
  dateDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  dateLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#E9DADD' },
  dateLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  emptyChat: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 32 },
  emptyChatIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FCEAEC', alignItems: 'center', justifyContent: 'center' },
  emptyChatTitle: { marginTop: 12, color: COLORS.text, fontSize: 14, fontWeight: '700' },
  emptyChatText: { marginTop: 5, color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  messageLoading: { paddingVertical: 18, alignItems: 'center' },
  messageErrorRow: { marginHorizontal: 4, marginTop: 12, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11, backgroundColor: '#FCEAEC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  messageErrorText: { flex: 1, color: '#8E0615', fontSize: 10, lineHeight: 14 },
  retryTextInline: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  messageRow: { width: '100%', marginTop: 10 },
  ownMessageRow: { alignItems: 'flex-end' },
  otherMessageRow: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '78%', paddingHorizontal: 12, paddingTop: 9, paddingBottom: 7, borderRadius: 16 },
  ownMessageBubble: { borderBottomRightRadius: 5, backgroundColor: '#C8102E' },
  otherMessageBubble: { borderBottomLeftRadius: 5, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F1E2E4' },
  messageText: { fontSize: 12, lineHeight: 17 },
  ownMessageText: { color: COLORS.white },
  otherMessageText: { color: COLORS.text },
  messageTime: { marginTop: 4, alignSelf: 'flex-end', fontSize: 9 },
  ownMessageTime: { color: 'rgba(255,255,255,0.78)' },
  otherMessageTime: { color: COLORS.textMuted },
  stateContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 9 },
  stateTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  stateText: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  retryButton: { marginTop: 3, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  bottomArea: { paddingTop: 8, paddingBottom: 9, backgroundColor: '#FFF5F5' },
  quickActions: { gap: 8, paddingBottom: 10 },
  quickAction: { minHeight: 34, paddingHorizontal: 11, borderRadius: 18, borderWidth: 1, borderColor: '#EAC7CD', backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 5 },
  quickActionDisabled: { opacity: 0.7 },
  quickActionText: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  composerNotice: { marginBottom: 6, color: COLORS.textSecondary, fontSize: 10, lineHeight: 14 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  inputPill: { flex: 1, minHeight: 48, maxHeight: 112, paddingLeft: 15, paddingRight: 5, borderRadius: 24, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#EADADD', flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, maxHeight: 96, paddingTop: 10, paddingBottom: 10, color: COLORS.text, fontSize: 12, lineHeight: 17 },
  attachmentButton: { width: 36, height: 38, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#C8102E', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
});

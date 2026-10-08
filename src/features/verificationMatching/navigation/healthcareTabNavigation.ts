import { Alert } from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { VerificationMatchingStackParamList } from './types';
import {
  getMatchingHistory,
  getVerificationDashboardSummary,
  getVerificationRequestById,
  type MatchingHistoryRecord,
} from '../services/verificationService';

type Navigation = NativeStackNavigationProp<VerificationMatchingStackParamList>;
type DonorMatchContext = { requestId?: string; donorId?: string };

function timestampMillis(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
  if (value && typeof value === 'object') {
    const timestamp = value as { toMillis?: () => number; toDate?: () => Date };
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
  }
  return 0;
}

function newestMatch(records: MatchingHistoryRecord[]): MatchingHistoryRecord | undefined {
  return records
    .filter(record => record.requestId.trim() && record.donorId.trim())
    .sort((a, b) =>
      timestampMillis(b.createdAt ?? b.updatedAt) - timestampMillis(a.createdAt ?? a.updatedAt),
    )[0];
}

function latestEligibleVerifiedRequestId(
  records: Awaited<ReturnType<typeof getVerificationDashboardSummary>>['recentRequests'],
): string | undefined {
  return records.find(request =>
    request.verified &&
    !['completed', 'cancelled', 'closed', 'rejected'].includes(request.status.toLowerCase()),
  )?.id;
}

export async function openHealthcareDonorMatching(
  navigation: Navigation,
  currentRequestId?: string,
): Promise<void> {
  try {
    let requestId: string | undefined;
    if (currentRequestId) {
      const currentRequest = await getVerificationRequestById(currentRequestId);
      if (
        currentRequest?.verified &&
        !['completed', 'cancelled', 'closed', 'rejected'].includes(currentRequest.status.toLowerCase())
      ) {
        requestId = currentRequestId;
      }
    }

    requestId ??= latestEligibleVerifiedRequestId(
      (await getVerificationDashboardSummary()).recentRequests,
    );
    if (!requestId) {
      Alert.alert('Donor matching unavailable', 'No verified request available for donor matching.');
      return;
    }

    navigation.navigate('MatchingDonors', { requestId });
  } catch (error) {
    console.error('Could not find a verified request for donor matching:', error);
    Alert.alert('Donor matching unavailable', 'Unable to load a verified request. Please try again.');
  }
}

export async function openHealthcareDonorProfile(
  navigation: Navigation,
  currentMatch?: DonorMatchContext,
): Promise<void> {
  try {
    const match = currentMatch?.requestId?.trim() && currentMatch.donorId?.trim()
      ? currentMatch
      : newestMatch(await getMatchingHistory());
    if (!match?.requestId || !match.donorId) {
      Alert.alert('Donor profile unavailable', 'No matched donor available to view.');
      return;
    }

    navigation.navigate('DonorDetails', {
      requestId: match.requestId,
      donorId: match.donorId,
      donorAlreadySelected: true,
      canSelectDonor: false,
    });
  } catch (error) {
    console.error('Could not load a matched donor for the profile tab:', error);
    Alert.alert('Donor profile unavailable', 'Unable to load the latest matched donor. Please try again.');
  }
}

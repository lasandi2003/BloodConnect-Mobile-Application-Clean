import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import type { DonationCentre } from '../types/donationCentre';
import { parseDonationCentre } from '../utils/donationCentres';

export function watchActiveDonationCentres(uid: string,
  onChange: (centres: DonationCentre[], fromCache: boolean, skipped: number) => void,
  onError: (error: unknown) => void) {
  if (!uid || auth.currentUser?.uid !== uid) {
    onError(new Error('Please sign in to view donation centres.'));
    return () => {};
  }
  const activeQuery = query(collection(db, 'donationCentres'), where('isActive', '==', true));
  return onSnapshot(activeQuery, { includeMetadataChanges: true }, snapshot => {
    try {
      if (auth.currentUser?.uid !== uid) throw new Error('Your session changed. Please sign in again.');
      const centres: DonationCentre[] = [];
      let skipped = 0;
      for (const document of snapshot.docs) {
        const centre = parseDonationCentre(document.id, document.data());
        if (centre) centres.push(centre); else skipped++;
      }
      onChange(centres, snapshot.metadata.fromCache, skipped);
    } catch (error) { onError(error); }
  }, onError);
}

export function getDonationCentreError(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === 'permission-denied') return 'Donation centre access was denied. Ask the administrator to review the donationCentres Firestore read rules.';
  if (code === 'failed-precondition') return 'Firestore could not run the centre query. Ask the administrator to check its index configuration.';
  if (code === 'unavailable') return 'Unable to connect. Check your internet connection and retry.';
  return error instanceof Error ? error.message : 'Unable to load donation centres. Please retry.';
}

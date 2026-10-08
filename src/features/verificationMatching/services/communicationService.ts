import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { auth, db } from '../../../config/firebase';
import type { UserRole } from '../../../types/auth';

const DONOR_MATCHES = 'donorMatches';

export interface MatchMessage {
  id: string;
  senderId: string;
  senderRole: string;
  text: string;
  createdAt: unknown;
}

function matchDocumentId(requestId: string, donorId: string): string {
  return `${requestId}_${donorId}`;
}

export async function sendMatchMessage(
  requestId: string,
  donorId: string,
  text: string,
  senderRole: UserRole,
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to send a message.');
  }
  if (!requestId.trim() || !donorId.trim()) {
    throw new Error('A request and donor are required to send a message.');
  }
  if (senderRole !== 'healthcare' && senderRole !== 'donor') {
    throw new Error('Only a healthcare user or the matched donor can send messages.');
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error('Enter a message before sending.');
  }
  if (normalizedText.length > 2000) {
    throw new Error('Messages must be 2,000 characters or fewer.');
  }

  const matchId = matchDocumentId(requestId, donorId);
  const message = await addDoc(
    collection(db, DONOR_MATCHES, matchId, 'messages'),
    {
      senderId: currentUser.uid,
      senderRole,
      text: normalizedText,
      createdAt: serverTimestamp(),
    },
  );

  return message.id;
}

export function subscribeToMatchMessages(
  requestId: string,
  donorId: string,
  onMessages: (messages: MatchMessage[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const matchId = matchDocumentId(requestId, donorId);
  const messagesQuery = query(
    collection(db, DONOR_MATCHES, matchId, 'messages'),
    orderBy('createdAt', 'asc'),
  );

  return onSnapshot(
    messagesQuery,
    snapshot => {
      onMessages(snapshot.docs
        .filter(messageSnapshot => !messageSnapshot.metadata.hasPendingWrites)
        .map(messageSnapshot => {
        const data = messageSnapshot.data();
        return {
          id: messageSnapshot.id,
          senderId: typeof data.senderId === 'string' ? data.senderId : '',
          senderRole: typeof data.senderRole === 'string' ? data.senderRole : '',
          text: typeof data.text === 'string' ? data.text : '',
          createdAt: data.createdAt ?? null,
        };
      }));
    },
    onError,
  );
}

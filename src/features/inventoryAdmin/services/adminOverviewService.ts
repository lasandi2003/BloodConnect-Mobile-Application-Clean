import { collection, doc, getDocFromServer, getDocsFromServer } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

export const ADMIN_SECTIONS = ['users', 'donorProfiles', 'emergencyRequests', 'bloodInventory', 'donorResponses', 'donorMatches'] as const;
export type AdminSection = typeof ADMIN_SECTIONS[number];
export interface AdminRow { id: string; title: string; details: string[] }
export interface AdminSectionResult { rows: AdminRow[]; error: string | null }
export type AdminOverview = Record<AdminSection, AdminSectionResult>;

function text(value: unknown, fallback = 'Not recorded'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function buildAdminRow(section: AdminSection, id: string, data: Record<string, unknown>): AdminRow {
  switch (section) {
    case 'users': return { id, title: text(data.fullName, 'Unnamed account'), details: [text(data.email), `Role: ${text(data.role)}`, `Status: ${text(data.status)}`] };
    case 'donorProfiles': return { id, title: text(data.fullName, 'Unnamed donor'), details: [`Blood group: ${text(data.bloodGroup)}`, `Location: ${[data.city, data.district].filter(value => typeof value === 'string' && value.trim()).join(', ') || 'Not recorded'}`, data.isAvailable === true ? 'Available' : data.isAvailable === false ? 'Unavailable' : 'Availability not recorded'] };
    case 'emergencyRequests': return { id, title: `${text(data.bloodGroup)} — ${text(data.hospitalName)}`, details: [`Status: ${text(data.status).replace(/_/g, ' ')}`, `Units: ${typeof data.unitsRequired === 'number' ? data.unitsRequired : 'Not recorded'}`, `Required: ${text(data.requiredDate)}`] };
    case 'bloodInventory': return { id, title: text(data.bloodGroup, id), details: [`Available units: ${typeof data.availableUnits === 'number' ? data.availableUnits : 'Not recorded'}`, `Status: ${text(data.status)}`] };
    case 'donorResponses': return { id, title: `Response ${id}`, details: [`Request: ${text(data.requestId)}`, `Status: ${text(data.status)}`] };
    case 'donorMatches': return { id, title: `Match ${id}`, details: [`Request: ${text(data.requestId)}`, `Status: ${text(data.status)}`] };
  }
}

export async function loadAdminOverview(uid: string): Promise<AdminOverview> {
  const checkSession = () => {
    if (!uid || auth.currentUser?.uid !== uid) throw new Error('Please sign in again to view administration data.');
  };
  checkSession();
  const profile = await getDocFromServer(doc(db, 'users', uid));
  checkSession();
  if (!profile.exists() || profile.data().role !== 'admin') throw new Error('This account does not have administrator access.');
  const entries = await Promise.all(ADMIN_SECTIONS.map(async section => {
    try {
      const snapshot = await getDocsFromServer(collection(db, section));
      checkSession();
      const rows = snapshot.docs.map(document => buildAdminRow(section, document.id, document.data()));
      rows.sort((a, b) => a.title.localeCompare(b.title));
      return [section, { rows, error: null }] as const;
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      return [section, { rows: [], error: code === 'permission-denied'
        ? 'Your published Firestore rules do not permit admin access to this section.'
        : 'Unable to load this section. Check your connection and refresh.' }] as const;
    }
  }));
  checkSession();
  return Object.fromEntries(entries) as AdminOverview;
}

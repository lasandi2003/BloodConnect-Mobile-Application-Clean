import { collection, doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

export interface CentreFields {
  name: string; address: string; district: string; phone: string;
  latitude: number; longitude: number; isActive: boolean;
}
export interface AdminCentre { id: string; data: Record<string, unknown> }
export type CentreForm = Record<'name' | 'address' | 'district' | 'phone' | 'latitude' | 'longitude', string> & { isActive: boolean };
const keys = ['name', 'address', 'district', 'phone', 'latitude', 'longitude', 'isActive'] as const;

export function centreForm(data: Record<string, unknown> = {}): CentreForm {
  const text = (key: string) => typeof data[key] === 'string' || typeof data[key] === 'number' ? String(data[key]) : '';
  return { name: text('name'), address: text('address'), district: text('district'), phone: text('phone'), latitude: text('latitude'), longitude: text('longitude'), isActive: data.isActive !== false };
}
export function validateCentre(form: CentreForm): { fields: CentreFields | null; errors: Partial<Record<keyof CentreForm, string>> } {
  const errors: Partial<Record<keyof CentreForm, string>> = {};
  for (const key of ['name', 'address', 'district', 'phone'] as const) {
    if (!form[key].trim()) errors[key] = 'This field is required.';
    else if (form[key].trim().length > (key === 'address' ? 500 : key === 'phone' ? 40 : 150)) errors[key] = 'Please shorten this value.';
  }
  if (form.phone.trim() && (!/^\+?[\d\s().-]+$/.test(form.phone.trim()) || !/^\d{6,15}$/.test(form.phone.replace(/\D/g, '')))) errors.phone = 'Enter a phone number with 6–15 digits, optionally starting with +.';
  for (const key of ['latitude', 'longitude'] as const) {
    const limit = key === 'latitude' ? 90 : 180;
    if (!form[key].trim() || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(form[key].trim()) || !Number.isFinite(Number(form[key])) || Math.abs(Number(form[key])) > limit) errors[key] = `Enter a number between -${limit} and ${limit}.`;
  }
  return { errors, fields: Object.keys(errors).length ? null : { name: form.name.trim(), address: form.address.trim(), district: form.district.trim(), phone: form.phone.trim(), latitude: Number(form.latitude), longitude: Number(form.longitude), isActive: form.isActive } };
}
export function watchAdminCentres(uid: string, change: (centres: AdminCentre[], cached: boolean) => void, error: (failure: unknown) => void) {
  if (auth.currentUser?.uid !== uid) { error(new Error('Please sign in again.')); return () => {}; }
  return onSnapshot(collection(db, 'donationCentres'), { includeMetadataChanges: true }, snapshot => {
    if (auth.currentUser?.uid === uid) change(snapshot.docs.map(item => ({ id: item.id, data: item.data() })).sort((a, b) => String(a.data.name ?? '').localeCompare(String(b.data.name ?? ''))), snapshot.metadata.fromCache);
  }, error);
}
export function newCentreId() { return doc(collection(db, 'donationCentres')).id; }
export async function saveAdminCentre(uid: string, id: string, fields: CentreFields, original: AdminCentre | null) {
  const checked = validateCentre(centreForm(fields as unknown as Record<string, unknown>));
  if (!checked.fields) throw new Error('Please correct the centre details before saving.');
  if (auth.currentUser?.uid !== uid) throw new Error('Please sign in again.');
  await runTransaction(db, async transaction => {
    const account = await transaction.get(doc(db, 'users', uid));
    if (auth.currentUser?.uid !== uid || !account.exists() || account.data().role !== 'admin' || (account.data().status ?? 'active') !== 'active') throw new Error('An active administrator account is required.');
    const reference = doc(db, 'donationCentres', id);
    const saved = await transaction.get(reference);
    if (saved.exists() && keys.every(key => saved.data()[key] === checked.fields![key])) return;
    if (original ? !saved.exists() || keys.some(key => saved.data()[key] !== original.data[key]) : saved.exists()) throw new Error('This centre changed. Close the editor and reopen the latest details before saving.');
    if (original) transaction.update(reference, { ...checked.fields });
    else transaction.set(reference, checked.fields);
  });
}
export function adminCentreError(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code.includes('permission-denied')) return 'Access denied. Use an active admin account and publish the proposed donation centre rules.';
  if (code.includes('unavailable')) return 'Unable to connect. Check your connection and retry.';
  return error instanceof Error ? error.message : 'Unable to load or save donation centres. Please retry.';
}

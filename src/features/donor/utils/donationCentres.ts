import type { Coordinates, DonationCentre, NearbyDonationCentre } from '../types/donationCentre';

export function validCoordinates(value: Coordinates): boolean {
  return Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90
    && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}

export function parseDonationCentre(id: string, data: Record<string, unknown>): DonationCentre | null {
  if (data.isActive !== true || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return null;
  const coordinates = { latitude: data.latitude, longitude: data.longitude };
  if (!validCoordinates(coordinates)) return null;
  const text = (field: unknown) => typeof field === 'string' ? field.trim() : '';
  const name = text(data.name), address = text(data.address), district = text(data.district), phone = text(data.phone);
  if (!name || !address || !district || !phone || !/^\+?[\d\s().-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) return null;
  const openingHours = text(data.openingHours);
  return { id, name, address, district, phone, ...coordinates, isActive: true, ...(openingHours && openingHours.length <= 500 ? { openingHours } : {}) };
}

export function haversineKm(from: Coordinates, to: Coordinates): number {
  if (!validCoordinates(from) || !validCoordinates(to)) throw new Error('Invalid coordinates.');
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(to.latitude - from.latitude), dLon = radians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, a))));
}

export function nearbyCentres(centres: DonationCentre[], origin: Coordinates | null, search: string): NearbyDonationCentre[] {
  const query = search.trim().toLowerCase();
  const location = origin && validCoordinates(origin) ? origin : null;
  return centres.filter(centre => centre.name.toLowerCase().includes(query) || centre.district.toLowerCase().includes(query))
    .map(centre => ({ ...centre, distanceKm: location ? haversineKm(location, centre) : null }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export function directionsUrl(centre: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${centre.latitude},${centre.longitude}`)}`;
}

export function centrePhoneUrl(phone: string): string {
  return `tel:${phone.trim().startsWith('+') ? '+' : ''}${phone.replace(/\D/g, '')}`;
}

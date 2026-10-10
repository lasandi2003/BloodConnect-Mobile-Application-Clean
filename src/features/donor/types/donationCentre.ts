export interface Coordinates { latitude: number; longitude: number }

export interface DonationCentre extends Coordinates {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  openingHours?: string;
  isActive: true;
}

export interface NearbyDonationCentre extends DonationCentre { distanceKm: number | null }

import type { Timestamp } from 'firebase/firestore';

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

export type RequestUrgency =
  | 'critical'
  | 'urgent'
  | 'normal';

export type DonorResponseChoice =
  | 'accepted'
  | 'declined';

export type DonorResponseStatus =
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'withdrawn'
  | 'pending';

export interface DonorProfile {
  userId: string;

  fullName: string;
  email: string;
  phone: string;

  age?: number;
  bloodGroup?: BloodGroup;

  district?: string;
  city?: string;
  address?: string;

  isAvailable: boolean;

  lastDonationDate?: string;

  profileCompleted: boolean;

  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface EmergencyRequest {
  id: string;

  patientName: string;

  bloodGroup: BloodGroup;

  hospitalName: string;
  location: string;

  unitsRequired: number;

  requiredDate: string;

  urgency: RequestUrgency;

  notes: string;

  contactName: string;
  contactPhone: string;

  status: string;

  verified: boolean;

  createdAt?: Timestamp | null;
}

export interface RequestSnapshot {
  patientName: string;

  bloodGroup: BloodGroup;

  hospitalName: string;

  location: string;

  urgency: RequestUrgency;

  unitsRequired: number;

  requiredDate: string;
}

export interface DonorResponse {
  id: string;

  donorId: string;

  requestId: string;

  response: DonorResponseChoice;

  status: DonorResponseStatus;

  requestSnapshot: RequestSnapshot;

  createdAt?: Timestamp | null;

  updatedAt?: Timestamp | null;
}

export interface SaveDonorProfileInput {
  fullName: string;

  email: string;

  phone: string;

  age: number;

  bloodGroup: BloodGroup;

  district: string;

  city: string;

  address: string;

  isAvailable: boolean;

  lastDonationDate?: string;
}
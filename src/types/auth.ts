export type UserRole =
  | 'donor'
  | 'requester'
  | 'healthcare'
  | 'bloodBank'
  | 'admin';

export type RegistrationRole =
  | 'donor'
  | 'requester'
  | 'healthcare'
  | 'bloodBank';

export type HealthcareType =
  | 'doctor'
  | 'nurse';

export type UserStatus =
  | 'active'
  | 'suspended';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ProfessionalDetails {
  institutionName?: string;
  designation?: string;
  employeeId?: string;
}

export interface UserProfile extends ProfessionalDetails {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  healthcareType?: HealthcareType;
  status: UserStatus;
  photoURL?: string;
  approvalStatus?: ApprovalStatus;
}

export interface RegisterInput extends ProfessionalDetails {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: RegistrationRole;
  healthcareType?: HealthcareType;
}

export interface SocialProfileInput extends ProfessionalDetails {
  fullName: string;
  phone: string;
  role: RegistrationRole;
  healthcareType?: HealthcareType;
}

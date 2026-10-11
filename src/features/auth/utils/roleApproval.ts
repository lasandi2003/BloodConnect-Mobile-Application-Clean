import type { ApprovalStatus, ProfessionalDetails, UserRole } from '../../../types/auth';

export function requiresAdminApproval(role: UserRole): boolean {
  return role === 'healthcare' || role === 'bloodBank';
}

// Missing/unknown approval fields never grant staff privileges.
export function getApprovalStatus(value: unknown): ApprovalStatus {
  return value === 'approved' || value === 'rejected' ? value : 'pending';
}

export function canAccessRoleDashboard(role: UserRole, approval: unknown, status: unknown = 'active'): boolean {
  return status !== 'suspended' && (!requiresAdminApproval(role) || approval === 'approved');
}

export function buildInitialApprovalFields(role: UserRole, details: ProfessionalDetails) {
  if (!requiresAdminApproval(role)) return {};
  const institutionName = details.institutionName?.trim() ?? '';
  const designation = details.designation?.trim() ?? '';
  const employeeId = details.employeeId?.trim() ?? '';
  if (institutionName.length < 2 || institutionName.length > 150) throw new Error('Enter a hospital or blood bank name (2–150 characters).');
  if (designation.length < 2 || designation.length > 100) throw new Error('Enter your designation (2–100 characters).');
  if (!employeeId || employeeId.length > 50) throw new Error('Enter your employee ID (up to 50 characters).');
  return { approvalStatus: 'pending' as const, institutionName, designation, employeeId };
}

export interface AppUser {
  id:        string;
  email:     string;
  role:      string;
  isActive:  boolean;
}

export interface CreateUserRequest   { email: string; password: string; role: string; }
export interface UpdateUserRoleRequest { newRole: string; }
export interface ResetPasswordRequest  { newPassword: string; }

export const ROLES = ['Admin', 'Doctor', 'Receptionist'] as const;
export type RoleType = typeof ROLES[number];

export const RoleLabels: Record<RoleType, string> = {
  Admin:        'USERS.ROLE_ADMIN',
  Doctor:       'USERS.ROLE_DOCTOR',
  Receptionist: 'USERS.ROLE_RECEPTIONIST',
};

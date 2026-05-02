// ── Patient domain models ──────────────────────────────────────────────────────

export enum Gender {
  Male   = 0,
  Female = 1,
}

export const GenderLabels: Record<Gender, string> = {
  [Gender.Male]:   'ذكر',
  [Gender.Female]: 'أنثى',
};

// ── Response shapes (match PatientResponse record in the backend) ─────────────

export interface Patient {
  id:          string;
  firstName:   string;
  lastName:    string;
  fullName:    string;
  phone:       string;
  dateOfBirth: string | null;   // DateOnly → "YYYY-MM-DD"
  gender:      Gender;
  notes:       string | null;
  createdAt:   string;
}

/** Lightweight DTO used in autocomplete / search suggestions. */
export interface PatientBrief {
  id:       string;
  fullName: string;
  phone:    string;
}

// ── Request shapes ─────────────────────────────────────────────────────────────

export interface CreatePatientRequest {
  firstName:   string;
  lastName:    string;
  phone:       string;
  dateOfBirth: string | null;
  gender:      Gender;
  notes:       string | null;
}

export type UpdatePatientRequest = CreatePatientRequest;

// ── Query params ──────────────────────────────────────────────────────────────

export interface PatientListQuery {
  search?:   string;
  page?:     number;
  pageSize?: number;
}

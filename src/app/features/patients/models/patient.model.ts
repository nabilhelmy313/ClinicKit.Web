import { PagedQuery } from '../../../core/models/api.models';

// 0 = Male, 1 = Female  (matches .NET Gender enum, serialized as int)
export type Gender = 0 | 1;

// ── Read ──────────────────────────────────────────────────────────────────────

export interface Patient {
  id:          string;
  firstName:   string;
  lastName:    string;
  fullName:    string;
  phone:       string;
  dateOfBirth: string | null;  // "YYYY-MM-DD"
  gender:      Gender;
  notes:       string | null;
  createdAt:   string;
}

export interface PatientBrief {
  id:       string;
  fullName: string;
  phone:    string;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export interface CreatePatientDto {
  firstName:   string;
  lastName:    string;
  phone:       string;
  dateOfBirth: string | null;
  gender:      Gender;
  notes?:      string;
}

export interface UpdatePatientDto extends CreatePatientDto {}

// ── Query ─────────────────────────────────────────────────────────────────────

export type PatientQuery = PagedQuery;

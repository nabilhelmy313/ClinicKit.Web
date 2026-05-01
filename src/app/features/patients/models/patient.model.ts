import { PagedQuery } from '../../../core/models/api.models';

// ── Read ──────────────────────────────────────────────────────────────────────

export interface Patient {
  id:          string;
  fullName:    string;
  phone:       string;
  dateOfBirth: string | null;   // ISO date string
  gender:      'male' | 'female';
  bloodType:   string | null;
  notes:       string | null;
  createdAt:   string;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export interface CreatePatientDto {
  fullName:    string;
  phone:       string;
  dateOfBirth: string | null;
  gender:      'male' | 'female';
  bloodType?:  string;
  notes?:      string;
}

export interface UpdatePatientDto extends CreatePatientDto {
  id: string;
}

// ── Query ─────────────────────────────────────────────────────────────────────

export interface PatientQuery extends PagedQuery {
  gender?: 'male' | 'female';
}

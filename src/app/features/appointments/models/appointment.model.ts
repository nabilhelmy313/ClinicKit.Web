import { PagedQuery } from '../../../core/models/api.models';

// Matches .NET AppointmentStatus enum (int serialization)
// 0=Pending, 1=Confirmed, 2=InProgress, 3=Completed, 4=Cancelled, 5=NoShow
export type AppointmentStatus = 0 | 1 | 2 | 3 | 4 | 5;

// Matches .NET AppointmentType enum (int serialization)
// 0=FirstVisit, 1=FollowUp, 2=Emergency
export type AppointmentType = 0 | 1 | 2;

// ── Read ──────────────────────────────────────────────────────────────────────

export interface Appointment {
  id:                 string;
  patientId:          string;
  patientName:        string;
  patientPhone:       string;
  appointmentDate:    string;   // "YYYY-MM-DD"
  startTime:          string;   // "HH:mm:ss"
  endTime:            string;   // "HH:mm:ss"
  status:             AppointmentStatus;
  type:               AppointmentType;
  notes:              string | null;
  cancellationReason: string | null;
  createdAt:          string;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export interface CreateAppointmentDto {
  patientId:       string;
  appointmentDate: string;   // "YYYY-MM-DD"
  startTime:       string;   // "HH:mm:ss"
  endTime:         string;   // "HH:mm:ss"
  type:            AppointmentType;
  notes?:          string;
}

export interface UpdateAppointmentDto {
  appointmentDate: string;
  startTime:       string;
  endTime:         string;
  type:            AppointmentType;
  notes?:          string;
}

// ── Query ─────────────────────────────────────────────────────────────────────

export interface AppointmentQuery extends PagedQuery {
  fromDate?:  string;
  toDate?:    string;
  status?:    AppointmentStatus;
  patientId?: string;
}

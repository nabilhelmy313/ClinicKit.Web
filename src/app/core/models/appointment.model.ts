// ── Appointment domain models ──────────────────────────────────────────────────

export enum AppointmentStatus {
  Pending    = 0,
  Confirmed  = 1,
  InProgress = 2,
  Completed  = 3,
  Cancelled  = 4,
  NoShow     = 5,
}

export enum AppointmentType {
  FirstVisit = 0,
  FollowUp   = 1,
  Emergency  = 2,
}

// ── Display labels ─────────────────────────────────────────────────────────────

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:    'قيد الانتظار',
  [AppointmentStatus.Confirmed]:  'مؤكد',
  [AppointmentStatus.InProgress]: 'جارٍ',
  [AppointmentStatus.Completed]:  'مكتمل',
  [AppointmentStatus.Cancelled]:  'ملغى',
  [AppointmentStatus.NoShow]:     'لم يحضر',
};

export const AppointmentTypeLabels: Record<AppointmentType, string> = {
  [AppointmentType.FirstVisit]: 'زيارة أولى',
  [AppointmentType.FollowUp]:   'متابعة',
  [AppointmentType.Emergency]:  'طارئ',
};

/** CSS colour class suffix for each status chip. */
export const AppointmentStatusColor: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:    'warning',
  [AppointmentStatus.Confirmed]:  'info',
  [AppointmentStatus.InProgress]: 'primary',
  [AppointmentStatus.Completed]:  'success',
  [AppointmentStatus.Cancelled]:  'danger',
  [AppointmentStatus.NoShow]:     'secondary',
};

// ── Response shapes ───────────────────────────────────────────────────────────

export interface Appointment {
  id:                 string;
  patientId:          string;
  patientName:        string;
  patientPhone:       string;
  appointmentDate:    string;   // DateOnly → "YYYY-MM-DD"
  startTime:          string;   // TimeOnly → "HH:mm:ss"
  endTime:            string;
  status:             AppointmentStatus;
  type:               AppointmentType;
  notes:              string | null;
  cancellationReason: string | null;
  createdAt:          string;
}

// ── Request shapes ─────────────────────────────────────────────────────────────

export interface CreateAppointmentRequest {
  patientId:       string;
  appointmentDate: string;
  startTime:       string;
  endTime:         string;
  type:            AppointmentType;
  notes:           string | null;
}

export interface UpdateAppointmentRequest {
  appointmentDate: string;
  startTime:       string;
  endTime:         string;
  type:            AppointmentType;
  notes:           string | null;
}

export interface UpdateStatusRequest {
  newStatus: AppointmentStatus;
}

export interface CancelAppointmentRequest {
  cancellationReason: string | null;
}

// ── Query params ──────────────────────────────────────────────────────────────

export interface AppointmentListQuery {
  fromDate?: string;
  toDate?:   string;
  status?:   AppointmentStatus;
  patientId?: string;
  page?:     number;
  pageSize?: number;
}

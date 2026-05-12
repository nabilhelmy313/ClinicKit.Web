// ── Attachment models ─────────────────────────────────────────────────────────

export enum AttachmentCategory {
    XRay      = 1,
    LabResult = 2,
    Document  = 3,
    Other     = 4,
}

export interface VisitAttachment {
    id:          string;
    visitId:     string;
    fileName:    string;
    contentType: string;
    fileSize:    number;
    category:    AttachmentCategory;
    createdAt:   string;
}

// ── Visit domain models ───────────────────────────────────────────────────────

export interface VisitMedication {
  id:           string;
  medicineName: string;
  dosage:       string | null;
  frequency:    string | null;
  duration:     string | null;
  instructions: string | null;
}

export interface Visit {
  id:             string;
  patientId:      string;
  appointmentId:  string | null;
  visitDate:      string;         // "YYYY-MM-DD"
  chiefComplaint: string | null;
  diagnosis:      string | null;
  notes:          string | null;
  createdAt:      string;
  medications:    VisitMedication[];
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface CreateMedicationRequest {
  medicineName: string;
  dosage?:      string;
  frequency?:   string;
  duration?:    string;
  instructions?: string;
}

export interface CreateVisitRequest {
  patientId:      string;
  appointmentId?: string;
  visitDate:      string;         // "YYYY-MM-DD"
  chiefComplaint?: string;
  diagnosis?:     string;
  notes?:         string;
  medications:    CreateMedicationRequest[];
}

export interface UpdateVisitRequest {
  visitDate:      string;
  chiefComplaint?: string;
  diagnosis?:     string;
  notes?:         string;
  medications:    CreateMedicationRequest[];
}

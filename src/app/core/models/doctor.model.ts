/** Mirrors ClinicKit.Application.Features.Doctors.DoctorResponse */
export interface Doctor {
  id:              string;
  userId:          string;
  fullName:        string;
  specialty:       string | null;
  phone:           string | null;
  color:           string;           // hex, e.g. "#0D5238"
  consultationFee: number;
  isActive:        boolean;
  workStart:       string | null;    // "HH:mm:ss"
  workEnd:         string | null;
  workingDays:     string | null;
  createdAt:       string;
}

export interface CreateDoctorRequest {
  userId:          string;
  fullName:        string;
  specialty:       string | null;
  phone:           string | null;
  color:           string;
  consultationFee: number;
  workStart:       string | null;
  workEnd:         string | null;
  workingDays:     string | null;
}

export interface UpdateDoctorRequest {
  fullName:        string;
  specialty:       string | null;
  phone:           string | null;
  color:           string;
  consultationFee: number;
  workStart:       string | null;
  workEnd:         string | null;
  workingDays:     string | null;
}

/** Predefined palette for doctor colour picker in the form */
export const DoctorColorPalette = [
  '#0D5238',   // Primary green (طَبَّبَ)
  '#C8893A',   // Accent gold
  '#1565C0',   // Blue
  '#6A1B9A',   // Purple
  '#AD1457',   // Pink/red
  '#00838F',   // Teal
  '#2E7D32',   // Dark green
  '#E65100',   // Orange
];

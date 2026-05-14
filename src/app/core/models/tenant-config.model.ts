/** Mirrors ClinicKit.Domain.Entities.TenantConfig */
export interface TenantConfig {
  id:                  string;
  clinicName:          string;
  clinicPhone:         string | null;
  clinicAddress:       string | null;
  logoUrl:             string | null;
  workingDays:         string | null;
  workStart:           string | null;   // "HH:mm:ss"
  workEnd:             string | null;
  // ── Optional paid services ─────────────────────────────────────────────────
  whatsAppEnabled:     boolean;
  cloudBackupEnabled:  boolean;
  onlineBookingEnabled: boolean;
  // ── Plan-tier feature gates ────────────────────────────────────────────────
  multiDoctorEnabled:  boolean;
  vitalsEnabled:       boolean;
  reportsEnabled:      boolean;
  insuranceEnabled:    boolean;
  eReceiptEnabled:     boolean;
  analyticsEnabled:    boolean;
}

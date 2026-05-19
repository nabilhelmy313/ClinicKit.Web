export interface TenantSummary {
  id:                   string;
  tenantId:             string;
  clinicName:           string;
  clinicPhone:          string | null;
  isDeleted:            boolean;
  whatsAppEnabled:      boolean;
  cloudBackupEnabled:   boolean;
  onlineBookingEnabled: boolean;
  multiDoctorEnabled:   boolean;
  vitalsEnabled:        boolean;
  reportsEnabled:       boolean;
  insuranceEnabled:     boolean;
  eReceiptEnabled:      boolean;
  analyticsEnabled:     boolean;
  createdAt:            string;
}

export interface UpdateTenantFeaturesRequest {
  whatsAppEnabled:      boolean;
  cloudBackupEnabled:   boolean;
  onlineBookingEnabled: boolean;
  multiDoctorEnabled:   boolean;
  vitalsEnabled:        boolean;
  reportsEnabled:       boolean;
  insuranceEnabled:     boolean;
  eReceiptEnabled:      boolean;
  analyticsEnabled:     boolean;
}

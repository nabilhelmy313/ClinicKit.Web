export interface ServiceItem {
  id: string;
  name: string;
  nameEn: string | null;
  category: string | null;
  defaultPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface MedicineItem {
  id: string;
  name: string;
  nameEn: string | null;
  defaultDosage: string | null;
  defaultFrequency: string | null;
  isActive: boolean;
}

// ── Request interfaces ────────────────────────────────────────────────────────
export interface CreateServiceItemRequest {
  name: string;
  nameEn?: string;
  category?: string;
  defaultPrice: number;
  sortOrder: number;
}

export interface UpdateServiceItemRequest {
  name: string;
  nameEn?: string;
  category?: string;
  defaultPrice: number;
  sortOrder: number;
}

export interface CreateMedicineItemRequest {
  name: string;
  nameEn?: string;
  defaultDosage?: string;
  defaultFrequency?: string;
}

export interface UpdateMedicineItemRequest {
  name: string;
  nameEn?: string;
  defaultDosage?: string;
  defaultFrequency?: string;
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ServiceItem, MedicineItem,
  CreateServiceItemRequest, UpdateServiceItemRequest,
  CreateMedicineItemRequest, UpdateMedicineItemRequest,
} from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);

  // ── Services (active only — for invoice quick-pick) ───────────────────────
  getServices(search?: string): Observable<ServiceItem[]> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return this.api.get<ServiceItem[]>('/api/catalog/services', params);
  }

  // ── Services (all — for admin catalog page) ───────────────────────────────
  getAllServices(): Observable<ServiceItem[]> {
    return this.api.get<ServiceItem[]>('/api/catalog/services/all');
  }

  createService(body: CreateServiceItemRequest): Observable<ServiceItem> {
    return this.api.post<ServiceItem>('/api/catalog/services', body);
  }

  updateService(id: string, body: UpdateServiceItemRequest): Observable<ServiceItem> {
    return this.api.put<ServiceItem>(`/api/catalog/services/${id}`, body);
  }

  toggleService(id: string): Observable<ServiceItem> {
    return this.api.patch<ServiceItem>(`/api/catalog/services/${id}/toggle`, {});
  }

  // ── Medicines (active only — for prescription autocomplete) ───────────────
  getMedicines(search: string): Observable<MedicineItem[]> {
    return this.api.get<MedicineItem[]>('/api/catalog/medicines', { search });
  }

  // ── Medicines (all — for admin catalog page) ──────────────────────────────
  getAllMedicines(): Observable<MedicineItem[]> {
    return this.api.get<MedicineItem[]>('/api/catalog/medicines/all');
  }

  createMedicine(body: CreateMedicineItemRequest): Observable<MedicineItem> {
    return this.api.post<MedicineItem>('/api/catalog/medicines', body);
  }

  updateMedicine(id: string, body: UpdateMedicineItemRequest): Observable<MedicineItem> {
    return this.api.put<MedicineItem>(`/api/catalog/medicines/${id}`, body);
  }

  toggleMedicine(id: string): Observable<MedicineItem> {
    return this.api.patch<MedicineItem>(`/api/catalog/medicines/${id}/toggle`, {});
  }
}

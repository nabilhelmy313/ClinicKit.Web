import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { TenantSummary, UpdateTenantFeaturesRequest } from '../models/tenant-admin.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminTenantsService {
  private readonly api = inject(ApiService);

  list(): Observable<TenantSummary[]> {
    return this.api.get<TenantSummary[]>('/api/admin/tenants');
  }

  updateFeatures(tenantId: string, features: UpdateTenantFeaturesRequest): Observable<void> {
    return this.api.put<void>(`/api/admin/tenants/${tenantId}/features`, features);
  }
}

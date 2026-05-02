import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PagedResult } from '../models/api.models';
import {
  Patient,
  PatientBrief,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientListQuery,
} from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientsService extends ApiService {

  /** GET /api/patients — paginated list with optional search. */
  list(query?: PatientListQuery): Observable<PagedResult<Patient>> {
    return this.get<PagedResult<Patient>>('/api/patients', query as Record<string, unknown>);
  }

  /** GET /api/patients/search?term=… — quick autocomplete (top 10). */
  search(term: string): Observable<PatientBrief[]> {
    return this.get<PatientBrief[]>('/api/patients/search', { term });
  }

  /** GET /api/patients/:id */
  getById(id: string): Observable<Patient> {
    return this.get<Patient>(`/api/patients/${id}`);
  }

  /** POST /api/patients */
  create(body: CreatePatientRequest): Observable<Patient> {
    return this.post<Patient>('/api/patients', body);
  }

  /** PUT /api/patients/:id */
  update(id: string, body: UpdatePatientRequest): Observable<Patient> {
    return this.put<Patient>(`/api/patients/${id}`, body);
  }
}

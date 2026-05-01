import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PagedResult } from '../../../core/models/api.models';
import {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  PatientQuery,
} from '../models/patient.model';

/**
 * Pure HTTP layer for the Patients feature.
 * No state, no signals — only API calls.
 * All business logic and state live in PatientsFacade.
 */
@Injectable({ providedIn: 'root' })
export class PatientsApiService extends ApiService {
  private readonly path = '/api/patients';

  getAll(query: PatientQuery = {}): Observable<PagedResult<Patient>> {
    return this.get<PagedResult<Patient>>(this.path, query as Record<string, unknown>);
  }

  getById(id: string): Observable<Patient> {
    return this.get<Patient>(`${this.path}/${id}`);
  }

  create(dto: CreatePatientDto): Observable<Patient> {
    return this.post<Patient>(this.path, dto);
  }

  update(id: string, dto: UpdatePatientDto): Observable<Patient> {
    return this.put<Patient>(`${this.path}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.delete<void>(`${this.path}/${id}`);
  }
}

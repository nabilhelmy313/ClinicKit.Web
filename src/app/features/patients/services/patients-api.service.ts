import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PagedResult } from '../../../core/models/api.models';
import {
  Patient,
  PatientBrief,
  CreatePatientDto,
  UpdatePatientDto,
  PatientQuery,
} from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientsApiService extends ApiService {
  private readonly path = '/api/patients';

  getAll(query: PatientQuery = {}): Observable<PagedResult<Patient>> {
    return this.get<PagedResult<Patient>>(this.path, query as Record<string, unknown>);
  }

  getById(id: string): Observable<Patient> {
    return this.get<Patient>(`${this.path}/${id}`);
  }

  search(term: string): Observable<PatientBrief[]> {
    return this.get<PatientBrief[]>(`${this.path}/search`, { term });
  }

  create(dto: CreatePatientDto): Observable<Patient> {
    return this.post<Patient>(this.path, dto);
  }

  update(id: string, dto: UpdatePatientDto): Observable<Patient> {
    return this.put<Patient>(`${this.path}/${id}`, dto);
  }
}

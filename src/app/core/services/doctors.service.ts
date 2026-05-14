import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Doctor, CreateDoctorRequest, UpdateDoctorRequest } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorsService extends ApiService {

  /** GET /api/doctors?activeOnly=true */
  list(activeOnly = true): Observable<Doctor[]> {
    return this.get<Doctor[]>('/api/doctors', { activeOnly });
  }

  /** GET /api/doctors/:id */
  getById(id: string): Observable<Doctor> {
    return this.get<Doctor>(`/api/doctors/${id}`);
  }

  /** POST /api/doctors */
  create(body: CreateDoctorRequest): Observable<Doctor> {
    return this.post<Doctor>('/api/doctors', body);
  }

  /** PUT /api/doctors/:id */
  update(id: string, body: UpdateDoctorRequest): Observable<Doctor> {
    return this.put<Doctor>(`/api/doctors/${id}`, body);
  }

  /** PUT /api/doctors/:id/deactivate */
  deactivate(id: string): Observable<void> {
    return this.put<void>(`/api/doctors/${id}/deactivate`, {});
  }
}

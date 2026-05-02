import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PagedResult } from '../models/api.models';
import {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdateStatusRequest,
  CancelAppointmentRequest,
  AppointmentListQuery,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentsService extends ApiService {

  /** GET /api/appointments — paginated list with optional filters. */
  list(query?: AppointmentListQuery): Observable<PagedResult<Appointment>> {
    return this.get<PagedResult<Appointment>>('/api/appointments', query as Record<string, unknown>);
  }

  /** GET /api/appointments/:id */
  getById(id: string): Observable<Appointment> {
    return this.get<Appointment>(`/api/appointments/${id}`);
  }

  /** GET /api/appointments/daily?date=YYYY-MM-DD */
  getDaily(date: string): Observable<Appointment[]> {
    return this.get<Appointment[]>('/api/appointments/daily', { date });
  }

  /** GET /api/appointments/patient/:patientId — history for one patient, paginated. */
  getPatientHistory(patientId: string, page = 1, pageSize = 20): Observable<PagedResult<Appointment>> {
    return this.get<PagedResult<Appointment>>(
      `/api/appointments/patient/${patientId}`,
      { page, pageSize },
    );
  }

  /** POST /api/appointments */
  create(body: CreateAppointmentRequest): Observable<Appointment> {
    return this.post<Appointment>('/api/appointments', body);
  }

  /** PUT /api/appointments/:id */
  update(id: string, body: UpdateAppointmentRequest): Observable<Appointment> {
    return this.put<Appointment>(`/api/appointments/${id}`, body);
  }

  /** PUT /api/appointments/:id/status */
  updateStatus(id: string, body: UpdateStatusRequest): Observable<Appointment> {
    return this.put<Appointment>(`/api/appointments/${id}/status`, body);
  }

  /** PUT /api/appointments/:id/cancel */
  cancel(id: string, body: CancelAppointmentRequest): Observable<Appointment> {
    return this.put<Appointment>(`/api/appointments/${id}/cancel`, body);
  }
}

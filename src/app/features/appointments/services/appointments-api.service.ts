import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PagedResult } from '../../../core/models/api.models';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQuery,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService extends ApiService {
  private readonly path = '/api/appointments';

  getAll(query: AppointmentQuery = {}): Observable<PagedResult<Appointment>> {
    return this.get<PagedResult<Appointment>>(this.path, query as Record<string, unknown>);
  }

  getById(id: string): Observable<Appointment> {
    return this.get<Appointment>(`${this.path}/${id}`);
  }

  getDaily(date: string): Observable<Appointment[]> {
    return this.get<Appointment[]>(`${this.path}/daily`, { date });
  }

  getPatientHistory(patientId: string, page = 1, pageSize = 20): Observable<PagedResult<Appointment>> {
    return this.get<PagedResult<Appointment>>(`${this.path}/patient/${patientId}`, { page, pageSize });
  }

  create(dto: CreateAppointmentDto): Observable<Appointment> {
    return this.post<Appointment>(this.path, dto);
  }

  update(id: string, dto: UpdateAppointmentDto): Observable<Appointment> {
    return this.put<Appointment>(`${this.path}/${id}`, dto);
  }

  updateStatus(id: string, newStatus: AppointmentStatus): Observable<Appointment> {
    return this.put<Appointment>(`${this.path}/${id}/status`, { newStatus });
  }

  cancel(id: string, cancellationReason?: string): Observable<Appointment> {
    return this.put<Appointment>(`${this.path}/${id}/cancel`, { cancellationReason });
  }
}

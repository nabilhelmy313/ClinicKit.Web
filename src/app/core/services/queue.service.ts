import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { QueueEntry, QueueStatusResponse } from '../models/queue.model';

@Injectable({ providedIn: 'root' })
export class QueueService extends ApiService {

  /** GET /api/queue/today — full list sorted by queue number. */
  getToday(): Observable<QueueEntry[]> {
    return this.get<QueueEntry[]>('/api/queue/today');
  }

  /** GET /api/queue/status — anonymous snapshot for the display screen.
   *  Pass tenantId when calling from an unauthenticated context (display screen).
   */
  getStatus(tenantId?: string): Observable<QueueStatusResponse> {
    const params = tenantId ? { tenantId } : undefined;
    return this.get<QueueStatusResponse>('/api/queue/status', params as Record<string, unknown>);
  }

  /** POST /api/queue/enqueue/:appointmentId — add to today's queue. */
  enqueue(appointmentId: string): Observable<QueueEntry> {
    return this.post<QueueEntry>(`/api/queue/enqueue/${appointmentId}`, {});
  }

  /** PUT /api/queue/call-next — complete current, serve next. */
  callNext(): Observable<QueueEntry | null> {
    return this.put<QueueEntry | null>('/api/queue/call-next', {});
  }

  /** PUT /api/queue/:id/complete — manually mark as done. */
  complete(id: string): Observable<QueueEntry> {
    return this.put<QueueEntry>(`/api/queue/${id}/complete`, {});
  }

  /** PUT /api/queue/:id/skip — mark patient as skipped. */
  skip(id: string): Observable<QueueEntry> {
    return this.put<QueueEntry>(`/api/queue/${id}/skip`, {});
  }
}

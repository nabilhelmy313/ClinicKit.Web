import { Injectable }  from '@angular/core';
import { Observable }  from 'rxjs';
import { ApiService }          from './api.service';
import { PagedResult }         from '../models/api.models';
import {
    Visit, CreateVisitRequest, UpdateVisitRequest,
    VisitAttachment, AttachmentCategory,
} from '../models/visit.model';

@Injectable({ providedIn: 'root' })
export class VisitsService extends ApiService {

  /** GET /api/visits/patient/:patientId — paginated visit history, newest first */
  getPatientVisits(patientId: string, page = 1, pageSize = 20): Observable<PagedResult<Visit>> {
    return this.get<PagedResult<Visit>>(
      `/api/visits/patient/${patientId}`,
      { page, pageSize },
    );
  }

  /** GET /api/visits/:id — single visit with medications */
  getById(id: string): Observable<Visit> {
    return this.get<Visit>(`/api/visits/${id}`);
  }

  /** POST /api/visits */
  create(body: CreateVisitRequest): Observable<Visit> {
    return this.post<Visit>('/api/visits', body);
  }

  /** PUT /api/visits/:id */
  update(id: string, body: UpdateVisitRequest): Observable<Visit> {
    return this.put<Visit>(`/api/visits/${id}`, body);
  }

  // ── Attachments ────────────────────────────────────────────────────────────

  /** GET /api/visits/:visitId/attachments */
  getAttachments(visitId: string): Observable<VisitAttachment[]> {
    return this.get<VisitAttachment[]>(`/api/visits/${visitId}/attachments`);
  }

  /** POST /api/visits/:visitId/attachments  (multipart/form-data) */
  uploadAttachment(
    visitId:  string,
    file:     File,
    category: AttachmentCategory,
  ): Observable<VisitAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', String(category));
    return this.post<VisitAttachment>(`/api/visits/${visitId}/attachments`, formData);
  }

  /** GET /api/visits/:visitId/attachments/:id/download — returns blob (authenticated) */
  getAttachmentBlob(visitId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(
      `/api/visits/${visitId}/attachments/${attachmentId}/download`,
      { responseType: 'blob' },
    );
  }

  /** GET /api/visits/:visitId/attachments/:id/download — triggers browser download */
  downloadAttachment(visitId: string, attachmentId: string, fileName: string): void {
    this.http
      .get(`/api/visits/${visitId}/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      })
      .subscribe(blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      });
  }

  /** DELETE /api/visits/:visitId/attachments/:id */
  deleteAttachment(visitId: string, attachmentId: string): Observable<void> {
    return this.delete<void>(`/api/visits/${visitId}/attachments/${attachmentId}`);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map }        from 'rxjs/operators';
import { ApiService } from './api.service';
import { PagedResult } from '../models/api.models';
import {
  Invoice,
  InvoiceListQuery,
  CreateInvoiceRequest,
  UpdateInvoiceStatusRequest,
  InvoiceStatusFromInt,
} from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService extends ApiService {

  // ── Normaliser — backend returns status as int (0/1/2), frontend uses string ──
  private normalize(raw: any): Invoice {
    return {
      ...raw,
      status: typeof raw.status === 'number'
        ? (InvoiceStatusFromInt[raw.status] ?? raw.status)
        : raw.status,
    };
  }

  /** GET /api/invoices — paginated list */
  listInvoices(query?: InvoiceListQuery): Observable<PagedResult<Invoice>> {
    return this.get<PagedResult<Invoice>>('/api/invoices', query as Record<string, unknown>).pipe(
      map(res => ({ ...res, items: res.items.map(i => this.normalize(i)) })),
    );
  }

  /** GET /api/invoices/:id */
  getInvoiceById(id: string): Observable<Invoice> {
    return this.get<Invoice>(`/api/invoices/${id}`).pipe(
      map(inv => this.normalize(inv)),
    );
  }

  /** POST /api/invoices */
  createInvoice(body: CreateInvoiceRequest): Observable<Invoice> {
    return this.post<Invoice>('/api/invoices', body).pipe(
      map(inv => this.normalize(inv)),
    );
  }

  /** PATCH /api/invoices/:id/status */
  updateStatus(id: string, body: UpdateInvoiceStatusRequest): Observable<Invoice> {
    return this.patch<Invoice>(`/api/invoices/${id}/status`, body).pipe(
      map(inv => this.normalize(inv)),
    );
  }
}

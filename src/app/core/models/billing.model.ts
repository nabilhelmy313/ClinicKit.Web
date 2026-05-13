import { PagedQuery } from './api.models';

export type InvoiceStatus = 'Draft' | 'Paid' | 'Cancelled';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface InvoiceItem {
  id:          string;
  description: string;
  quantity:    number;
  unitPrice:   number;
  amount:      number;
}

export interface Invoice {
  id:            string;
  invoiceNumber: string;
  patientName:   string;
  patientId:     string;
  visitId?:      string;   // اختياري — null = كشف مدفوع قبل الزيارة
  invoiceDate:   string;   // DateOnly serialised as "yyyy-MM-dd"
  status:        InvoiceStatus;
  subTotal:      number;
  discount:      number;
  total:         number;
  paidAt?:       string;
  notes?:        string;
  items:         InvoiceItem[];
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface CreateInvoiceItemRequest {
  description: string;
  quantity:    number;
  unitPrice:   number;
}

export interface CreateInvoiceRequest {
  patientId: string;
  visitId?:  string;   // اختياري — null = كشف قبل الزيارة
  items:     CreateInvoiceItemRequest[];
  notes?:    string;
}

export interface UpdateInvoiceStatusRequest {
  newStatus: InvoiceStatus;
}

// ── Query params ──────────────────────────────────────────────────────────────

export interface InvoiceListQuery extends PagedQuery {
  patientId?: string;
  status?:    number;   // 0=Draft, 1=Paid, 2=Cancelled (backend enum int)
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  Draft:     'BILLING.STATUS_DRAFT',
  Paid:      'BILLING.STATUS_PAID',
  Cancelled: 'BILLING.STATUS_CANCELLED',
};

export const InvoiceStatusColors: Record<InvoiceStatus, 'warning' | 'success' | 'default'> = {
  Draft:     'warning',
  Paid:      'success',
  Cancelled: 'default',
};

/** Backend enum int → frontend string */
export const InvoiceStatusFromInt: Record<number, InvoiceStatus> = {
  0: 'Draft',
  1: 'Paid',
  2: 'Cancelled',
};

/** Frontend string → backend enum int (for query params) */
export const InvoiceStatusToInt: Record<InvoiceStatus, number> = {
  Draft:     0,
  Paid:      1,
  Cancelled: 2,
};

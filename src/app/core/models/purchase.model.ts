import { PagedQuery } from './api.models';

export type PurchaseOrderStatus = 'Draft' | 'Received' | 'Cancelled';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface Supplier {
    id:       string;
    name:     string;
    phone:    string | null;
    address:  string | null;
    notes:    string | null;
}

export interface PurchaseOrderItem {
    id:                string;
    medicineCatalogId: string | null;
    medicineName:      string | null;
    description:       string;
    quantity:          number;
    unitCost:          number;
    totalCost:         number;
}

export interface PurchaseOrder {
    id:           string;
    supplierId:   string;
    supplierName: string;
    orderDate:    string;     // "YYYY-MM-DD"
    status:       PurchaseOrderStatus;
    totalAmount:  number;
    notes:        string | null;
    createdAt:    string;
    items:        PurchaseOrderItem[];
}

export interface LowStockItem {
    medicineId:        string;
    name:              string;
    nameEn:            string | null;
    currentStock:      number;
    lowStockThreshold: number;
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface CreateSupplierRequest {
    name:     string;
    phone?:   string;
    address?: string;
    notes?:   string;
}

export interface CreatePurchaseOrderItemRequest {
    medicineCatalogId?: string;
    description:        string;
    quantity:           number;
    unitCost:           number;
}

export interface CreatePurchaseOrderRequest {
    supplierId: string;
    orderDate:  string;   // "YYYY-MM-DD"
    items:      CreatePurchaseOrderItemRequest[];
    notes?:     string;
}

// ── Query params ──────────────────────────────────────────────────────────────

export interface PurchaseOrderListQuery extends PagedQuery {
    supplierId?: string;
    status?:     number;   // 0=Draft, 1=Received, 2=Cancelled
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const PurchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
    Draft:     'PURCHASES.STATUS_DRAFT',
    Received:  'PURCHASES.STATUS_RECEIVED',
    Cancelled: 'PURCHASES.STATUS_CANCELLED',
};

export const PurchaseOrderStatusFromInt: Record<number, PurchaseOrderStatus> = {
    0: 'Draft',
    1: 'Received',
    2: 'Cancelled',
};

export const PurchaseOrderStatusToInt: Record<PurchaseOrderStatus, number> = {
    Draft:     0,
    Received:  1,
    Cancelled: 2,
};

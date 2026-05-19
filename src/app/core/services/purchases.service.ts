import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService }   from './api.service';
import { PagedResult }  from '../models/api.models';
import {
    Supplier,
    PurchaseOrder,
    LowStockItem,
    CreateSupplierRequest,
    CreatePurchaseOrderRequest,
    PurchaseOrderListQuery,
    PurchaseOrderStatusFromInt,
} from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchasesService extends ApiService {

    private normalizeOrder(raw: any): PurchaseOrder {
        return {
            ...raw,
            status: typeof raw.status === 'number'
                ? (PurchaseOrderStatusFromInt[raw.status] ?? raw.status)
                : raw.status,
        };
    }

    // ── Suppliers ─────────────────────────────────────────────────────────────

    listSuppliers(page = 1, pageSize = 50, search?: string): Observable<PagedResult<Supplier>> {
        return this.get<PagedResult<Supplier>>('/api/purchases/suppliers', {
            page, pageSize, search,
        } as Record<string, unknown>);
    }

    createSupplier(body: CreateSupplierRequest): Observable<Supplier> {
        return this.post<Supplier>('/api/purchases/suppliers', body);
    }

    // ── Purchase Orders ───────────────────────────────────────────────────────

    listOrders(query?: PurchaseOrderListQuery): Observable<PagedResult<PurchaseOrder>> {
        return this.get<PagedResult<PurchaseOrder>>(
            '/api/purchases/orders', query as Record<string, unknown>,
        ).pipe(map(res => ({ ...res, items: res.items.map(o => this.normalizeOrder(o)) })));
    }

    getOrderById(id: string): Observable<PurchaseOrder> {
        return this.get<PurchaseOrder>(`/api/purchases/orders/${id}`).pipe(
            map(o => this.normalizeOrder(o)),
        );
    }

    createOrder(body: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
        return this.post<PurchaseOrder>('/api/purchases/orders', body).pipe(
            map(o => this.normalizeOrder(o)),
        );
    }

    receiveOrder(id: string): Observable<PurchaseOrder> {
        return this.post<PurchaseOrder>(`/api/purchases/orders/${id}/receive`, {}).pipe(
            map(o => this.normalizeOrder(o)),
        );
    }

    cancelOrder(id: string): Observable<PurchaseOrder> {
        return this.post<PurchaseOrder>(`/api/purchases/orders/${id}/cancel`, {}).pipe(
            map(o => this.normalizeOrder(o)),
        );
    }

    // ── Inventory ─────────────────────────────────────────────────────────────

    getLowStock(): Observable<LowStockItem[]> {
        return this.get<LowStockItem[]>('/api/purchases/low-stock');
    }
}

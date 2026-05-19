import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router }                 from '@angular/router';

import { PurchasesService } from '../../../../core/services/purchases.service';
import { LanguageService }  from '../../../../core/services/language.service';
import { ThemeService }     from '../../../../core/services/theme.service';
import { TranslatePipe }    from '../../../../core/pipes/translate.pipe';
import {
    PurchaseOrder,
    PurchaseOrderStatus,
    PurchaseOrderStatusLabels,
    PurchaseOrderStatusToInt,
} from '../../../../core/models/purchase.model';
import {
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
    CkTableComponent, CkCellDefDirective, CkStatusBadgeComponent,
} from '../../../../shared/index';
import type { CkColumnDef, CkTableAction, CkFilterOption } from '../../../../shared/index';

@Component({
    selector: 'app-purchase-orders-list',
    standalone: true,
    templateUrl: './purchase-orders-list.component.html',
    styleUrl:    './purchase-orders-list.component.scss',
    imports: [
        CommonModule, DatePipe, TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
        CkTableComponent, CkCellDefDirective, CkStatusBadgeComponent,
    ],
})
export class PurchaseOrdersListComponent implements OnInit {
    readonly router       = inject(Router);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly svc  = inject(PurchasesService);

    orders     = signal<PurchaseOrder[]>([]);
    totalCount = signal(0);
    page       = signal(1);
    pageSize   = signal(20);
    loading    = signal(false);

    private _status = signal<PurchaseOrderStatus | undefined>(undefined);

    private readonly statusOptions: CkFilterOption[] = [
        { value: 'Draft',     label: 'PURCHASES.STATUS_DRAFT'     },
        { value: 'Received',  label: 'PURCHASES.STATUS_RECEIVED'  },
        { value: 'Cancelled', label: 'PURCHASES.STATUS_CANCELLED' },
    ];

    colDefs: CkColumnDef[] = [
        { key: 'supplierName', label: 'PURCHASES.SUPPLIER',   sortable: true },
        { key: 'orderDate',    label: 'PURCHASES.ORDER_DATE', sortable: true },
        { key: 'totalAmount',  label: 'PURCHASES.TOTAL',      sortable: true },
        {
            key: 'status', label: 'PURCHASES.STATUS', sortable: true,
            searchable: true, filterType: 'select', filterOptions: this.statusOptions,
        },
    ];

    tableActions: CkTableAction<PurchaseOrder>[] = [
        {
            icon:   'visibility',
            label:  'COMMON.VIEW',
            inline: true,
            click:  (o) => this.router.navigate(['/purchases/orders', o.id]),
        },
    ];

    readonly statusColorMap = {
        Draft: 'warning', Received: 'success', Cancelled: 'neutral',
    } as const;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading.set(true);
        const status = this._status();
        this.svc.listOrders({
            page:     this.page(),
            pageSize: this.pageSize(),
            status:   status ? PurchaseOrderStatusToInt[status] : undefined,
        }).subscribe({
            next: res => {
                this.orders.set(res.items);
                this.totalCount.set(res.totalCount);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    statusLabel(s: PurchaseOrderStatus): string {
        const key = PurchaseOrderStatusLabels[s];
        return key ? this.langService.translate(key) : s;
    }

    prevPage(): void { this.page.update(p => p - 1); this.load(); }
    nextPage(): void { this.page.update(p => p + 1); this.load(); }
    onPageSizeChange(size: number): void { this.pageSize.set(size); this.page.set(1); this.load(); }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }  from '@angular/common';
import { Router, RouterLink }      from '@angular/router';

import { BillingService }  from '../../../core/services/billing.service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import {
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
    CkTableComponent, CkCellDefDirective,
    CkStatusBadgeComponent,
} from '../../../shared/index';
import type { CkColumnDef, CkTableAction, CkFilterOption, CkSortChange } from '../../../shared/index';
import {
    Invoice,
    InvoiceStatus,
    InvoiceStatusLabels,
    InvoiceStatusColors,
    InvoiceStatusToInt,
} from '../../../core/models/billing.model';

@Component({
    selector: 'app-invoices',
    standalone: true,
    templateUrl: './invoices.component.html',
    styleUrl:    './invoices.component.scss',
    imports: [
        CommonModule, DatePipe, TranslatePipe, RouterLink,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
        CkTableComponent, CkCellDefDirective,
        CkStatusBadgeComponent,
    ],
})
export class InvoicesComponent implements OnInit {
    readonly router       = inject(Router);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly svc  = inject(BillingService);

    // ── State ─────────────────────────────────────────────────────────────────
    invoices   = signal<Invoice[]>([]);
    totalCount = signal(0);
    page       = signal(1);
    pageSize   = signal(20);
    loading    = signal(false);

    private _search = signal<string | undefined>(undefined);
    private _status = signal<InvoiceStatus | undefined>(undefined);

    // ── Status filter options ─────────────────────────────────────────────────
    private readonly statusOptions: CkFilterOption[] = [
        { value: 'Draft',     label: 'BILLING.STATUS_DRAFT'     },
        { value: 'Paid',      label: 'BILLING.STATUS_PAID'      },
        { value: 'Cancelled', label: 'BILLING.STATUS_CANCELLED' },
    ];

    // ── Column definitions ────────────────────────────────────────────────────
    colDefs: CkColumnDef[] = [
        { key: 'invoiceNumber', label: 'BILLING.INVOICE_NUMBER', sortable: true, searchable: true, filterType: 'text' },
        { key: 'patientName',   label: 'BILLING.PATIENT',        sortable: true, searchable: true, filterType: 'text' },
        { key: 'invoiceDate',   label: 'BILLING.DATE',           sortable: true },
        {
            key: 'status', label: 'BILLING.STATUS', sortable: true,
            searchable: true, filterType: 'select', filterOptions: this.statusOptions,
        },
        { key: 'total', label: 'BILLING.TOTAL', sortable: true },
    ];

    tableActions: CkTableAction<Invoice>[] = [
        {
            icon:   'visibility',
            label:  'COMMON.VIEW',
            inline: true,
            click:  (inv) => this.router.navigate(['/billing/invoices', inv.id]),
        },
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────
    readonly invoiceColorMap = { Draft: 'warning', Paid: 'success', Cancelled: 'neutral' } as const;

    statusLabel(s: InvoiceStatus) { return InvoiceStatusLabels[s] ?? s; }

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading.set(true);
        const statusInt = this._status() !== undefined
            ? InvoiceStatusToInt[this._status()!]
            : undefined;

        this.svc.listInvoices({
            search:   this._search(),
            status:   statusInt,
            page:     this.page(),
            pageSize: this.pageSize(),
        }).subscribe({
            next: res => {
                this.invoices.set(res.items);
                this.totalCount.set(res.totalCount);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    onFilterChange(filters: Record<string, string>): void {
        this._search.set(filters['invoiceNumber'] || filters['patientName'] || undefined);
        this._status.set((filters['status'] as InvoiceStatus) || undefined);
        this.page.set(1);
        this.load();
    }

    onSortChange(_sort: CkSortChange): void {
        this.page.set(1);
        this.load();
    }

    prevPage():  void { this.page.update(p => p - 1); this.load(); }
    nextPage():  void { this.page.update(p => p + 1); this.load(); }
    onPageSizeChange(size: number): void { this.pageSize.set(size); this.page.set(1); this.load(); }
}

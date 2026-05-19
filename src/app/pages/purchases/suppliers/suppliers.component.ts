import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }          from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule }    from '@angular/material/form-field';
import { MatInputModule }        from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { PurchasesService } from '../../../core/services/purchases.service';
import { ToastService }     from '../../../core/services/toast.service';
import { LanguageService }  from '../../../core/services/language.service';
import { ThemeService }     from '../../../core/services/theme.service';
import { TranslatePipe }    from '../../../core/pipes/translate.pipe';
import { Supplier }         from '../../../core/models/purchase.model';
import {
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
    CkTableComponent,
} from '../../../shared/index';
import type { CkColumnDef, CkTableAction } from '../../../shared/index';

@Component({
    selector: 'app-suppliers',
    standalone: true,
    templateUrl: './suppliers.component.html',
    styleUrl:    './suppliers.component.scss',
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatDialogModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
        CkTableComponent,
    ],
})
export class SuppliersComponent implements OnInit {
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly svc  = inject(PurchasesService);
    private readonly toast = inject(ToastService);
    private readonly fb   = inject(FormBuilder);

    // ── State ─────────────────────────────────────────────────────────────────
    suppliers  = signal<Supplier[]>([]);
    totalCount = signal(0);
    page       = signal(1);
    pageSize   = signal(50);
    loading    = signal(false);
    showForm   = signal(false);
    saving     = signal(false);

    // ── Form ──────────────────────────────────────────────────────────────────
    form = this.fb.group({
        name:    ['', [Validators.required, Validators.maxLength(200)]],
        phone:   ['', Validators.maxLength(30)],
        address: ['', Validators.maxLength(500)],
        notes:   ['', Validators.maxLength(1000)],
    });

    // ── Columns ───────────────────────────────────────────────────────────────
    colDefs: CkColumnDef[] = [
        { key: 'name',    label: 'PURCHASES.SUPPLIER_NAME', sortable: true, searchable: true, filterType: 'text' },
        { key: 'phone',   label: 'PURCHASES.PHONE' },
        { key: 'address', label: 'PURCHASES.ADDRESS' },
    ];

    tableActions: CkTableAction<Supplier>[] = [];

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading.set(true);
        this.svc.listSuppliers(this.page(), this.pageSize()).subscribe({
            next: res => {
                this.suppliers.set(res.items);
                this.totalCount.set(res.totalCount);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    openForm(): void {
        this.form.reset();
        this.showForm.set(true);
    }

    save(): void {
        if (this.form.invalid) return;
        this.saving.set(true);
        const v = this.form.getRawValue();
        this.svc.createSupplier({
            name:    v.name ?? '',
            phone:   v.phone   || undefined,
            address: v.address || undefined,
            notes:   v.notes   || undefined,
        }).subscribe({
            next: () => {
                this.toast.success(this.langService.translate('PURCHASES.SUPPLIER_CREATED'));
                this.showForm.set(false);
                this.load();
                this.saving.set(false);
            },
            error: () => this.saving.set(false),
        });
    }

    prevPage(): void { this.page.update(p => p - 1); this.load(); }
    nextPage(): void { this.page.update(p => p + 1); this.load(); }
    onPageSizeChange(size: number): void { this.pageSize.set(size); this.page.set(1); this.load(); }
}

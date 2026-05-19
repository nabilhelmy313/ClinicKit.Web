import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { CatalogService }  from '../../../core/services/catalog.service';
import { ToastService }    from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import { ServiceItem, MedicineItem } from '../../../core/models/catalog.model';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import {
    CkPageHeaderComponent,
    CkCardComponent,
    CkBtnComponent,
    CkStatusBadgeComponent,
    CkTableComponent,
    CkCellDefDirective,
    CkTabsComponent,
} from '../../../shared';
import type { CkColumnDef, CkTableAction, CkTab } from '../../../shared';
import { ServiceDialogComponent }  from './service-dialog/service-dialog.component';
import { MedicineDialogComponent } from './medicine-dialog/medicine-dialog.component';

@Component({
    selector: 'app-catalog',
    standalone: true,
    templateUrl: './catalog.component.html',
    styleUrl:    './catalog.component.scss',
    imports: [
        CommonModule, TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
        CkStatusBadgeComponent, CkTableComponent, CkCellDefDirective, CkTabsComponent,
    ],
})
export class CatalogComponent implements OnInit {
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly svc    = inject(CatalogService);
    private readonly toast  = inject(ToastService);
    private readonly dialog = inject(MatDialog);

    // ── Active tab ────────────────────────────────────────────────────────────
    activeTab = signal<'services' | 'medicines'>('services');

    // ── State ─────────────────────────────────────────────────────────────────
    servicesLoading  = signal(false);
    services         = signal<ServiceItem[]>([]);
    medicinesLoading = signal(false);
    medicines        = signal<MedicineItem[]>([]);

    // ── CkTabs config ─────────────────────────────────────────────────────────
    readonly catalogTabs: CkTab[] = [
        { key: 'services',  label: 'CATALOG.SERVICES_TAB',  icon: 'medical_services' },
        { key: 'medicines', label: 'CATALOG.MEDICINES_TAB', icon: 'medication'       },
    ];

    // ── Status badge color map ────────────────────────────────────────────────
    readonly statusMap = {
        active: 'success' as const,
        hidden: 'neutral' as const,
    };

    // ── CkTable column definitions ────────────────────────────────────────────
    readonly servicesCols: CkColumnDef[] = [
        { key: 'name',         label: 'CATALOG.SERVICE_NAME',  sortable: true, searchable: true },
        { key: 'category',     label: 'CATALOG.CATEGORY',      sortable: true },
        { key: 'defaultPrice', label: 'CATALOG.DEFAULT_PRICE', sortable: true, width: '140px' },
        { key: 'isActive',     label: 'COMMON.STATUS',         width: '120px' },
    ];

    readonly medicinesCols: CkColumnDef[] = [
        { key: 'name',             label: 'CATALOG.MEDICINE_NAME',     sortable: true, searchable: true },
        { key: 'defaultDosage',    label: 'CATALOG.DEFAULT_DOSAGE',    sortable: true },
        { key: 'defaultFrequency', label: 'CATALOG.DEFAULT_FREQUENCY', sortable: true },
        { key: 'isActive',         label: 'COMMON.STATUS',             width: '120px' },
    ];

    // ── Built-in actions (hover toolbar) ─────────────────────────────────────
    readonly servicesActions: CkTableAction<ServiceItem>[] = [
        {
            icon:   'edit',
            label:  'COMMON.EDIT',
            inline: true,
            click:  (row) => this.openServiceDialog(row),
        },
        {
            icon:    'visibility_off',
            label:   'CATALOG.STATUS_HIDDEN',
            inline:  true,
            visible: (row) => row.isActive,
            click:   (row) => this.toggleService(row.id),
        },
        {
            icon:    'visibility',
            label:   'CATALOG.STATUS_ACTIVE',
            inline:  true,
            visible: (row) => !row.isActive,
            click:   (row) => this.toggleService(row.id),
        },
    ];

    readonly medicinesActions: CkTableAction<MedicineItem>[] = [
        {
            icon:   'edit',
            label:  'COMMON.EDIT',
            inline: true,
            click:  (row) => this.openMedicineDialog(row),
        },
        {
            icon:    'visibility_off',
            label:   'CATALOG.STATUS_HIDDEN',
            inline:  true,
            visible: (row) => row.isActive,
            click:   (row) => this.toggleMedicine(row.id),
        },
        {
            icon:    'visibility',
            label:   'CATALOG.STATUS_ACTIVE',
            inline:  true,
            visible: (row) => !row.isActive,
            click:   (row) => this.toggleMedicine(row.id),
        },
    ];

    // ── Bilingual display helper ──────────────────────────────────────────────
    displayName(item: ServiceItem | MedicineItem): string {
        return (this.langService.lang() === 'en' && item.nameEn) ? item.nameEn : item.name;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadServices();
        this.loadMedicines();
    }

    // ── Loaders ───────────────────────────────────────────────────────────────
    loadServices(): void {
        this.servicesLoading.set(true);
        this.svc.getAllServices().subscribe({
            next: data => { this.services.set(data); this.servicesLoading.set(false); },
            error: ()   => this.servicesLoading.set(false),
        });
    }

    loadMedicines(): void {
        this.medicinesLoading.set(true);
        this.svc.getAllMedicines().subscribe({
            next: data => { this.medicines.set(data); this.medicinesLoading.set(false); },
            error: ()   => this.medicinesLoading.set(false),
        });
    }

    // ── Dialogs ───────────────────────────────────────────────────────────────
    openServiceDialog(item?: ServiceItem): void {
        const ref = this.dialog.open(ServiceDialogComponent, {
            width:      '480px',
            maxWidth:   '95vw',
            panelClass: 'ck-dialog-panel',
            direction:  this.langService.isRTL() ? 'rtl' : 'ltr',
            data:       { item },
        });
        ref.afterClosed().subscribe(result => {
            if (result) {
                this.toast.success(this.langService.translate(
                    item ? 'CATALOG.UPDATED_SUCCESS' : 'CATALOG.CREATED_SUCCESS'
                ));
                this.loadServices();
            }
        });
    }

    openMedicineDialog(item?: MedicineItem): void {
        const ref = this.dialog.open(MedicineDialogComponent, {
            width:      '480px',
            maxWidth:   '95vw',
            panelClass: 'ck-dialog-panel',
            direction:  this.langService.isRTL() ? 'rtl' : 'ltr',
            data:       { item },
        });
        ref.afterClosed().subscribe(result => {
            if (result) {
                this.toast.success(this.langService.translate(
                    item ? 'CATALOG.UPDATED_SUCCESS' : 'CATALOG.CREATED_SUCCESS'
                ));
                this.loadMedicines();
            }
        });
    }

    // ── Toggle ────────────────────────────────────────────────────────────────
    toggleService(id: string): void {
        this.svc.toggleService(id).subscribe({
            next: () => {
                this.toast.success(this.langService.translate('CATALOG.TOGGLED_SUCCESS'));
                this.loadServices();
            },
        });
    }

    toggleMedicine(id: string): void {
        this.svc.toggleMedicine(id).subscribe({
            next: () => {
                this.toast.success(this.langService.translate('CATALOG.TOGGLED_SUCCESS'));
                this.loadMedicines();
            },
        });
    }
}

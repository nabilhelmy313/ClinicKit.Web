import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ServiceItem, MedicineItem } from '../../../core/models/catalog.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkStatusBadgeComponent,
} from '../../../shared';
import { ServiceDialogComponent } from './service-dialog/service-dialog.component';
import { MedicineDialogComponent } from './medicine-dialog/medicine-dialog.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
  imports: [
    CommonModule, TranslatePipe,
    MatTabsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatProgressSpinnerModule,
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkStatusBadgeComponent,
  ],
})
export class CatalogComponent implements OnInit {
  readonly langService  = inject(LanguageService);
  readonly themeService = inject(ThemeService);
  private readonly svc    = inject(CatalogService);
  private readonly toast  = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  // ── State ─────────────────────────────────────────────────────────────────
  servicesLoading = signal(false);
  services        = signal<ServiceItem[]>([]);
  medicinesLoading = signal(false);
  medicines        = signal<MedicineItem[]>([]);

  // ── Table columns ─────────────────────────────────────────────────────────
  serviceColumns  = ['name', 'category', 'defaultPrice', 'isActive', 'actions'];
  medicineColumns = ['name', 'defaultDosage', 'defaultFrequency', 'isActive', 'actions'];

  // ── Status badge color map ────────────────────────────────────────────────
  readonly statusMap = {
    active:  'success' as const,
    hidden:  'neutral' as const,
  };

  // ── Bilingual display helper ──────────────────────────────────────────────
  displayName(item: ServiceItem | MedicineItem): string {
    return (this.langService.lang() === 'en' && item.nameEn) ? item.nameEn : item.name;
  }

  ngOnInit(): void {
    this.loadServices();
    this.loadMedicines();
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadServices(): void {
    this.servicesLoading.set(true);
    this.svc.getAllServices().subscribe({
      next: data => { this.services.set(data); this.servicesLoading.set(false); },
      error: ()  => this.servicesLoading.set(false),
    });
  }

  loadMedicines(): void {
    this.medicinesLoading.set(true);
    this.svc.getAllMedicines().subscribe({
      next: data => { this.medicines.set(data); this.medicinesLoading.set(false); },
      error: ()  => this.medicinesLoading.set(false),
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

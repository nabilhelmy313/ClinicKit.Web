import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminTenantsService } from '../../../core/services/admin-tenants.service';
import { TenantSummary, UpdateTenantFeaturesRequest } from '../../../core/models/tenant-admin.model';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { CkPageHeaderComponent } from '../../../shared/ck-page-header/ck-page-header.component';

interface FeatureToggle {
  key: keyof UpdateTenantFeaturesRequest;
  label: string;
  icon: string;
  category: 'paid' | 'plan';
}

const FEATURES: FeatureToggle[] = [
  // Paid services
  { key: 'whatsAppEnabled',      label: 'واتساب تلقائي (150 EGP/شهر)',  icon: 'whatsapp',         category: 'paid' },
  { key: 'cloudBackupEnabled',   label: 'Cloud Backup (100 EGP/شهر)',    icon: 'cloud_sync',       category: 'paid' },
  { key: 'onlineBookingEnabled', label: 'حجز أونلاين (v2.0)',             icon: 'calendar_add_on',  category: 'paid' },
  // Plan features
  { key: 'multiDoctorEnabled',   label: 'أكتر من دكتور',                 icon: 'group',            category: 'plan' },
  { key: 'vitalsEnabled',        label: 'Vitals Tracker',                 icon: 'monitor_heart',    category: 'plan' },
  { key: 'reportsEnabled',       label: 'تقارير الإيرادات',               icon: 'bar_chart',        category: 'plan' },
  { key: 'insuranceEnabled',     label: 'شركات التأمين',                  icon: 'health_and_safety', category: 'plan' },
  { key: 'eReceiptEnabled',      label: 'e-Receipt (هيئة الضرائب)',        icon: 'receipt_long',     category: 'plan' },
  { key: 'analyticsEnabled',     label: 'Analytics Dashboard',            icon: 'insights',         category: 'plan' },
];

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    CkPageHeaderComponent,
  ],
  template: `
    <div [dir]="langService.isRTL() ? 'rtl' : 'ltr'"
         [class.component-dark-theme]="themeService.isDark()">

      <ck-page-header title="إدارة العيادات" icon="domain" />

      <!-- Loading -->
      @if (loading()) {
        <div class="d-flex justify-content-center p-5">
          <mat-spinner diameter="48" />
        </div>
      }

      <!-- Tenant cards -->
      @if (!loading()) {
        <div class="tenants-grid">
          @for (tenant of tenants(); track tenant.tenantId) {
            <mat-card class="tenant-card" [class.deleted]="tenant.isDeleted">
              <mat-card-header>
                <mat-icon mat-card-avatar>local_hospital</mat-icon>
                <mat-card-title>{{ tenant.clinicName }}</mat-card-title>
                <mat-card-subtitle>
                  {{ tenant.clinicPhone ?? '—' }}
                  @if (tenant.isDeleted) {
                    <span class="badge-deleted ms-2">محذوف</span>
                  }
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content class="pt-3">

                <!-- Paid services -->
                <p class="feature-group-label">الخدمات المدفوعة</p>
                @for (f of paidFeatures; track f.key) {
                  <div class="feature-row">
                    <div class="feature-label">
                      <mat-icon class="feature-icon">{{ f.icon }}</mat-icon>
                      <span>{{ f.label }}</span>
                    </div>
                    <mat-slide-toggle
                      [checked]="tenant[f.key]"
                      [disabled]="saving()[tenant.tenantId]"
                      (change)="toggle(tenant, f.key, $event.checked)" />
                  </div>
                }

                <!-- Plan features -->
                <p class="feature-group-label mt-3">ميزات الخطة</p>
                @for (f of planFeatures; track f.key) {
                  <div class="feature-row">
                    <div class="feature-label">
                      <mat-icon class="feature-icon">{{ f.icon }}</mat-icon>
                      <span>{{ f.label }}</span>
                    </div>
                    <mat-slide-toggle
                      [checked]="tenant[f.key]"
                      [disabled]="saving()[tenant.tenantId]"
                      (change)="toggle(tenant, f.key, $event.checked)" />
                  </div>
                }

              </mat-card-content>

              @if (saving()[tenant.tenantId]) {
                <div class="saving-overlay">
                  <mat-spinner diameter="24" />
                </div>
              }
            </mat-card>
          }
        </div>

        @if (tenants().length === 0) {
          <div class="empty-state">
            <mat-icon>domain_disabled</mat-icon>
            <p>لا توجد عيادات مسجلة</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .tenants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      padding: 8px 0;
    }
    .tenant-card {
      position: relative;
      &.deleted { opacity: 0.5; }
    }
    .feature-group-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--mat-sys-outline);
      margin: 0 0 8px;
      letter-spacing: 0.5px;
    }
    .feature-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      &:last-child { border-bottom: none; }
    }
    .feature-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .feature-icon { font-size: 18px; width: 18px; height: 18px; color: var(--mat-sys-primary); }
    .badge-deleted {
      font-size: 10px;
      background: #f44336;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .saving-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: inherit;
    }
    .empty-state {
      text-align: center;
      padding: 60px;
      color: var(--mat-sys-outline);
      mat-icon { font-size: 48px; width: 48px; height: 48px; }
    }
  `],
})
export class TenantsComponent implements OnInit {
  readonly themeService   = inject(ThemeService);
  readonly langService    = inject(LanguageService);
  private readonly svc    = inject(AdminTenantsService);
  private readonly toast  = inject(ToastService);

  readonly tenants  = signal<TenantSummary[]>([]);
  readonly loading  = signal(true);
  readonly saving   = signal<Record<string, boolean>>({});

  readonly paidFeatures = FEATURES.filter(f => f.category === 'paid');
  readonly planFeatures = FEATURES.filter(f => f.category === 'plan');

  ngOnInit(): void {
    this.svc.list().subscribe({
      next: (data) => { this.tenants.set(data); this.loading.set(false); },
      error: ()    => { this.loading.set(false); this.toast.error('فشل تحميل العيادات'); },
    });
  }

  toggle(tenant: TenantSummary, key: keyof UpdateTenantFeaturesRequest, value: boolean): void {
    // Optimistic update
    this.tenants.update(list =>
      list.map(t => t.tenantId === tenant.tenantId ? { ...t, [key]: value } : t)
    );

    this.saving.update(s => ({ ...s, [tenant.tenantId]: true }));

    const updated = this.tenants().find(t => t.tenantId === tenant.tenantId)!;
    const payload: UpdateTenantFeaturesRequest = {
      whatsAppEnabled:      updated.whatsAppEnabled,
      cloudBackupEnabled:   updated.cloudBackupEnabled,
      onlineBookingEnabled: updated.onlineBookingEnabled,
      multiDoctorEnabled:   updated.multiDoctorEnabled,
      vitalsEnabled:        updated.vitalsEnabled,
      reportsEnabled:       updated.reportsEnabled,
      insuranceEnabled:     updated.insuranceEnabled,
      eReceiptEnabled:      updated.eReceiptEnabled,
      analyticsEnabled:     updated.analyticsEnabled,
    };

    this.svc.updateFeatures(tenant.tenantId, payload).subscribe({
      next: () => {
        this.saving.update(s => ({ ...s, [tenant.tenantId]: false }));
        this.toast.success(`${tenant.clinicName} — تم التحديث`);
      },
      error: () => {
        // Rollback on error
        this.tenants.update(list =>
          list.map(t => t.tenantId === tenant.tenantId ? { ...t, [key]: !value } : t)
        );
        this.saving.update(s => ({ ...s, [tenant.tenantId]: false }));
        this.toast.error('فشل التحديث');
      },
    });
  }
}

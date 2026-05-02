import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppointmentsFacade } from '../appointments.facade';
import { Appointment, AppointmentStatus, AppointmentQuery } from '../models/appointment.model';

@Component({
  selector: 'ck-appointments-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="ck-page-header">
      <div>
        <h1 class="ck-page-title">المواعيد</h1>
        <p class="ck-page-sub">إدارة جميع مواعيد العيادة</p>
      </div>
      <div class="ck-header-actions">
        <a class="ck-btn-ghost" routerLink="calendar">عرض التقويم</a>
        <a class="ck-btn-primary" routerLink="new">+ حجز موعد</a>
      </div>
    </div>

    <!-- Filters -->
    <div class="ck-filters">
      <div class="ck-filter-row">
        <div class="ck-filter-field">
          <label>من تاريخ</label>
          <input type="date" class="ck-input-sm" [(ngModel)]="fromDate" (change)="applyFilters()" />
        </div>
        <div class="ck-filter-field">
          <label>إلى تاريخ</label>
          <input type="date" class="ck-input-sm" [(ngModel)]="toDate" (change)="applyFilters()" />
        </div>
        <div class="ck-filter-field">
          <label>الحالة</label>
          <select class="ck-input-sm" [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="">الكل</option>
            <option value="0">معلق</option>
            <option value="1">مؤكد</option>
            <option value="2">جاري</option>
            <option value="3">مكتمل</option>
            <option value="4">ملغي</option>
            <option value="5">لم يحضر</option>
          </select>
        </div>
        <button class="ck-btn-reset" (click)="resetFilters()">إعادة تعيين</button>
      </div>
    </div>

    @if (facade.loading()) {
      <div class="ck-loading">جاري التحميل…</div>
    }

    @if (facade.isEmpty()) {
      <div class="ck-empty">
        <p>لا توجد مواعيد تطابق الفلتر المحدد.</p>
      </div>
    }

    @if (!facade.loading() && facade.appointments().length > 0) {
      <div class="ck-card">
        <table class="ck-table">
          <thead>
            <tr>
              <th>المريض</th>
              <th>التليفون</th>
              <th>التاريخ</th>
              <th>الوقت</th>
              <th>النوع</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of facade.appointments(); track a.id) {
              <tr>
                <td class="ck-patient-name">{{ a.patientName }}</td>
                <td>{{ a.patientPhone }}</td>
                <td>{{ a.appointmentDate }}</td>
                <td>{{ formatTime(a.startTime) }} – {{ formatTime(a.endTime) }}</td>
                <td>
                  <span class="ck-type-badge" [class]="'type-' + a.type">{{ typeLabel(a.type) }}</span>
                </td>
                <td>
                  <span class="ck-status-badge" [class]="'status-' + a.status">{{ statusLabel(a.status) }}</span>
                </td>
                <td class="ck-actions">
                  @if (a.status === 0) {
                    <button (click)="confirm(a)" title="تأكيد">✓</button>
                  }
                  @if (a.status === 1) {
                    <button (click)="startVisit(a)" title="بدء الكشف">▶</button>
                  }
                  @if (a.status === 2) {
                    <button (click)="complete(a)" title="إنهاء">✔</button>
                  }
                  @if (canCancel(a.status)) {
                    <button class="cancel-btn" (click)="cancelAppt(a)" title="إلغاء">✕</button>
                  }
                  @if (canEdit(a.status)) {
                    <a [routerLink]="[a.id, 'edit']" title="تعديل">✎</a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="ck-pagination">
        <span>إجمالي: {{ facade.totalCount() }} موعد</span>
        <div class="ck-pages">
          <button [disabled]="facade.page() === 1" (click)="prevPage()">‹</button>
          <span>{{ facade.page() }} / {{ facade.totalPages() }}</span>
          <button [disabled]="facade.page() === facade.totalPages()" (click)="nextPage()">›</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .ck-page-header   { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    .ck-page-title    { font-size:1.6rem; font-weight:700; margin:0 0 4px; }
    .ck-page-sub      { color:#888; margin:0; font-size:.9rem; }
    .ck-header-actions { display:flex; gap:10px; align-items:center; }
    .ck-btn-ghost     { border:1px solid #ddd; background:#fff; border-radius:8px; padding:9px 16px; font-size:.9rem; color:#555; text-decoration:none; white-space:nowrap; }
    .ck-btn-primary   { background:#0D5238; color:#fff; border:none; border-radius:8px; padding:9px 16px; cursor:pointer; font-size:.9rem; text-decoration:none; white-space:nowrap; }
    .ck-filters       { background:#fff; border:1px solid #E5E7EB; border-radius:10px; padding:16px 20px; margin-bottom:20px; }
    .ck-filter-row    { display:flex; gap:16px; align-items:flex-end; flex-wrap:wrap; }
    .ck-filter-field  { display:flex; flex-direction:column; gap:4px; }
    .ck-filter-field label { font-size:.8rem; color:#666; font-weight:500; }
    .ck-input-sm      { padding:7px 10px; border:1px solid #D1D5DB; border-radius:6px; font-size:.85rem; outline:none; }
    .ck-input-sm:focus { border-color:#0D5238; }
    .ck-btn-reset     { border:1px solid #ddd; background:#fff; border-radius:6px; padding:7px 12px; font-size:.85rem; cursor:pointer; color:#555; align-self:flex-end; }
    .ck-loading       { padding:40px; text-align:center; color:#888; }
    .ck-empty         { padding:60px; text-align:center; color:#aaa; }
    .ck-card          { background:#fff; border-radius:12px; border:1px solid #E5E7EB; overflow:hidden; }
    .ck-table         { width:100%; border-collapse:collapse; font-size:.9rem; }
    .ck-table th      { background:#F9FAFB; padding:10px 14px; text-align:right; font-weight:600; border-bottom:1px solid #E5E7EB; }
    .ck-table td      { padding:10px 14px; border-bottom:1px solid #F3F4F6; vertical-align:middle; }
    .ck-table tr:last-child td { border-bottom:none; }
    .ck-patient-name  { font-weight:500; color:#111; }
    .ck-type-badge    { display:inline-block; padding:2px 8px; border-radius:4px; font-size:.78rem; font-weight:500; }
    .type-0           { background:#EFF6FF; color:#1D4ED8; }
    .type-1           { background:#F0FDF4; color:#15803D; }
    .type-2           { background:#FEF2F2; color:#B91C1C; }
    .ck-status-badge  { padding:3px 10px; border-radius:20px; font-size:.78rem; font-weight:500; white-space:nowrap; }
    .status-0         { background:#FEF9C3; color:#854D0E; }
    .status-1         { background:#DBEAFE; color:#1E40AF; }
    .status-2         { background:#E0E7FF; color:#3730A3; }
    .status-3         { background:#DCFCE7; color:#166534; }
    .status-4         { background:#FEE2E2; color:#991B1B; }
    .status-5         { background:#F3F4F6; color:#6B7280; }
    .ck-actions       { display:flex; gap:8px; align-items:center; }
    .ck-actions button, .ck-actions a { border:none; background:none; cursor:pointer; font-size:1rem; color:#0D5238; padding:2px; text-decoration:none; }
    .ck-actions .cancel-btn { color:#DC2626; }
    .ck-pagination    { display:flex; justify-content:space-between; align-items:center; margin-top:16px; font-size:.9rem; color:#555; }
    .ck-pages         { display:flex; align-items:center; gap:10px; }
    .ck-pages button  { border:1px solid #ddd; background:#fff; border-radius:4px; padding:4px 10px; cursor:pointer; }
    .ck-pages button:disabled { opacity:.4; cursor:default; }
  `],
})
export class AppointmentsListComponent implements OnInit {
  readonly facade = inject(AppointmentsFacade);

  fromDate    = '';
  toDate      = '';
  statusFilter = '';

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const q: AppointmentQuery = {
      page: 1,
      fromDate:  this.fromDate  || undefined,
      toDate:    this.toDate    || undefined,
      status:    this.statusFilter !== '' ? +this.statusFilter as AppointmentStatus : undefined,
    };
    this.facade.loadAll(q);
  }

  resetFilters(): void {
    this.fromDate = '';
    this.toDate = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  prevPage(): void {
    this.facade.setPage(this.facade.page() - 1, this.currentQuery());
  }

  nextPage(): void {
    this.facade.setPage(this.facade.page() + 1, this.currentQuery());
  }

  private currentQuery(): AppointmentQuery {
    return {
      fromDate: this.fromDate || undefined,
      toDate:   this.toDate   || undefined,
      status:   this.statusFilter !== '' ? +this.statusFilter as AppointmentStatus : undefined,
    };
  }

  confirm(a: Appointment): void {
    this.facade.updateStatus(a.id, 1);
  }

  startVisit(a: Appointment): void {
    this.facade.updateStatus(a.id, 2);
  }

  complete(a: Appointment): void {
    this.facade.updateStatus(a.id, 3);
  }

  cancelAppt(a: Appointment): void {
    const reason = prompt('سبب الإلغاء (اختياري):') ?? undefined;
    this.facade.cancel(a.id, reason);
  }

  canCancel(status: AppointmentStatus): boolean {
    return status === 0 || status === 1;
  }

  canEdit(status: AppointmentStatus): boolean {
    return status === 0 || status === 1;
  }

  formatTime(t: string): string {
    return t.substring(0, 5);
  }

  typeLabel(t: number): string {
    return ['زيارة أولى', 'متابعة', 'طارئ'][t] ?? '—';
  }

  statusLabel(s: AppointmentStatus): string {
    return ['معلق', 'مؤكد', 'جاري', 'مكتمل', 'ملغي', 'لم يحضر'][s] ?? '—';
  }
}

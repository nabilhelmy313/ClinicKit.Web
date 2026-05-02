import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppointmentsFacade } from '../appointments.facade';
import { Appointment, AppointmentStatus } from '../models/appointment.model';

@Component({
  selector: 'ck-appointments-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="ck-page-header">
      <div>
        <h1 class="ck-page-title">تقويم المواعيد</h1>
        <p class="ck-page-sub">جدول اليوم مرتب بالوقت</p>
      </div>
      <div class="ck-header-actions">
        <a class="ck-btn-ghost" routerLink="/appointments">قائمة المواعيد</a>
        <a class="ck-btn-primary" routerLink="/appointments/new">+ حجز موعد</a>
      </div>
    </div>

    <!-- Date navigation -->
    <div class="ck-date-nav">
      <button class="ck-nav-btn" (click)="changeDay(-1)">‹ السابق</button>
      <div class="ck-date-display">
        <input type="date" class="ck-date-input" [(ngModel)]="selectedDate" (change)="loadDay()" />
        <span class="ck-day-label">{{ dayLabel() }}</span>
      </div>
      <button class="ck-nav-btn" (click)="changeDay(1)">التالي ›</button>
    </div>

    @if (facade.loading()) {
      <div class="ck-loading">جاري التحميل…</div>
    }

    @if (!facade.loading() && facade.daily().length === 0) {
      <div class="ck-empty">
        <div class="ck-empty-icon">📅</div>
        <p>لا توجد مواعيد في هذا اليوم.</p>
        <a class="ck-btn-primary-sm" routerLink="/appointments/new">+ حجز موعد</a>
      </div>
    }

    @if (facade.daily().length > 0) {
      <div class="ck-day-summary">
        <span class="ck-summary-item">
          <strong>{{ facade.daily().length }}</strong> موعد
        </span>
        <span class="ck-summary-item pending">
          <strong>{{ countByStatus(0) }}</strong> معلق
        </span>
        <span class="ck-summary-item confirmed">
          <strong>{{ countByStatus(1) }}</strong> مؤكد
        </span>
        <span class="ck-summary-item completed">
          <strong>{{ countByStatus(3) }}</strong> مكتمل
        </span>
      </div>

      <div class="ck-timeline">
        @for (a of facade.daily(); track a.id) {
          <div class="ck-slot" [class]="'status-bg-' + a.status">
            <div class="ck-slot-time">
              <span class="ck-start">{{ formatTime(a.startTime) }}</span>
              <span class="ck-end">{{ formatTime(a.endTime) }}</span>
            </div>
            <div class="ck-slot-divider" [class]="'divider-' + a.status"></div>
            <div class="ck-slot-body">
              <div class="ck-slot-header">
                <span class="ck-slot-patient">{{ a.patientName }}</span>
                <span class="ck-slot-phone">{{ a.patientPhone }}</span>
              </div>
              <div class="ck-slot-meta">
                <span class="ck-type-badge" [class]="'type-' + a.type">{{ typeLabel(a.type) }}</span>
                <span class="ck-status-badge" [class]="'status-' + a.status">{{ statusLabel(a.status) }}</span>
                @if (a.notes) {
                  <span class="ck-slot-notes">{{ a.notes }}</span>
                }
              </div>
            </div>
            <div class="ck-slot-actions">
              @if (a.status === 0) {
                <button class="ck-action-btn confirm" (click)="confirm(a)" title="تأكيد الموعد">تأكيد</button>
              }
              @if (a.status === 1) {
                <button class="ck-action-btn start" (click)="startVisit(a)" title="بدء الكشف">بدء الكشف</button>
              }
              @if (a.status === 2) {
                <button class="ck-action-btn complete" (click)="complete(a)" title="إنهاء الكشف">إنهاء</button>
              }
              @if (a.status === 0 || a.status === 1) {
                <button class="ck-action-btn cancel" (click)="cancelAppt(a)">إلغاء</button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .ck-page-header    { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    .ck-page-title     { font-size:1.6rem; font-weight:700; margin:0 0 4px; }
    .ck-page-sub       { color:#888; margin:0; font-size:.9rem; }
    .ck-header-actions { display:flex; gap:10px; }
    .ck-btn-ghost      { border:1px solid #ddd; background:#fff; border-radius:8px; padding:9px 16px; font-size:.9rem; color:#555; text-decoration:none; }
    .ck-btn-primary    { background:#0D5238; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:.9rem; text-decoration:none; cursor:pointer; }
    .ck-btn-primary-sm { background:#0D5238; color:#fff; border:none; border-radius:8px; padding:8px 18px; font-size:.9rem; text-decoration:none; cursor:pointer; display:inline-block; }

    /* Date nav */
    .ck-date-nav     { display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid #E5E7EB; border-radius:10px; padding:12px 20px; margin-bottom:20px; }
    .ck-nav-btn      { border:1px solid #ddd; background:#fff; border-radius:6px; padding:6px 14px; cursor:pointer; font-size:.9rem; color:#555; }
    .ck-nav-btn:hover { background:#F9FAFB; }
    .ck-date-display { display:flex; align-items:center; gap:12px; }
    .ck-date-input   { border:1px solid #ddd; border-radius:6px; padding:6px 10px; font-size:.9rem; cursor:pointer; }
    .ck-day-label    { font-weight:600; font-size:1rem; color:#111; }

    /* Summary */
    .ck-day-summary  { display:flex; gap:16px; margin-bottom:16px; }
    .ck-summary-item { background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:10px 16px; font-size:.85rem; color:#555; }
    .ck-summary-item strong { font-size:1.1rem; color:#111; display:block; }
    .ck-summary-item.pending strong   { color:#854D0E; }
    .ck-summary-item.confirmed strong { color:#1E40AF; }
    .ck-summary-item.completed strong { color:#166534; }

    /* Loading / empty */
    .ck-loading    { padding:40px; text-align:center; color:#888; }
    .ck-empty      { padding:60px; text-align:center; color:#aaa; display:flex; flex-direction:column; align-items:center; gap:12px; }
    .ck-empty-icon { font-size:3rem; }
    .ck-empty p    { margin:0; }

    /* Timeline slots */
    .ck-timeline   { display:flex; flex-direction:column; gap:10px; }
    .ck-slot       { display:flex; gap:0; background:#fff; border:1px solid #E5E7EB; border-radius:10px; overflow:hidden; align-items:stretch; }
    .ck-slot-time  { display:flex; flex-direction:column; justify-content:center; align-items:center; padding:12px 16px; min-width:70px; background:#F9FAFB; gap:4px; }
    .ck-start      { font-size:.9rem; font-weight:600; color:#111; }
    .ck-end        { font-size:.75rem; color:#888; }
    .ck-slot-divider { width:4px; flex-shrink:0; }
    .divider-0  { background:#F59E0B; }
    .divider-1  { background:#3B82F6; }
    .divider-2  { background:#6366F1; }
    .divider-3  { background:#10B981; }
    .divider-4  { background:#EF4444; }
    .divider-5  { background:#9CA3AF; }
    .ck-slot-body  { flex:1; padding:12px 16px; display:flex; flex-direction:column; gap:6px; }
    .ck-slot-header { display:flex; align-items:center; gap:12px; }
    .ck-slot-patient { font-weight:600; font-size:.95rem; color:#111; }
    .ck-slot-phone  { font-size:.85rem; color:#888; }
    .ck-slot-meta   { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .ck-slot-notes  { font-size:.8rem; color:#666; }
    .ck-type-badge  { display:inline-block; padding:2px 8px; border-radius:4px; font-size:.78rem; font-weight:500; }
    .type-0         { background:#EFF6FF; color:#1D4ED8; }
    .type-1         { background:#F0FDF4; color:#15803D; }
    .type-2         { background:#FEF2F2; color:#B91C1C; }
    .ck-status-badge { padding:2px 8px; border-radius:20px; font-size:.78rem; font-weight:500; }
    .status-0       { background:#FEF9C3; color:#854D0E; }
    .status-1       { background:#DBEAFE; color:#1E40AF; }
    .status-2       { background:#E0E7FF; color:#3730A3; }
    .status-3       { background:#DCFCE7; color:#166534; }
    .status-4       { background:#FEE2E2; color:#991B1B; }
    .status-5       { background:#F3F4F6; color:#6B7280; }
    .ck-slot-actions { display:flex; flex-direction:column; justify-content:center; gap:6px; padding:12px; border-right:1px solid #F3F4F6; }
    .ck-action-btn  { border:none; border-radius:6px; padding:5px 10px; font-size:.78rem; cursor:pointer; white-space:nowrap; font-weight:500; }
    .ck-action-btn.confirm  { background:#DBEAFE; color:#1E40AF; }
    .ck-action-btn.start    { background:#E0E7FF; color:#3730A3; }
    .ck-action-btn.complete { background:#DCFCE7; color:#166534; }
    .ck-action-btn.cancel   { background:#FEE2E2; color:#991B1B; }
  `],
})
export class AppointmentsCalendarComponent implements OnInit {
  readonly facade = inject(AppointmentsFacade);

  selectedDate = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.loadDay();
  }

  loadDay(): void {
    this.facade.loadDaily(this.selectedDate);
  }

  changeDay(delta: number): void {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + delta);
    this.selectedDate = d.toISOString().slice(0, 10);
    this.loadDay();
  }

  dayLabel(): string {
    const d = new Date(this.selectedDate + 'T00:00:00');
    const today    = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (this.selectedDate === today)    return 'اليوم';
    if (this.selectedDate === tomorrow) return 'غداً';
    return d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  countByStatus(status: AppointmentStatus): number {
    return this.facade.daily().filter(a => a.status === status).length;
  }

  confirm(a: Appointment): void    { this.facade.updateStatus(a.id, 1); }
  startVisit(a: Appointment): void { this.facade.updateStatus(a.id, 2); }
  complete(a: Appointment): void   { this.facade.updateStatus(a.id, 3); }

  cancelAppt(a: Appointment): void {
    const reason = prompt('سبب الإلغاء (اختياري):') ?? undefined;
    this.facade.cancel(a.id, reason);
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

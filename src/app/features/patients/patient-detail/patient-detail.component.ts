import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PatientsFacade } from '../patients.facade';
import { AppointmentsFacade } from '../../appointments/appointments.facade';
import { Appointment, AppointmentStatus } from '../../appointments/models/appointment.model';

@Component({
  selector: 'ck-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ck-page-header">
      <a class="ck-back" routerLink="/patients">← المرضى</a>
    </div>

    @if (pFacade.loading()) {
      <div class="ck-loading">جاري التحميل…</div>
    }

    @if (pFacade.selected(); as p) {
      <!-- Patient profile card -->
      <div class="ck-profile-card">
        <div class="ck-avatar">{{ p.fullName.charAt(0) }}</div>
        <div class="ck-profile-info">
          <h2 class="ck-name">{{ p.fullName }}</h2>
          <div class="ck-meta-row">
            <span class="ck-meta">📞 {{ p.phone }}</span>
            @if (p.dateOfBirth) {
              <span class="ck-meta">🎂 {{ p.dateOfBirth }}</span>
            }
            <span class="ck-badge" [class.male]="p.gender === 0" [class.female]="p.gender === 1">
              {{ p.gender === 0 ? 'ذكر' : 'أنثى' }}
            </span>
          </div>
          @if (p.notes) {
            <p class="ck-notes">{{ p.notes }}</p>
          }
        </div>
        <div class="ck-profile-actions">
          <a class="ck-btn-ghost" [routerLink]="['/patients', p.id, 'edit']">تعديل البيانات</a>
          <a class="ck-btn-primary" [routerLink]="['/appointments', 'new']" [queryParams]="{ patientId: p.id, patientName: p.fullName }">
            + حجز موعد
          </a>
        </div>
      </div>

      <!-- Appointment history -->
      <div class="ck-section">
        <h3 class="ck-section-title">سجل المواعيد</h3>

        @if (aFacade.loading()) {
          <div class="ck-loading-sm">جاري التحميل…</div>
        }

        @if (!aFacade.loading() && aFacade.appointments().length === 0) {
          <div class="ck-empty-sm">لا توجد مواعيد سابقة لهذا المريض.</div>
        }

        @if (aFacade.appointments().length > 0) {
          <div class="ck-appt-list">
            @for (a of aFacade.appointments(); track a.id) {
              <div class="ck-appt-row">
                <div class="ck-appt-date">
                  <span class="ck-date">{{ a.appointmentDate }}</span>
                  <span class="ck-time">{{ formatTime(a.startTime) }} – {{ formatTime(a.endTime) }}</span>
                </div>
                <div class="ck-appt-mid">
                  <span class="ck-type-badge" [class]="'type-' + a.type">{{ typeLabel(a.type) }}</span>
                  @if (a.notes) {
                    <span class="ck-appt-notes">{{ a.notes }}</span>
                  }
                </div>
                <span class="ck-status-badge" [class]="'status-' + a.status">{{ statusLabel(a.status) }}</span>
              </div>
            }
          </div>

          @if (aFacade.totalPages() > 1) {
            <div class="ck-pagination-sm">
              <button [disabled]="aFacade.page() === 1" (click)="prevPage(p.id)">‹</button>
              <span>{{ aFacade.page() }} / {{ aFacade.totalPages() }}</span>
              <button [disabled]="aFacade.page() === aFacade.totalPages()" (click)="nextPage(p.id)">›</button>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    .ck-page-header  { margin-bottom:16px; }
    .ck-back         { color:#0D5238; text-decoration:none; font-size:.9rem; }
    .ck-back:hover   { text-decoration:underline; }
    .ck-loading      { padding:60px; text-align:center; color:#888; }
    .ck-loading-sm   { padding:20px; text-align:center; color:#888; font-size:.9rem; }
    .ck-empty-sm     { padding:24px; text-align:center; color:#aaa; font-size:.9rem; }

    /* Profile card */
    .ck-profile-card { background:#fff; border-radius:12px; border:1px solid #E5E7EB; padding:24px; display:flex; gap:20px; align-items:flex-start; margin-bottom:24px; }
    .ck-avatar       { width:60px; height:60px; border-radius:50%; background:#0D5238; color:#fff; font-size:1.5rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ck-profile-info { flex:1; }
    .ck-name         { font-size:1.3rem; font-weight:700; margin:0 0 8px; }
    .ck-meta-row     { display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-bottom:8px; }
    .ck-meta         { font-size:.9rem; color:#555; }
    .ck-badge        { display:inline-block; padding:2px 10px; border-radius:20px; font-size:.8rem; font-weight:500; }
    .ck-badge.male   { background:#EFF6FF; color:#1D4ED8; }
    .ck-badge.female { background:#FDF2F8; color:#9D174D; }
    .ck-notes        { font-size:.9rem; color:#666; margin:0; }
    .ck-profile-actions { display:flex; flex-direction:column; gap:10px; flex-shrink:0; }
    .ck-btn-ghost    { border:1px solid #ddd; background:#fff; border-radius:8px; padding:8px 16px; cursor:pointer; font-size:.85rem; color:#555; text-decoration:none; text-align:center; white-space:nowrap; }
    .ck-btn-primary  { background:#0D5238; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:.85rem; text-decoration:none; text-align:center; white-space:nowrap; }

    /* Appointment history */
    .ck-section      { background:#fff; border-radius:12px; border:1px solid #E5E7EB; padding:24px; }
    .ck-section-title { font-size:1.1rem; font-weight:600; margin:0 0 16px; color:#111; }
    .ck-appt-list    { display:flex; flex-direction:column; gap:10px; }
    .ck-appt-row     { display:flex; align-items:center; gap:16px; padding:12px 16px; background:#F9FAFB; border-radius:8px; }
    .ck-appt-date    { display:flex; flex-direction:column; gap:2px; min-width:120px; }
    .ck-date         { font-size:.85rem; font-weight:600; color:#111; }
    .ck-time         { font-size:.8rem; color:#888; }
    .ck-appt-mid     { flex:1; display:flex; flex-direction:column; gap:4px; }
    .ck-appt-notes   { font-size:.8rem; color:#666; }
    .ck-type-badge   { display:inline-block; padding:2px 8px; border-radius:4px; font-size:.78rem; font-weight:500; width:fit-content; }
    .type-0          { background:#EFF6FF; color:#1D4ED8; }
    .type-1          { background:#F0FDF4; color:#15803D; }
    .type-2          { background:#FEF2F2; color:#B91C1C; }
    .ck-status-badge { padding:3px 10px; border-radius:20px; font-size:.78rem; font-weight:500; white-space:nowrap; }
    .status-0        { background:#FEF9C3; color:#854D0E; }
    .status-1        { background:#DBEAFE; color:#1E40AF; }
    .status-2        { background:#E0E7FF; color:#3730A3; }
    .status-3        { background:#DCFCE7; color:#166534; }
    .status-4        { background:#FEE2E2; color:#991B1B; }
    .status-5        { background:#F3F4F6; color:#6B7280; }
    .ck-pagination-sm { display:flex; justify-content:center; align-items:center; gap:12px; margin-top:16px; font-size:.85rem; }
    .ck-pagination-sm button { border:1px solid #ddd; background:#fff; border-radius:4px; padding:4px 10px; cursor:pointer; }
    .ck-pagination-sm button:disabled { opacity:.4; cursor:default; }
  `],
})
export class PatientDetailComponent implements OnInit {
  readonly pFacade = inject(PatientsFacade);
  readonly aFacade = inject(AppointmentsFacade);
  private  readonly route  = inject(ActivatedRoute);

  private patientId!: string;

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id')!;
    this.pFacade.loadById(this.patientId);
    this.loadHistory(1);
  }

  private loadHistory(page: number): void {
    this.aFacade.loadAll({ patientId: this.patientId, page, pageSize: 10 });
  }

  prevPage(patientId: string): void {
    this.aFacade.setPage(this.aFacade.page() - 1, { patientId });
  }

  nextPage(patientId: string): void {
    this.aFacade.setPage(this.aFacade.page() + 1, { patientId });
  }

  formatTime(t: string): string {
    return t.substring(0, 5);  // "HH:mm:ss" → "HH:mm"
  }

  typeLabel(t: number): string {
    return ['زيارة أولى', 'متابعة', 'طارئ'][t] ?? '—';
  }

  statusLabel(s: AppointmentStatus): string {
    return ['معلق', 'مؤكد', 'جاري', 'مكتمل', 'ملغي', 'لم يحضر'][s] ?? '—';
  }
}

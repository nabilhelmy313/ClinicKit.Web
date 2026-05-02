import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppointmentsFacade } from '../appointments.facade';
import { PatientsFacade } from '../../patients/patients.facade';
import { CreateAppointmentDto, AppointmentType } from '../models/appointment.model';
import { PatientBrief } from '../../patients/models/patient.model';

@Component({
  selector: 'ck-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="ck-page-header">
      <div>
        <h1 class="ck-page-title">{{ editId ? 'تعديل الموعد' : 'حجز موعد جديد' }}</h1>
        <p class="ck-page-sub">{{ editId ? 'تحديث تفاصيل الموعد' : 'حجز موعد جديد للمريض' }}</p>
      </div>
      <a class="ck-btn-ghost" routerLink="/appointments">← رجوع</a>
    </div>

    <div class="ck-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <!-- Patient search (only for new) -->
        @if (!editId) {
          <div class="ck-field">
            <label class="ck-label">المريض <span class="req">*</span></label>
            @if (selectedPatient) {
              <div class="ck-selected-patient">
                <span>{{ selectedPatient.fullName }} — {{ selectedPatient.phone }}</span>
                <button type="button" class="ck-clear-btn" (click)="clearPatient()">✕</button>
              </div>
            } @else {
              <div class="ck-autocomplete">
                <input
                  class="ck-input"
                  type="text"
                  placeholder="ابحث بالاسم أو التليفون..."
                  [(ngModel)]="patientSearch"
                  [ngModelOptions]="{ standalone: true }"
                  (input)="onPatientSearch($event)"
                />
                @if (pFacade.searchResults().length > 0) {
                  <div class="ck-dropdown">
                    @for (p of pFacade.searchResults(); track p.id) {
                      <div class="ck-dropdown-item" (click)="selectPatient(p)">
                        {{ p.fullName }} — {{ p.phone }}
                      </div>
                    }
                  </div>
                }
              </div>
            }
            @if (!selectedPatient && formSubmitted) {
              <span class="ck-field-err">يجب اختيار مريض</span>
            }
          </div>
        }

        <div class="ck-grid-2">
          <div class="ck-field">
            <label class="ck-label">تاريخ الموعد <span class="req">*</span></label>
            <input class="ck-input" type="date" formControlName="appointmentDate" />
            @if (field('appointmentDate').invalid && field('appointmentDate').touched) {
              <span class="ck-field-err">التاريخ مطلوب</span>
            }
          </div>

          <div class="ck-field">
            <label class="ck-label">نوع الموعد <span class="req">*</span></label>
            <select class="ck-input" formControlName="type">
              <option value="0">زيارة أولى</option>
              <option value="1">متابعة</option>
              <option value="2">طارئ</option>
            </select>
          </div>

          <div class="ck-field">
            <label class="ck-label">وقت البداية <span class="req">*</span></label>
            <input class="ck-input" type="time" formControlName="startTime" />
            @if (field('startTime').invalid && field('startTime').touched) {
              <span class="ck-field-err">وقت البداية مطلوب</span>
            }
          </div>

          <div class="ck-field">
            <label class="ck-label">وقت النهاية <span class="req">*</span></label>
            <input class="ck-input" type="time" formControlName="endTime" />
            @if (field('endTime').invalid && field('endTime').touched) {
              <span class="ck-field-err">وقت النهاية مطلوب</span>
            }
          </div>
        </div>

        <div class="ck-field">
          <label class="ck-label">ملاحظات</label>
          <textarea class="ck-input ck-textarea" formControlName="notes" rows="3" placeholder="أي تفاصيل أو تعليمات للكشف..."></textarea>
        </div>

        <div class="ck-form-actions">
          <a class="ck-btn-ghost" routerLink="/appointments">إلغاء</a>
          <button class="ck-btn-primary" type="submit" [disabled]="facade.saving()">
            @if (facade.saving()) { جاري الحفظ… }
            @else { {{ editId ? 'حفظ التعديلات' : 'تأكيد الحجز' }} }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .ck-page-header  { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    .ck-page-title   { font-size:1.6rem; font-weight:700; margin:0 0 4px; }
    .ck-page-sub     { color:#888; margin:0; font-size:.9rem; }
    .ck-btn-ghost    { border:1px solid #ddd; background:#fff; border-radius:8px; padding:8px 16px; font-size:.9rem; color:#555; text-decoration:none; display:inline-block; cursor:pointer; }
    .ck-card         { background:#fff; border-radius:12px; border:1px solid #E5E7EB; padding:28px; }
    .ck-grid-2       { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .ck-field        { display:flex; flex-direction:column; gap:6px; margin-bottom:20px; }
    .ck-label        { font-size:.9rem; font-weight:500; color:#374151; }
    .req             { color:#DC2626; }
    .ck-input        { padding:9px 12px; border:1px solid #D1D5DB; border-radius:8px; font-size:.9rem; outline:none; font-family:inherit; }
    .ck-input:focus  { border-color:#0D5238; box-shadow:0 0 0 3px rgba(13,82,56,.1); }
    .ck-textarea     { resize:vertical; }
    .ck-field-err    { color:#DC2626; font-size:.8rem; }
    .ck-autocomplete { position:relative; }
    .ck-dropdown     { position:absolute; top:100%; right:0; left:0; background:#fff; border:1px solid #ddd; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,.1); z-index:100; max-height:200px; overflow-y:auto; }
    .ck-dropdown-item { padding:10px 14px; cursor:pointer; font-size:.9rem; border-bottom:1px solid #F3F4F6; }
    .ck-dropdown-item:hover { background:#F9FAFB; }
    .ck-dropdown-item:last-child { border-bottom:none; }
    .ck-selected-patient { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid #0D5238; border-radius:8px; background:#F0FDF4; font-size:.9rem; }
    .ck-clear-btn    { background:none; border:none; cursor:pointer; color:#666; font-size:1rem; }
    .ck-form-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:8px; padding-top:20px; border-top:1px solid #F3F4F6; }
    .ck-btn-primary  { background:#0D5238; color:#fff; border:none; border-radius:8px; padding:10px 24px; cursor:pointer; font-size:.9rem; }
    .ck-btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    @media (max-width:640px) { .ck-grid-2 { grid-template-columns:1fr; } }
  `],
})
export class AppointmentFormComponent implements OnInit {
  readonly facade   = inject(AppointmentsFacade);
  readonly pFacade  = inject(PatientsFacade);
  private  readonly fb     = inject(FormBuilder);
  private  readonly route  = inject(ActivatedRoute);
  private  readonly router = inject(Router);

  editId:          string | null = null;
  selectedPatient: PatientBrief | null = null;
  patientSearch    = '';
  formSubmitted    = false;

  form = this.fb.group({
    appointmentDate: ['', Validators.required],
    startTime:       ['', Validators.required],
    endTime:         ['', Validators.required],
    type:            ['0', Validators.required],
    notes:           ['' as string | null],
  });

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');

    // Pre-fill patient from query param (coming from patient detail page)
    const qp = this.route.snapshot.queryParamMap;
    const patientId   = qp.get('patientId');
    const patientName = qp.get('patientName');
    const phone       = qp.get('patientPhone') ?? '';
    if (patientId && patientName) {
      this.selectedPatient = { id: patientId, fullName: patientName, phone };
    }

    if (this.editId) {
      this.facade.loadById(this.editId);
      const interval = setInterval(() => {
        const a = this.facade.selected();
        if (a && a.id === this.editId) {
          this.form.patchValue({
            appointmentDate: a.appointmentDate,
            startTime:       a.startTime.substring(0, 5),
            endTime:         a.endTime.substring(0, 5),
            type:            String(a.type),
            notes:           a.notes,
          });
          clearInterval(interval);
        }
      }, 100);
    }
  }

  field(name: string) {
    return this.form.get(name)!;
  }

  onPatientSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.pFacade.searchPatients(term);
  }

  selectPatient(p: PatientBrief): void {
    this.selectedPatient = p;
    this.patientSearch   = '';
    this.pFacade.clearSearchResults();
  }

  clearPatient(): void {
    this.selectedPatient = null;
    this.patientSearch   = '';
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.form.invalid || (!this.editId && !this.selectedPatient)) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const startTime = v.startTime! + ':00';   // "HH:mm" → "HH:mm:ss"
    const endTime   = v.endTime!   + ':00';

    if (this.editId) {
      this.facade.update(this.editId, {
        appointmentDate: v.appointmentDate!,
        startTime,
        endTime,
        type:  +v.type! as AppointmentType,
        notes: v.notes || undefined,
      }, () => this.router.navigate(['/appointments']));
    } else {
      const dto: CreateAppointmentDto = {
        patientId:       this.selectedPatient!.id,
        appointmentDate: v.appointmentDate!,
        startTime,
        endTime,
        type:  +v.type! as AppointmentType,
        notes: v.notes || undefined,
      };
      this.facade.create(dto, () => this.router.navigate(['/appointments']));
    }
  }
}

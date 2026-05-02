import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PatientsFacade } from '../patients.facade';
import { CreatePatientDto, Gender } from '../models/patient.model';

@Component({
  selector: 'ck-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="ck-page-header">
      <div>
        <h1 class="ck-page-title">{{ editId ? 'تعديل بيانات المريض' : 'إضافة مريض جديد' }}</h1>
        <p class="ck-page-sub">{{ editId ? 'تحديث معلومات المريض في النظام' : 'تسجيل مريض جديد في العيادة' }}</p>
      </div>
      <a class="ck-btn-ghost" routerLink="/patients">← رجوع</a>
    </div>

    @if (facade.loading()) {
      <div class="ck-loading">جاري تحميل البيانات…</div>
    }

    <div class="ck-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="ck-grid-2">
          <div class="ck-field">
            <label class="ck-label">الاسم الأول <span class="req">*</span></label>
            <input class="ck-input" formControlName="firstName" placeholder="مثال: محمد" />
            @if (field('firstName').invalid && field('firstName').touched) {
              <span class="ck-field-err">الاسم الأول مطلوب</span>
            }
          </div>

          <div class="ck-field">
            <label class="ck-label">اسم العائلة <span class="req">*</span></label>
            <input class="ck-input" formControlName="lastName" placeholder="مثال: أحمد" />
            @if (field('lastName').invalid && field('lastName').touched) {
              <span class="ck-field-err">اسم العائلة مطلوب</span>
            }
          </div>

          <div class="ck-field">
            <label class="ck-label">رقم التليفون <span class="req">*</span></label>
            <input class="ck-input" formControlName="phone" placeholder="01xxxxxxxxx" dir="ltr" />
            @if (field('phone').invalid && field('phone').touched) {
              <span class="ck-field-err">رقم تليفون مصري صحيح مطلوب (01x xxxxxxxx)</span>
            }
          </div>

          <div class="ck-field">
            <label class="ck-label">تاريخ الميلاد</label>
            <input class="ck-input" type="date" formControlName="dateOfBirth" />
          </div>
        </div>

        <div class="ck-field ck-field-inline">
          <label class="ck-label">النوع <span class="req">*</span></label>
          <div class="ck-radio-group">
            <label class="ck-radio">
              <input type="radio" formControlName="gender" [value]="0" />
              ذكر
            </label>
            <label class="ck-radio">
              <input type="radio" formControlName="gender" [value]="1" />
              أنثى
            </label>
          </div>
        </div>

        <div class="ck-field">
          <label class="ck-label">ملاحظات</label>
          <textarea class="ck-input ck-textarea" formControlName="notes" rows="3" placeholder="أي ملاحظات طبية أو شخصية..."></textarea>
        </div>

        <div class="ck-form-actions">
          <a class="ck-btn-ghost" routerLink="/patients">إلغاء</a>
          <button class="ck-btn-primary" type="submit" [disabled]="facade.saving()">
            @if (facade.saving()) { جاري الحفظ… }
            @else { {{ editId ? 'حفظ التعديلات' : 'إضافة المريض' }} }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .ck-page-header  { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    .ck-page-title   { font-size:1.6rem; font-weight:700; margin:0 0 4px; }
    .ck-page-sub     { color:#888; margin:0; font-size:.9rem; }
    .ck-btn-ghost    { border:1px solid #ddd; background:#fff; border-radius:8px; padding:8px 16px; cursor:pointer; font-size:.9rem; color:#555; text-decoration:none; display:inline-block; }
    .ck-loading      { padding:40px; text-align:center; color:#888; }
    .ck-card         { background:#fff; border-radius:12px; border:1px solid #E5E7EB; padding:28px; }
    .ck-grid-2       { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
    .ck-field        { display:flex; flex-direction:column; gap:6px; margin-bottom:20px; }
    .ck-field-inline { flex-direction:row; align-items:center; gap:20px; }
    .ck-label        { font-size:.9rem; font-weight:500; color:#374151; }
    .req             { color:#DC2626; }
    .ck-input        { padding:9px 12px; border:1px solid #D1D5DB; border-radius:8px; font-size:.9rem; outline:none; font-family:inherit; }
    .ck-input:focus  { border-color:#0D5238; box-shadow:0 0 0 3px rgba(13,82,56,.1); }
    .ck-textarea     { resize:vertical; }
    .ck-field-err    { color:#DC2626; font-size:.8rem; }
    .ck-radio-group  { display:flex; gap:24px; }
    .ck-radio        { display:flex; align-items:center; gap:6px; font-size:.9rem; cursor:pointer; }
    .ck-form-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:8px; padding-top:20px; border-top:1px solid #F3F4F6; }
    .ck-btn-primary  { background:#0D5238; color:#fff; border:none; border-radius:8px; padding:10px 24px; cursor:pointer; font-size:.9rem; }
    .ck-btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    @media (max-width:640px) { .ck-grid-2 { grid-template-columns:1fr; } }
  `],
})
export class PatientFormComponent implements OnInit {
  readonly facade = inject(PatientsFacade);
  private  readonly fb     = inject(FormBuilder);
  private  readonly route  = inject(ActivatedRoute);
  private  readonly router = inject(Router);

  editId: string | null = null;

  form = this.fb.group({
    firstName:   ['', Validators.required],
    lastName:    ['', Validators.required],
    phone:       ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]],
    dateOfBirth: ['' as string | null],
    gender:      [0 as Gender, Validators.required],
    notes:       ['' as string | null],
  });

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.facade.loadById(this.editId);
      // Patch form once patient loads
      const sub = this.facade.selected;
      const interval = setInterval(() => {
        const p = sub();
        if (p && p.id === this.editId) {
          this.form.patchValue({
            firstName:   p.firstName,
            lastName:    p.lastName,
            phone:       p.phone,
            dateOfBirth: p.dateOfBirth,
            gender:      p.gender,
            notes:       p.notes,
          });
          clearInterval(interval);
        }
      }, 100);
    }
  }

  field(name: string) {
    return this.form.get(name)!;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const dto: CreatePatientDto = {
      firstName:   v.firstName!,
      lastName:    v.lastName!,
      phone:       v.phone!,
      dateOfBirth: v.dateOfBirth || null,
      gender:      v.gender as Gender,
      notes:       v.notes || undefined,
    };

    if (this.editId) {
      this.facade.update(this.editId, dto, () => {
        this.router.navigate(['/patients', this.editId]);
      });
    } else {
      this.facade.create(dto, (p) => {
        this.router.navigate(['/patients', p.id]);
      });
    }
  }
}

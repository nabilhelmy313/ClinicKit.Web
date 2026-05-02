import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }          from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
    FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl,
} from '@angular/forms';
import { MatFormFieldModule }    from '@angular/material/form-field';
import { MatInputModule }        from '@angular/material/input';
import { MatSelectModule }       from '@angular/material/select';
import { MatButtonModule }       from '@angular/material/button';
import { MatDatepickerModule }   from '@angular/material/datepicker';
import { MatNativeDateModule }   from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PatientsService } from '../../../core/services/patients.service';
import { ToastService }    from '../../../core/services/toast.service';
import { Gender }          from '../../../core/models/patient.model';

/** Egyptian mobile regex — 01[0125]XXXXXXXX (with optional +20 / 0 prefix). */
const EG_PHONE = /^(\+?20|0)?1[0125]\d{8}$/;

@Component({
    selector: 'app-patient-form',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
        MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
    ],
    template: `
        <!-- Page header -->
        <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
            <h5 class="mb-0">
                <i class="material-symbols-outlined me-2 align-middle">person_add</i>
                {{ isEdit ? 'تعديل بيانات المريض' : 'تسجيل مريض جديد' }}
            </h5>
            <button class="default-btn outline-btn" (click)="cancel()">
                <i class="material-symbols-outlined me-1">arrow_forward</i>
                رجوع
            </button>
        </div>

        <div class="card-box mb-25">
            @if (isEdit && !formReady()) {
                <div class="d-flex align-items-center justify-content-center py-40">
                    <mat-spinner diameter="40"></mat-spinner>
                </div>
            } @else {
                <form [formGroup]="form" (ngSubmit)="onSubmit()">
                    <div class="row">
                        <!-- First name -->
                        <div class="col-md-6 mb-20">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>الاسم الأول</mat-label>
                                <input matInput formControlName="firstName" />
                                @if (f['firstName'].invalid && f['firstName'].touched) {
                                    <mat-error>الاسم الأول مطلوب</mat-error>
                                }
                            </mat-form-field>
                        </div>

                        <!-- Last name -->
                        <div class="col-md-6 mb-20">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>الاسم الأخير</mat-label>
                                <input matInput formControlName="lastName" />
                                @if (f['lastName'].invalid && f['lastName'].touched) {
                                    <mat-error>الاسم الأخير مطلوب</mat-error>
                                }
                            </mat-form-field>
                        </div>

                        <!-- Phone -->
                        <div class="col-md-6 mb-20">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>رقم التليفون</mat-label>
                                <input matInput formControlName="phone" dir="ltr"
                                       placeholder="01XXXXXXXXX" />
                                @if (f['phone'].hasError('required') && f['phone'].touched) {
                                    <mat-error>رقم التليفون مطلوب</mat-error>
                                } @else if (f['phone'].hasError('pattern') && f['phone'].touched) {
                                    <mat-error>رقم غير صحيح — يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015</mat-error>
                                }
                            </mat-form-field>
                        </div>

                        <!-- Gender -->
                        <div class="col-md-6 mb-20">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>النوع</mat-label>
                                <mat-select formControlName="gender">
                                    <mat-option [value]="Gender.Male">ذكر</mat-option>
                                    <mat-option [value]="Gender.Female">أنثى</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>

                        <!-- Date of birth -->
                        <div class="col-md-6 mb-20">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>تاريخ الميلاد (اختياري)</mat-label>
                                <input matInput [matDatepicker]="dobPicker"
                                       formControlName="dateOfBirth" />
                                <mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle>
                                <mat-datepicker #dobPicker></mat-datepicker>
                            </mat-form-field>
                        </div>

                        <!-- Notes -->
                        <div class="col-12 mb-20">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>ملاحظات (اختياري)</mat-label>
                                <textarea matInput formControlName="notes" rows="3"></textarea>
                            </mat-form-field>
                        </div>
                    </div>

                    <!-- Submit -->
                    <div class="d-flex gap-10 justify-content-end">
                        <button type="button" class="default-btn outline-btn" (click)="cancel()">
                            إلغاء
                        </button>
                        <button type="submit" class="default-btn" [disabled]="submitting()">
                            @if (submitting()) {
                                <mat-spinner diameter="18" class="d-inline-block me-1"></mat-spinner>
                            }
                            {{ isEdit ? 'حفظ التعديلات' : 'تسجيل المريض' }}
                        </button>
                    </div>
                </form>
            }
        </div>
    `,
})
export class PatientFormComponent implements OnInit {
    private readonly fb    = inject(FormBuilder);
    private readonly svc   = inject(PatientsService);
    private readonly toast = inject(ToastService);
    readonly         router = inject(Router);
    private readonly route  = inject(ActivatedRoute);

    protected readonly Gender = Gender;

    form!: FormGroup;
    isEdit    = false;
    patientId = '';
    formReady  = signal(false);
    submitting = signal(false);

    get f(): Record<string, AbstractControl> { return this.form.controls; }

    ngOnInit(): void {
        this.form = this.fb.group({
            firstName:   ['', [Validators.required, Validators.maxLength(100)]],
            lastName:    ['', [Validators.required, Validators.maxLength(100)]],
            phone:       ['', [Validators.required, Validators.pattern(EG_PHONE)]],
            gender:      [Gender.Male, Validators.required],
            dateOfBirth: [null],
            notes:       [null],
        });

        this.patientId = this.route.snapshot.paramMap.get('id') ?? '';

        // Edit mode when we have an ID (route is /patients/:id/edit)
        if (this.patientId) {
            this.isEdit = true;
            this.loadPatient();
        } else {
            this.formReady.set(true);
        }
    }

    private loadPatient(): void {
        this.svc.getById(this.patientId).subscribe({
            next: p => {
                this.form.patchValue({
                    firstName:   p.firstName,
                    lastName:    p.lastName,
                    phone:       p.phone,
                    gender:      p.gender,
                    dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
                    notes:       p.notes,
                });
                this.formReady.set(true);
            },
            error: () => {
                this.toast.error('تعذّر تحميل بيانات المريض');
                this.router.navigate(['/patients']);
            },
        });
    }

    onSubmit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.submitting.set(true);

        const raw = this.form.value;
        const body = {
            firstName:   raw.firstName,
            lastName:    raw.lastName,
            phone:       raw.phone,
            gender:      raw.gender,
            dateOfBirth: raw.dateOfBirth
                ? (raw.dateOfBirth as Date).toISOString().split('T')[0]
                : null,
            notes: raw.notes || null,
        };

        const req$ = this.isEdit
            ? this.svc.update(this.patientId, body)
            : this.svc.create(body);

        req$.subscribe({
            next: patient => {
                this.submitting.set(false);
                this.toast.success(this.isEdit ? 'تم تعديل بيانات المريض' : 'تم تسجيل المريض بنجاح');
                this.router.navigate(['/patients', patient.id]);
            },
            error: () => this.submitting.set(false),
        });
    }

    cancel(): void {
        this.router.navigate([this.isEdit ? `/patients/${this.patientId}` : '/patients']);
    }
}

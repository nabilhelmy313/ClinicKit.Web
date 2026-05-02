import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }          from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
    FormBuilder, FormGroup, ReactiveFormsModule,
    Validators, AbstractControl,
} from '@angular/forms';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatSelectModule }        from '@angular/material/select';
import { MatButtonModule }        from '@angular/material/button';
import { MatDatepickerModule }    from '@angular/material/datepicker';
import { MatNativeDateModule }    from '@angular/material/core';
import { MatAutocompleteModule }  from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { AppointmentsService } from '../../../core/services/appointments.service';
import { PatientsService }     from '../../../core/services/patients.service';
import { ToastService }        from '../../../core/services/toast.service';
import { PatientBrief }        from '../../../core/models/patient.model';
import { AppointmentType }     from '../../../core/models/appointment.model';

@Component({
    selector: 'app-appointment-form',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
        MatDatepickerModule, MatNativeDateModule,
        MatAutocompleteModule, MatProgressSpinnerModule,
    ],
    template: `
        <!-- Page header -->
        <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
            <h5 class="mb-0">
                <i class="material-symbols-outlined me-2 align-middle">event_add</i>
                حجز موعد جديد
            </h5>
            <button class="default-btn outline-btn" (click)="cancel()">
                <i class="material-symbols-outlined me-1">arrow_forward</i>
                رجوع
            </button>
        </div>

        <div class="card-box mb-25">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div class="row">

                    <!-- Patient search -->
                    <div class="col-12 mb-20">
                        <mat-form-field appearance="outline" class="w-100">
                            <mat-label>المريض</mat-label>
                            <input matInput
                                   [formControl]="patientSearch"
                                   [matAutocomplete]="auto"
                                   placeholder="اكتب اسم المريض أو تليفونه للبحث…" />
                            <mat-autocomplete #auto="matAutocomplete"
                                              [displayWith]="displayPatient"
                                              (optionSelected)="onPatientSelected($event.option.value)">
                                @for (opt of patientOptions(); track opt.id) {
                                    <mat-option [value]="opt">
                                        {{ opt.fullName }}
                                        <span class="text-body ms-5" dir="ltr" style="font-size:12px">
                                            {{ opt.phone }}
                                        </span>
                                    </mat-option>
                                }
                            </mat-autocomplete>
                            @if (form.get('patientId')?.invalid && form.get('patientId')?.touched) {
                                <mat-error>يجب اختيار مريض</mat-error>
                            }
                        </mat-form-field>
                    </div>

                    <!-- Appointment date -->
                    <div class="col-md-4 mb-20">
                        <mat-form-field appearance="outline" class="w-100">
                            <mat-label>التاريخ</mat-label>
                            <input matInput [matDatepicker]="datePicker"
                                   formControlName="appointmentDate"
                                   [min]="today" />
                            <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                            <mat-datepicker #datePicker></mat-datepicker>
                            @if (f['appointmentDate'].invalid && f['appointmentDate'].touched) {
                                <mat-error>التاريخ مطلوب</mat-error>
                            }
                        </mat-form-field>
                    </div>

                    <!-- Start time -->
                    <div class="col-md-4 mb-20">
                        <mat-form-field appearance="outline" class="w-100">
                            <mat-label>وقت البدء</mat-label>
                            <input matInput type="time" formControlName="startTime" />
                            @if (f['startTime'].invalid && f['startTime'].touched) {
                                <mat-error>وقت البدء مطلوب</mat-error>
                            }
                        </mat-form-field>
                    </div>

                    <!-- End time -->
                    <div class="col-md-4 mb-20">
                        <mat-form-field appearance="outline" class="w-100">
                            <mat-label>وقت الانتهاء</mat-label>
                            <input matInput type="time" formControlName="endTime" />
                            @if (f['endTime'].invalid && f['endTime'].touched) {
                                <mat-error>وقت الانتهاء مطلوب</mat-error>
                            }
                        </mat-form-field>
                    </div>

                    <!-- Type -->
                    <div class="col-md-6 mb-20">
                        <mat-form-field appearance="outline" class="w-100">
                            <mat-label>نوع الزيارة</mat-label>
                            <mat-select formControlName="type">
                                <mat-option [value]="AppointmentType.FirstVisit">زيارة أولى</mat-option>
                                <mat-option [value]="AppointmentType.FollowUp">متابعة</mat-option>
                                <mat-option [value]="AppointmentType.Emergency">طارئ</mat-option>
                            </mat-select>
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
                        تأكيد الحجز
                    </button>
                </div>
            </form>
        </div>
    `,
})
export class AppointmentFormComponent implements OnInit {
    private readonly fb       = inject(FormBuilder);
    private readonly svc      = inject(AppointmentsService);
    private readonly patSvc   = inject(PatientsService);
    private readonly toast    = inject(ToastService);
    readonly         router   = inject(Router);
    private readonly route    = inject(ActivatedRoute);

    protected readonly AppointmentType = AppointmentType;

    form!: FormGroup;
    patientSearch  = new FormControl('');
    patientOptions = signal<PatientBrief[]>([]);
    submitting     = signal(false);
    today          = new Date();

    get f(): Record<string, AbstractControl> { return this.form.controls; }

    ngOnInit(): void {
        this.form = this.fb.group({
            patientId:       ['', Validators.required],
            appointmentDate: [null, Validators.required],
            startTime:       ['', Validators.required],
            endTime:         ['', Validators.required],
            type:            [AppointmentType.FirstVisit, Validators.required],
            notes:           [null],
        });

        // Pre-fill patient if navigated from patient-detail
        const prefilledId = this.route.snapshot.queryParamMap.get('patientId');
        if (prefilledId) {
            this.form.patchValue({ patientId: prefilledId });
            this.patSvc.search(prefilledId).subscribe(res => {
                if (res.length > 0) {
                    const p = res[0];
                    this.patientSearch.setValue(p.fullName, { emitEvent: false });
                }
            });
        }

        // Autocomplete search
        this.patientSearch.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
        ).subscribe(term => {
            if (term && term.length >= 2) {
                this.patSvc.search(term).subscribe(res => this.patientOptions.set(res));
            } else {
                this.patientOptions.set([]);
            }
        });
    }

    displayPatient(p: PatientBrief | string | null): string {
        if (!p) return '';
        return typeof p === 'string' ? p : p.fullName;
    }

    onPatientSelected(p: PatientBrief): void {
        this.form.patchValue({ patientId: p.id });
    }

    onSubmit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.submitting.set(true);

        const raw = this.form.value;
        const body = {
            patientId:       raw.patientId,
            appointmentDate: (raw.appointmentDate as Date).toISOString().split('T')[0],
            startTime:       raw.startTime + ':00',   // HH:mm → HH:mm:ss
            endTime:         raw.endTime   + ':00',
            type:            raw.type,
            notes:           raw.notes || null,
        };

        this.svc.create(body).subscribe({
            next: appointment => {
                this.submitting.set(false);
                this.toast.success('تم حجز الموعد بنجاح');
                this.router.navigate(['/appointments']);
            },
            error: () => this.submitting.set(false),
        });
    }

    cancel(): void {
        this.router.navigate(['/appointments']);
    }
}

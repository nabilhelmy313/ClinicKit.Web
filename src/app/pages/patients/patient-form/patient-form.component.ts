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
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import { CkPageHeaderComponent, CkCardComponent, CkFormActionsComponent } from '../../../shared/index';

const EG_PHONE = /^(\+?20|0)?1[0125]\d{8}$/;

@Component({
    selector: 'app-patient-form',
    standalone: true,
    templateUrl: './patient-form.component.html',
    styleUrl:    './patient-form.component.scss',
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
        MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkFormActionsComponent,
    ],
})
export class PatientFormComponent implements OnInit {
    private readonly fb    = inject(FormBuilder);
    private readonly svc   = inject(PatientsService);
    private readonly toast = inject(ToastService);
    readonly         router = inject(Router);
    private readonly route  = inject(ActivatedRoute);
    readonly langService    = inject(LanguageService);
    readonly themeService   = inject(ThemeService);

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

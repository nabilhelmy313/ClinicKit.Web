import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }          from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
    FormBuilder, FormGroup, ReactiveFormsModule,
    Validators, AbstractControl,
    FormControl,
} from '@angular/forms';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatSelectModule }        from '@angular/material/select';
import { MatButtonModule }        from '@angular/material/button';
import { MatDatepickerModule }    from '@angular/material/datepicker';
import { MatNativeDateModule }    from '@angular/material/core';
import { MatAutocompleteModule }  from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule }          from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { AppointmentsService } from '../../../core/services/appointments.service';
import { PatientsService }     from '../../../core/services/patients.service';
import { ToastService }        from '../../../core/services/toast.service';
import { PatientBrief }        from '../../../core/models/patient.model';
import { AppointmentType }     from '../../../core/models/appointment.model';
import { TranslatePipe }       from '../../../core/pipes/translate.pipe';
import { LanguageService }     from '../../../core/services/language.service';
import { ThemeService }        from '../../../core/services/theme.service';
import { CkPageHeaderComponent, CkCardComponent, CkFormActionsComponent } from '../../../shared/index';

@Component({
    selector: 'app-appointment-form',
    standalone: true,
    templateUrl: './appointment-form.component.html',
    styleUrl:    './appointment-form.component.scss',
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
        MatDatepickerModule, MatNativeDateModule,
        MatAutocompleteModule, MatProgressSpinnerModule, MatIconModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkFormActionsComponent,
    ],
})
export class AppointmentFormComponent implements OnInit {
    private readonly fb       = inject(FormBuilder);
    private readonly svc      = inject(AppointmentsService);
    private readonly patSvc   = inject(PatientsService);
    private readonly toast    = inject(ToastService);
    readonly         router   = inject(Router);
    private readonly route    = inject(ActivatedRoute);
    readonly langService      = inject(LanguageService);
    readonly themeService     = inject(ThemeService);

    protected readonly AppointmentType = AppointmentType;

    form!: FormGroup;
    patientSearch   = new FormControl('');
    patientOptions  = signal<PatientBrief[]>([]);
    submitting      = signal(false);
    formReady       = signal(false);
    today           = new Date();

    isEdit        = false;
    appointmentId = '';

    /** Set when navigating from a patient profile — locks the patient field. */
    lockedPatient = signal<PatientBrief | null>(null);

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

        this.appointmentId = this.route.snapshot.paramMap.get('id') ?? '';

        if (this.appointmentId) {
            // Edit mode — route is /appointments/:id/edit
            this.isEdit = true;
            this.loadAppointment();
        } else {
            // Create mode — handle optional query params
            const prefilledDate = this.route.snapshot.queryParamMap.get('date');
            if (prefilledDate) {
                const [y, m, d] = prefilledDate.split('-').map(Number);
                this.form.patchValue({ appointmentDate: new Date(y, m - 1, d) });
            }

            const prefilledId = this.route.snapshot.queryParamMap.get('patientId');
            if (prefilledId) {
                this.form.patchValue({ patientId: prefilledId });
                this.patSvc.getById(prefilledId).subscribe({
                    next: p => {
                        const brief: PatientBrief = { id: p.id, fullName: p.fullName, phone: p.phone };
                        this.lockedPatient.set(brief);
                        this.patientSearch.setValue(p.fullName, { emitEvent: false });
                        this.patientSearch.disable();
                    },
                    error: () => {
                        this.form.patchValue({ patientId: null });
                    },
                });
            }
            this.formReady.set(true);
        }

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

    private loadAppointment(): void {
        this.svc.getById(this.appointmentId).subscribe({
            next: a => {
                // Lock the patient — rescheduling doesn't change the patient
                const brief: PatientBrief = { id: a.patientId, fullName: a.patientName, phone: a.patientPhone };
                this.lockedPatient.set(brief);
                this.patientSearch.setValue(a.patientName, { emitEvent: false });
                this.patientSearch.disable();
                this.form.patchValue({ patientId: a.patientId });

                // Parse date string "YYYY-MM-DD" as local date
                const [y, m, d] = a.appointmentDate.split('-').map(Number);
                this.form.patchValue({
                    appointmentDate: new Date(y, m - 1, d),
                    startTime: a.startTime.substring(0, 5),
                    endTime:   a.endTime.substring(0, 5),
                    type:      a.type,
                    notes:     a.notes,
                });
                this.formReady.set(true);
            },
            error: () => {
                this.toast.error(this.langService.translate('ERRORS.NOT_FOUND'));
                this.router.navigate(['/appointments']);
            },
        });
    }

    displayPatient(p: PatientBrief | string | null): string {
        if (!p) return '';
        return typeof p === 'string' ? p : p.fullName;
    }

    onPatientSelected(p: PatientBrief): void {
        this.form.patchValue({ patientId: p.id });
    }

    /** Unlock the patient field so the user can pick a different patient (create mode only). */
    unlockPatient(): void {
        this.lockedPatient.set(null);
        this.patientSearch.setValue('', { emitEvent: false });
        this.patientSearch.enable();
        this.form.patchValue({ patientId: null });
        this.patientOptions.set([]);
    }

    onSubmit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.submitting.set(true);

        const raw = this.form.value;
        const dateStr = (raw.appointmentDate as Date).toISOString().split('T')[0];

        if (this.isEdit) {
            const body = {
                appointmentDate: dateStr,
                startTime:       raw.startTime + ':00',
                endTime:         raw.endTime   + ':00',
                type:            raw.type,
                notes:           raw.notes || null,
            };
            this.svc.update(this.appointmentId, body).subscribe({
                next: () => {
                    this.submitting.set(false);
                    this.toast.success(this.langService.translate('APPOINTMENTS.RESCHEDULE_SUCCESS'));
                    this.router.navigate(['/appointments', this.appointmentId]);
                },
                error: () => this.submitting.set(false),
            });
        } else {
            const body = {
                patientId:       raw.patientId,
                appointmentDate: dateStr,
                startTime:       raw.startTime + ':00',
                endTime:         raw.endTime   + ':00',
                type:            raw.type,
                notes:           raw.notes || null,
            };
            this.svc.create(body).subscribe({
                next: () => {
                    this.submitting.set(false);
                    this.toast.success(this.langService.translate('APPOINTMENTS.BOOKED_SUCCESS'));
                    this.navigateBack();
                },
                error: () => this.submitting.set(false),
            });
        }
    }

    cancel(): void { this.navigateBack(); }

    private navigateBack(): void {
        if (this.isEdit) {
            this.router.navigate(['/appointments', this.appointmentId]);
        } else {
            const patId = this.route.snapshot.queryParamMap.get('patientId');
            patId
                ? this.router.navigate(['/patients', patId])
                : this.router.navigate(['/appointments']);
        }
    }
}

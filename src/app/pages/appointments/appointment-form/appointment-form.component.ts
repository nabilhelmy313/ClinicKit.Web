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
        MatAutocompleteModule, MatProgressSpinnerModule,
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

        // Pre-fill date when navigating from the calendar "+" button
        const prefilledDate = this.route.snapshot.queryParamMap.get('date');
        if (prefilledDate) {
            // Parse as local date (avoid UTC midnight offset shifting the day)
            const [y, m, d] = prefilledDate.split('-').map(Number);
            this.form.patchValue({ appointmentDate: new Date(y, m - 1, d) });
        }

        const prefilledId = this.route.snapshot.queryParamMap.get('patientId');
        if (prefilledId) {
            this.form.patchValue({ patientId: prefilledId });
            this.patSvc.search(prefilledId).subscribe(res => {
                if (res.length > 0) {
                    this.patientSearch.setValue(res[0].fullName, { emitEvent: false });
                }
            });
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
            startTime:       raw.startTime + ':00',
            endTime:         raw.endTime   + ':00',
            type:            raw.type,
            notes:           raw.notes || null,
        };

        this.svc.create(body).subscribe({
            next: () => {
                this.submitting.set(false);
                this.toast.success(this.langService.translate('APPOINTMENTS.BOOKED_SUCCESS'));
                this.router.navigate(['/appointments']);
            },
            error: () => this.submitting.set(false),
        });
    }

    cancel(): void {
        this.router.navigate(['/appointments']);
    }
}

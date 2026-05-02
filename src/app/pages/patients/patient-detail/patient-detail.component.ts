import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }  from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatTableModule }          from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule }         from '@angular/material/button';

import { PatientsService }     from '../../../core/services/patients.service';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { ToastService }        from '../../../core/services/toast.service';
import { Patient, GenderLabels } from '../../../core/models/patient.model';
import {
    Appointment,
    AppointmentStatusLabels,
    AppointmentTypeLabels,
    AppointmentStatusColor,
} from '../../../core/models/appointment.model';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import {
    CkPageHeaderComponent, CkCardComponent,
    CkBtnComponent, CkStatusBadgeComponent, CkEmptyStateComponent,
} from '../../../shared/index';

@Component({
    selector: 'app-patient-detail',
    standalone: true,
    templateUrl: './patient-detail.component.html',
    styleUrl:    './patient-detail.component.scss',
    imports: [
        CommonModule, DatePipe, RouterLink,
        MatTableModule, MatProgressSpinnerModule, MatButtonModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkStatusBadgeComponent, CkEmptyStateComponent,
    ],
})
export class PatientDetailComponent implements OnInit {
    readonly         router  = inject(Router);
    private readonly route   = inject(ActivatedRoute);
    private readonly svc     = inject(PatientsService);
    private readonly aptSvc  = inject(AppointmentsService);
    private readonly toast   = inject(ToastService);
    readonly langService     = inject(LanguageService);
    readonly themeService    = inject(ThemeService);

    patientId = '';

    patient  = signal<Patient | null>(null);
    loading  = signal(false);

    appointments  = signal<Appointment[]>([]);
    aptLoading    = signal(false);
    aptTotal      = signal(0);
    aptPage       = signal(1);
    aptPageSize   = signal(10);
    aptTotalPages = () => Math.ceil(this.aptTotal() / this.aptPageSize()) || 1;

    aptColumns = ['date', 'time', 'type', 'status'];

    min(a: number, b: number) { return Math.min(a, b); }

    genderLabel(g: number)  { return GenderLabels[g as keyof typeof GenderLabels]  ?? '—'; }
    statusLabel(s: number)  { return AppointmentStatusLabels[s as keyof typeof AppointmentStatusLabels] ?? '—'; }
    typeLabel(t: number)    { return AppointmentTypeLabels[t   as keyof typeof AppointmentTypeLabels]   ?? '—'; }
    statusColor(s: number)  { return AppointmentStatusColor[s  as keyof typeof AppointmentStatusColor]  ?? 'secondary'; }

    ngOnInit(): void {
        this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
        this.loadPatient();
        this.loadAppointments();
    }

    private loadPatient(): void {
        this.loading.set(true);
        this.svc.getById(this.patientId).subscribe({
            next: p  => { this.patient.set(p);  this.loading.set(false); },
            error: () => {
                this.toast.error('تعذّر تحميل بيانات المريض');
                this.router.navigate(['/patients']);
            },
        });
    }

    private loadAppointments(): void {
        this.aptLoading.set(true);
        this.aptSvc.getPatientHistory(this.patientId, this.aptPage(), this.aptPageSize()).subscribe({
            next: res => {
                this.appointments.set(res.items);
                this.aptTotal.set(res.totalCount);
                this.aptLoading.set(false);
            },
            error: () => this.aptLoading.set(false),
        });
    }

    aptPrevPage(): void { this.aptPage.update(p => p - 1); this.loadAppointments(); }
    aptNextPage(): void { this.aptPage.update(p => p + 1); this.loadAppointments(); }

    bookAppointment(): void {
        this.router.navigate(['/appointments/new'], { queryParams: { patientId: this.patientId } });
    }
}

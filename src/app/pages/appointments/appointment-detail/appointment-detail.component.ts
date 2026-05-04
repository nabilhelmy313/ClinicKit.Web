import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule }          from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog }             from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppointmentsService } from '../../../core/services/appointments.service';
import { ToastService }        from '../../../core/services/toast.service';
import {
    Appointment,
    AppointmentStatus,
    AppointmentStatusLabels,
    AppointmentTypeLabels,
} from '../../../core/models/appointment.model';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import {
    CkPageHeaderComponent, CkCardComponent,
    CkBtnComponent, CkStatusBadgeComponent,
    CkDetailsComponent, CkDetailItem,
    CkCancelDialogComponent,
    type CkCancelDialogResult,
} from '../../../shared/index';

@Component({
    selector: 'app-appointment-detail',
    standalone: true,
    templateUrl: './appointment-detail.component.html',
    styleUrl:    './appointment-detail.component.scss',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkStatusBadgeComponent,
        CkDetailsComponent, CkCancelDialogComponent,
    ],
})
export class AppointmentDetailComponent implements OnInit {
    readonly         router  = inject(Router);
    private readonly route   = inject(ActivatedRoute);
    private readonly svc     = inject(AppointmentsService);
    private readonly toast   = inject(ToastService);
    private readonly dialog  = inject(MatDialog);
    readonly langService     = inject(LanguageService);
    readonly themeService    = inject(ThemeService);

    appointmentId = '';
    appointment   = signal<Appointment | null>(null);
    loading       = signal(false);
    cancelling    = signal(false);

    canCancel = computed(() => {
        const s = this.appointment()?.status;
        return s === AppointmentStatus.Pending || s === AppointmentStatus.Confirmed;
    });

    statusLabel(s: AppointmentStatus): string {
        const key = AppointmentStatusLabels[s];
        return key ? this.langService.translate(key) : '—';
    }

    details = computed<CkDetailItem[]>(() => {
        const a = this.appointment();
        if (!a) return [];
        return [
            { label: 'APPOINTMENTS.PATIENT',  value: a.patientName },
            { label: 'APPOINTMENTS.DATE',     value: a.appointmentDate,  type: 'date' },
            { label: 'APPOINTMENTS.TIME',     value: `${a.startTime.substring(0, 5)} – ${a.endTime.substring(0, 5)}`, type: 'ltr' },
            { label: 'APPOINTMENTS.TYPE',     value: this.langService.translate(AppointmentTypeLabels[a.type]) },
            { label: 'APPOINTMENTS.STATUS',   value: this.statusLabel(a.status) },
            { label: 'APPOINTMENTS.NOTES',    value: a.notes,            hideWhenEmpty: true },
            { label: 'APPOINTMENTS.CANCEL_REASON', value: a.cancellationReason, hideWhenEmpty: true },
        ];
    });

    ngOnInit(): void {
        this.appointmentId = this.route.snapshot.paramMap.get('id') ?? '';
        this.load();
    }

    private load(): void {
        this.loading.set(true);
        this.svc.getById(this.appointmentId).subscribe({
            next: a  => { this.appointment.set(a); this.loading.set(false); },
            error: () => {
                this.loading.set(false);
                this.router.navigate(['/appointments']);
            },
        });
    }

    openCancelDialog(): void {
        const a = this.appointment();
        if (!a) return;

        const dialogRef = this.dialog.open(CkCancelDialogComponent, {
            width:     '440px',
            direction: this.langService.isRTL() ? 'rtl' : 'ltr',
            data:      { patientName: a.patientName },
        });

        dialogRef.afterClosed().subscribe((result: CkCancelDialogResult | undefined) => {
            if (!result?.confirmed) return;
            this.doCancel(result.reason);
        });
    }

    private doCancel(reason: string | null): void {
        this.cancelling.set(true);
        this.svc.cancel(this.appointmentId, { cancellationReason: reason }).subscribe({
            next: updated => {
                this.appointment.set(updated);
                this.cancelling.set(false);
                this.toast.success(this.langService.translate('APPOINTMENTS.CANCELLED_SUCCESS'));
            },
            error: () => this.cancelling.set(false),
        });
    }
}

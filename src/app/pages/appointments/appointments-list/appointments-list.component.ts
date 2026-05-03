import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }  from '@angular/common';
import { Router, RouterLink }       from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog }               from '@angular/material/dialog';
import { MatFormFieldModule }      from '@angular/material/form-field';
import { MatInputModule }          from '@angular/material/input';
import { MatSelectModule }         from '@angular/material/select';
import { MatButtonModule }         from '@angular/material/button';
import { MatTableModule }          from '@angular/material/table';
import { MatMenuModule }           from '@angular/material/menu';
import { MatDatepickerModule }     from '@angular/material/datepicker';
import { MatNativeDateModule }     from '@angular/material/core';

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
    CkTableComponent, CkCancelDialogComponent,
    CkCancelDialogResult,
} from '../../../shared/index';

@Component({
    selector: 'app-appointments-list',
    standalone: true,
    templateUrl: './appointments-list.component.html',
    styleUrl:    './appointments-list.component.scss',
    imports: [
        CommonModule, DatePipe, RouterLink, ReactiveFormsModule,
        MatTableModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
        MatMenuModule, MatDatepickerModule, MatNativeDateModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkStatusBadgeComponent,
        CkTableComponent, CkCancelDialogComponent,
    ],
})
export class AppointmentsListComponent implements OnInit {
    readonly         router       = inject(Router);
    private readonly svc          = inject(AppointmentsService);
    private readonly toast        = inject(ToastService);
    private readonly dialog       = inject(MatDialog);
    readonly langService          = inject(LanguageService);
    readonly themeService         = inject(ThemeService);

    fromDateControl = new FormControl<Date | null>(null);
    toDateControl   = new FormControl<Date | null>(null);
    statusControl   = new FormControl<AppointmentStatus | null>(null);

    statusOptions = Object.entries(AppointmentStatusLabels).map(([value, label]) => ({
        value: Number(value) as AppointmentStatus,
        label,
    }));

    // State machine — Cancelled removed; use the dedicated cancel button instead
    private readonly validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
        [AppointmentStatus.Pending]:    [AppointmentStatus.Confirmed, AppointmentStatus.NoShow],
        [AppointmentStatus.Confirmed]:  [AppointmentStatus.InProgress, AppointmentStatus.NoShow],
        [AppointmentStatus.InProgress]: [AppointmentStatus.Completed],
        [AppointmentStatus.Completed]:  [],
        [AppointmentStatus.Cancelled]:  [],
        [AppointmentStatus.NoShow]:     [],
    };

    nextOptions(current: AppointmentStatus) {
        return this.validTransitions[current]?.map(v => ({
            value: v,
            label: AppointmentStatusLabels[v] ?? '',   // i18n key — translated in template via | translate
        })) ?? [];
    }

    canChange(status: AppointmentStatus): boolean {
        return (this.validTransitions[status]?.length ?? 0) > 0;
    }

    /** Show cancel button for appointments that can still be cancelled. */
    canCancel(status: AppointmentStatus): boolean {
        return status === AppointmentStatus.Pending || status === AppointmentStatus.Confirmed;
    }

    appointments = signal<Appointment[]>([]);
    totalCount   = signal(0);
    page         = signal(1);
    pageSize     = signal(20);
    loading      = signal(false);
    updatingId   = signal<string | null>(null);

    displayedColumns = ['patient', 'date', 'time', 'type', 'status', 'actions'];

    statusLabel(s: number): string {
        const key = AppointmentStatusLabels[s as keyof typeof AppointmentStatusLabels];
        return key ? this.langService.translate(key) : '—';
    }
    typeLabel(t: number): string {
        const key = AppointmentTypeLabels[t as keyof typeof AppointmentTypeLabels];
        return key ? this.langService.translate(key) : '—';
    }

    ngOnInit(): void { this.load(); }

    search(): void { this.page.set(1); this.load(); }

    load(): void {
        this.loading.set(true);
        const toDate = (d: Date | null) => d ? d.toISOString().split('T')[0] : undefined;

        this.svc.list({
            fromDate: toDate(this.fromDateControl.value),
            toDate:   toDate(this.toDateControl.value),
            status:   this.statusControl.value ?? undefined,
            page:     this.page(),
            pageSize: this.pageSize(),
        }).subscribe({
            next: res => {
                this.appointments.set(res.items);
                this.totalCount.set(res.totalCount);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    prevPage(): void { this.page.update(p => p - 1); this.load(); }
    nextPage(): void { this.page.update(p => p + 1); this.load(); }

    // ── Status change (non-cancel transitions) ────────────────────────────────
    changeStatus(appointment: Appointment, newStatus: AppointmentStatus): void {
        if (appointment.status === newStatus) return;

        this.updatingId.set(appointment.id);
        this.appointments.update(list =>
            list.map(a => a.id === appointment.id ? { ...a, status: newStatus } : a),
        );

        this.svc.updateStatus(appointment.id, { newStatus }).subscribe({
            next: updated => {
                this.appointments.update(list =>
                    list.map(a => a.id === updated.id ? updated : a),
                );
                this.updatingId.set(null);
                this.toast.success(this.langService.translate('APPOINTMENTS.STATUS_UPDATED'));
            },
            error: () => {
                this.appointments.update(list =>
                    list.map(a => a.id === appointment.id ? { ...a, status: appointment.status } : a),
                );
                this.updatingId.set(null);
            },
        });
    }

    // ── Cancel (opens reason dialog first) ───────────────────────────────────
    openCancelDialog(appointment: Appointment): void {
        const dialogRef = this.dialog.open(CkCancelDialogComponent, {
            width:     '440px',
            direction: this.langService.isRTL() ? 'rtl' : 'ltr',
            data:      { patientName: appointment.patientName },
        });

        dialogRef.afterClosed().subscribe((result: CkCancelDialogResult | undefined) => {
            if (!result?.confirmed) return;
            this.doCancel(appointment, result.reason);
        });
    }

    private doCancel(appointment: Appointment, reason: string | null): void {
        this.updatingId.set(appointment.id);

        // Optimistic update
        this.appointments.update(list =>
            list.map(a => a.id === appointment.id
                ? { ...a, status: AppointmentStatus.Cancelled, cancellationReason: reason }
                : a),
        );

        this.svc.cancel(appointment.id, { cancellationReason: reason }).subscribe({
            next: updated => {
                this.appointments.update(list =>
                    list.map(a => a.id === updated.id ? updated : a),
                );
                this.updatingId.set(null);
                this.toast.success(this.langService.translate('APPOINTMENTS.CANCELLED_SUCCESS'));
            },
            error: () => {
                // Rollback
                this.appointments.update(list =>
                    list.map(a => a.id === appointment.id ? appointment : a),
                );
                this.updatingId.set(null);
            },
        });
    }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }  from '@angular/common';
import { Router, RouterLink }       from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule }  from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatSelectModule }     from '@angular/material/select';
import { MatButtonModule }     from '@angular/material/button';
import { MatTableModule }      from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AppointmentsService } from '../../../core/services/appointments.service';
import { ToastService }        from '../../../core/services/toast.service';
import {
    Appointment,
    AppointmentStatus,
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
    selector: 'app-appointments-list',
    standalone: true,
    templateUrl: './appointments-list.component.html',
    styleUrl:    './appointments-list.component.scss',
    imports: [
        CommonModule, DatePipe, RouterLink, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
        MatTableModule, MatProgressBarModule,
        MatDatepickerModule, MatNativeDateModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkStatusBadgeComponent, CkEmptyStateComponent,
    ],
})
export class AppointmentsListComponent implements OnInit {
    readonly         router       = inject(Router);
    private readonly svc          = inject(AppointmentsService);
    private readonly toast        = inject(ToastService);
    readonly langService          = inject(LanguageService);
    readonly themeService         = inject(ThemeService);

    protected readonly AppointmentStatus = AppointmentStatus;

    fromDateControl = new FormControl<Date | null>(null);
    toDateControl   = new FormControl<Date | null>(null);
    statusControl   = new FormControl<AppointmentStatus | null>(null);

    statusOptions = Object.entries(AppointmentStatusLabels).map(([value, label]) => ({
        value: Number(value) as AppointmentStatus,
        label,
    }));

    appointments = signal<Appointment[]>([]);
    totalCount   = signal(0);
    page         = signal(1);
    pageSize     = signal(20);
    loading      = signal(false);
    updatingId   = signal<string | null>(null);

    displayedColumns = ['patient', 'date', 'time', 'type', 'status'];

    totalPages() { return Math.ceil(this.totalCount() / this.pageSize()) || 1; }
    min(a: number, b: number) { return Math.min(a, b); }
    statusLabel(s: number) { return AppointmentStatusLabels[s as keyof typeof AppointmentStatusLabels] ?? '—'; }
    typeLabel(t: number)   { return AppointmentTypeLabels[t   as keyof typeof AppointmentTypeLabels]   ?? '—'; }
    statusColor(s: number) { return AppointmentStatusColor[s  as keyof typeof AppointmentStatusColor]  ?? 'secondary'; }

    ngOnInit(): void { this.load(); }

    search(): void { this.page.set(1); this.load(); }

    load(): void {
        this.loading.set(true);

        const toDate = (d: Date | null) =>
            d ? d.toISOString().split('T')[0] : undefined;

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

    changeStatus(appointment: Appointment, newStatus: AppointmentStatus): void {
        if (appointment.status === newStatus) return;

        this.updatingId.set(appointment.id);

        // Optimistic update so the badge reflects immediately
        this.appointments.update(list =>
            list.map(a => a.id === appointment.id ? { ...a, status: newStatus } : a),
        );

        this.svc.updateStatus(appointment.id, { status: newStatus }).subscribe({
            next: updated => {
                this.appointments.update(list =>
                    list.map(a => a.id === updated.id ? updated : a),
                );
                this.updatingId.set(null);
                this.toast.success(this.langService.translate('APPOINTMENTS.STATUS_UPDATED'));
            },
            error: () => {
                // Rollback on failure
                this.appointments.update(list =>
                    list.map(a => a.id === appointment.id ? { ...a, status: appointment.status } : a),
                );
                this.updatingId.set(null);
            },
        });
    }
}

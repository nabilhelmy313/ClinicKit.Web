import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }  from '@angular/common';
import { Router, RouterLink }       from '@angular/router';
import { MatDialog }               from '@angular/material/dialog';
import { MatButtonModule }         from '@angular/material/button';
import { MatMenuModule }           from '@angular/material/menu';

import { AppointmentsService } from '../../../core/services/appointments.service';
import { ToastService }        from '../../../core/services/toast.service';
import {
    Appointment,
    AppointmentStatus,
    AppointmentStatusLabels,
    AppointmentType,
    AppointmentTypeLabels,
} from '../../../core/models/appointment.model';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import {
    CkPageHeaderComponent, CkCardComponent,
    CkBtnComponent, CkStatusBadgeComponent,
    CkTableComponent, CkCancelDialogComponent,
    CkCancelDialogResult, CkCellDefDirective,
} from '../../../shared/index';
import type { CkColumnDef, CkTableAction, CkFilterOption, CkSortChange } from '../../../shared/index';

@Component({
    selector: 'app-appointments-list',
    standalone: true,
    templateUrl: './appointments-list.component.html',
    styleUrl:    './appointments-list.component.scss',
    imports: [
        CommonModule, DatePipe, RouterLink,
        MatButtonModule, MatMenuModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkStatusBadgeComponent,
        CkTableComponent, CkCancelDialogComponent, CkCellDefDirective,
    ],
})
export class AppointmentsListComponent implements OnInit {
    readonly         router       = inject(Router);
    private readonly svc          = inject(AppointmentsService);
    private readonly toast        = inject(ToastService);
    private readonly dialog       = inject(MatDialog);
    readonly langService          = inject(LanguageService);
    readonly themeService         = inject(ThemeService);

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

    // ── Active backend filters ────────────────────────────────────────────────
    private _filterDate          = signal<string | undefined>(undefined);
    private _filterStatus        = signal<AppointmentStatus | undefined>(undefined);
    private _filterType          = signal<AppointmentType | undefined>(undefined);
    private _filterPatientSearch = signal<string | undefined>(undefined);
    private _sortBy              = signal<string | undefined>(undefined);
    private _sortDir             = signal<'asc' | 'desc' | undefined>(undefined);

    // ── Select options for inline column filters ──────────────────────────────
    private readonly statusFilterOptions: CkFilterOption[] =
        Object.entries(AppointmentStatusLabels).map(([value, label]) => ({ value, label }));

    private readonly typeFilterOptions: CkFilterOption[] =
        Object.entries(AppointmentTypeLabels).map(([value, label]) => ({ value, label }));

    colDefs: CkColumnDef[] = [
        {
            key: 'patient', label: 'APPOINTMENTS.PATIENT', sortable: true,
            searchable: true, filterType: 'text',
        },
        {
            key: 'date', label: 'APPOINTMENTS.DATE', sortable: true,
            searchable: true, filterType: 'date',
        },
        { key: 'time', label: 'APPOINTMENTS.TIME', sortable: false },
        {
            key: 'type', label: 'APPOINTMENTS.TYPE', sortable: true,
            searchable: true, filterType: 'select', filterOptions: this.typeFilterOptions,
        },
        {
            key: 'status', label: 'APPOINTMENTS.STATUS', sortable: true,
            searchable: true, filterType: 'select', filterOptions: this.statusFilterOptions,
        },
    ];

    tableActions: CkTableAction<Appointment>[] = [
        {
            icon:   'visibility',
            label:  'COMMON.VIEW',
            inline: true,
            click:  (a) => this.router.navigate(['/appointments', a.id]),
        },
        {
            icon:     'event_busy',
            label:    'APPOINTMENTS.CANCEL',
            inline:   true,
            danger:   true,
            visible:  (a) => this.canCancel(a.status),
            disabled: (a) => this.updatingId() === a.id,
            click:    (a) => this.openCancelDialog(a),
        },
    ];

    statusLabel(s: number): string {
        const key = AppointmentStatusLabels[s as keyof typeof AppointmentStatusLabels];
        return key ? this.langService.translate(key) : '—';
    }
    typeLabel(t: number): string {
        const key = AppointmentTypeLabels[t as keyof typeof AppointmentTypeLabels];
        return key ? this.langService.translate(key) : '—';
    }

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading.set(true);
        const date = this._filterDate();
        this.svc.list({
            fromDate:      date,
            toDate:        date,
            status:        this._filterStatus(),
            type:          this._filterType(),
            patientSearch: this._filterPatientSearch(),
            sortBy:        this._sortBy(),
            sortDir:       this._sortDir(),
            page:          this.page(),
            pageSize:      this.pageSize(),
        }).subscribe({
            next: res => {
                this.appointments.set(res.items);
                this.totalCount.set(res.totalCount);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    /** Fired by ck-table (filterChange) — maps column keys → API params. */
    onFilterChange(filters: Record<string, string>): void {
        this._filterDate.set(filters['date'] || undefined);
        this._filterPatientSearch.set(filters['patient'] || undefined);
        this._filterStatus.set(
            filters['status'] !== undefined && filters['status'] !== ''
                ? (Number(filters['status']) as AppointmentStatus)
                : undefined,
        );
        this._filterType.set(
            filters['type'] !== undefined && filters['type'] !== ''
                ? (Number(filters['type']) as AppointmentType)
                : undefined,
        );
        this.page.set(1);
        this.load();
    }

    onSortChange(sort: CkSortChange): void {
        this._sortBy.set(sort.col ?? undefined);
        this._sortDir.set(sort.dir ?? undefined);
        this.page.set(1);
        this.load();
    }

    prevPage(): void { this.page.update(p => p - 1); this.load(); }
    nextPage(): void { this.page.update(p => p + 1); this.load(); }

    onPageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.page.set(1);
        this.load();
    }

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
            width:      '440px',
            maxWidth:   '95vw',
            panelClass: 'ck-dialog-panel',
            direction:  this.langService.isRTL() ? 'rtl' : 'ltr',
            data:       { patientName: appointment.patientName },
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

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
import {
    Appointment,
    AppointmentStatus,
    AppointmentStatusLabels,
    AppointmentTypeLabels,
    AppointmentStatusColor,
} from '../../../core/models/appointment.model';

@Component({
    selector: 'app-appointments-list',
    standalone: true,
    imports: [
        CommonModule, DatePipe, RouterLink, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
        MatTableModule, MatProgressBarModule,
        MatDatepickerModule, MatNativeDateModule,
    ],
    template: `
        <!-- Page header -->
        <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
            <h5 class="mb-0">
                <i class="material-symbols-outlined me-2 align-middle">calendar_month</i>
                المواعيد
            </h5>
            <div class="d-flex gap-10">
                <button class="default-btn outline-btn"
                        (click)="router.navigate(['/appointments/calendar'])">
                    <i class="material-symbols-outlined me-1">grid_view</i>
                    تقويم
                </button>
                <button class="default-btn"
                        (click)="router.navigate(['/appointments/new'])">
                    <i class="material-symbols-outlined me-1">add</i>
                    موعد جديد
                </button>
            </div>
        </div>

        <!-- Filters card -->
        <div class="card-box mb-25">
            <div class="row align-items-end">
                <div class="col-md-3 mb-15">
                    <mat-form-field appearance="outline" class="w-100">
                        <mat-label>من تاريخ</mat-label>
                        <input matInput [matDatepicker]="fromPicker"
                               [formControl]="fromDateControl" />
                        <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                        <mat-datepicker #fromPicker></mat-datepicker>
                    </mat-form-field>
                </div>
                <div class="col-md-3 mb-15">
                    <mat-form-field appearance="outline" class="w-100">
                        <mat-label>إلى تاريخ</mat-label>
                        <input matInput [matDatepicker]="toPicker"
                               [formControl]="toDateControl" />
                        <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                        <mat-datepicker #toPicker></mat-datepicker>
                    </mat-form-field>
                </div>
                <div class="col-md-3 mb-15">
                    <mat-form-field appearance="outline" class="w-100">
                        <mat-label>الحالة</mat-label>
                        <mat-select [formControl]="statusControl">
                            <mat-option [value]="null">الكل</mat-option>
                            @for (opt of statusOptions; track opt.value) {
                                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                            }
                        </mat-select>
                    </mat-form-field>
                </div>
                <div class="col-md-3 mb-15">
                    <button class="default-btn w-100" style="height:54px" (click)="search()">
                        <i class="material-symbols-outlined me-1">search</i>
                        بحث
                    </button>
                </div>
            </div>
        </div>

        <!-- Table card -->
        <div class="card-box mb-25">
            @if (loading()) {
                <mat-progress-bar mode="indeterminate" class="mb-15"></mat-progress-bar>
            }

            @if (!loading() && appointments().length === 0) {
                <div class="text-center py-40">
                    <i class="material-symbols-outlined" style="font-size:48px;color:#ccc">
                        event_busy
                    </i>
                    <p class="text-body mt-10">لا توجد مواعيد مطابقة للبحث.</p>
                </div>
            } @else {
                <div class="table-responsive">
                    <table mat-table [dataSource]="appointments()" class="w-100">

                        <!-- Patient -->
                        <ng-container matColumnDef="patient">
                            <th mat-header-cell *matHeaderCellDef>المريض</th>
                            <td mat-cell *matCellDef="let a">
                                <a [routerLink]="['/patients', a.patientId]" class="fw-medium text-primary">
                                    {{ a.patientName }}
                                </a>
                                <div class="text-body" style="font-size:12px" dir="ltr">{{ a.patientPhone }}</div>
                            </td>
                        </ng-container>

                        <!-- Date -->
                        <ng-container matColumnDef="date">
                            <th mat-header-cell *matHeaderCellDef>التاريخ</th>
                            <td mat-cell *matCellDef="let a">
                                {{ a.appointmentDate | date:'dd/MM/yyyy' }}
                            </td>
                        </ng-container>

                        <!-- Time -->
                        <ng-container matColumnDef="time">
                            <th mat-header-cell *matHeaderCellDef>الوقت</th>
                            <td mat-cell *matCellDef="let a" dir="ltr">
                                {{ a.startTime.substring(0,5) }} – {{ a.endTime.substring(0,5) }}
                            </td>
                        </ng-container>

                        <!-- Type -->
                        <ng-container matColumnDef="type">
                            <th mat-header-cell *matHeaderCellDef>النوع</th>
                            <td mat-cell *matCellDef="let a">{{ typeLabel(a.type) }}</td>
                        </ng-container>

                        <!-- Status -->
                        <ng-container matColumnDef="status">
                            <th mat-header-cell *matHeaderCellDef>الحالة</th>
                            <td mat-cell *matCellDef="let a">
                                <span class="badge bg-{{ statusColor(a.status) }}">
                                    {{ statusLabel(a.status) }}
                                </span>
                            </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="d-flex align-items-center justify-content-between mt-20 pt-15"
                     style="border-top:1px solid #eee">
                    <span class="text-body" style="font-size:13px">
                        {{ (page() - 1) * pageSize() + 1 }}–{{ min(page() * pageSize(), totalCount()) }}
                        من {{ totalCount() }} موعد
                    </span>
                    <div class="d-flex gap-2">
                        <button class="default-btn small-btn"
                                [disabled]="page() === 1" (click)="prevPage()">
                            <i class="material-symbols-outlined">chevron_right</i>
                        </button>
                        <span class="d-flex align-items-center px-10">{{ page() }} / {{ totalPages() }}</span>
                        <button class="default-btn small-btn"
                                [disabled]="page() >= totalPages()" (click)="nextPage()">
                            <i class="material-symbols-outlined">chevron_left</i>
                        </button>
                    </div>
                </div>
            }
        </div>
    `,
})
export class AppointmentsListComponent implements OnInit {
    readonly         router = inject(Router);
    private readonly svc    = inject(AppointmentsService);

    // ── filter controls ───────────────────────────────────────────────────────
    fromDateControl = new FormControl<Date | null>(null);
    toDateControl   = new FormControl<Date | null>(null);
    statusControl   = new FormControl<AppointmentStatus | null>(null);

    statusOptions = Object.entries(AppointmentStatusLabels).map(([value, label]) => ({
        value: Number(value) as AppointmentStatus,
        label,
    }));

    // ── reactive state ────────────────────────────────────────────────────────
    appointments = signal<Appointment[]>([]);
    totalCount   = signal(0);
    page         = signal(1);
    pageSize     = signal(20);
    loading      = signal(false);

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
}

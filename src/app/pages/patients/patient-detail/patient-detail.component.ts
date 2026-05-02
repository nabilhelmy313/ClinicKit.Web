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

@Component({
    selector: 'app-patient-detail',
    standalone: true,
    imports: [
        CommonModule, DatePipe, RouterLink,
        MatTableModule, MatProgressSpinnerModule, MatButtonModule,
    ],
    template: `
        <!-- Page header -->
        <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-10">
                <button mat-icon-button (click)="router.navigate(['/patients'])">
                    <i class="material-symbols-outlined">arrow_forward</i>
                </button>
                <h5 class="mb-0">
                    {{ patient()?.fullName ?? 'تحميل…' }}
                </h5>
            </div>
            <div class="d-flex gap-10">
                <button class="default-btn outline-btn"
                        (click)="router.navigate(['/patients', patientId, 'edit'])">
                    <i class="material-symbols-outlined me-1">edit</i>
                    تعديل
                </button>
                <button class="default-btn"
                        (click)="bookAppointment()">
                    <i class="material-symbols-outlined me-1">event_add</i>
                    حجز موعد
                </button>
            </div>
        </div>

        @if (loading()) {
            <div class="d-flex align-items-center justify-content-center py-60">
                <mat-spinner diameter="48"></mat-spinner>
            </div>
        } @else if (patient(); as p) {
            <!-- Info card -->
            <div class="card-box mb-25">
                <div class="row">
                    <div class="col-md-6">
                        <dl class="row mb-0">
                            <dt class="col-5 text-body">الاسم الكامل</dt>
                            <dd class="col-7 fw-medium">{{ p.fullName }}</dd>

                            <dt class="col-5 text-body">التليفون</dt>
                            <dd class="col-7" dir="ltr">{{ p.phone }}</dd>

                            <dt class="col-5 text-body">النوع</dt>
                            <dd class="col-7">{{ genderLabel(p.gender) }}</dd>
                        </dl>
                    </div>
                    <div class="col-md-6">
                        <dl class="row mb-0">
                            <dt class="col-5 text-body">تاريخ الميلاد</dt>
                            <dd class="col-7">
                                {{ p.dateOfBirth ? (p.dateOfBirth | date:'dd/MM/yyyy') : '—' }}
                            </dd>

                            <dt class="col-5 text-body">تاريخ التسجيل</dt>
                            <dd class="col-7">{{ p.createdAt | date:'dd/MM/yyyy' }}</dd>

                            @if (p.notes) {
                                <dt class="col-5 text-body">ملاحظات</dt>
                                <dd class="col-7">{{ p.notes }}</dd>
                            }
                        </dl>
                    </div>
                </div>
            </div>

            <!-- Appointments history -->
            <div class="card-box mb-25">
                <div class="d-flex align-items-center justify-content-between mb-20">
                    <h6 class="mb-0">
                        <i class="material-symbols-outlined me-2 align-middle">calendar_month</i>
                        سجل المواعيد
                    </h6>
                    <button class="default-btn small-btn" (click)="bookAppointment()">
                        <i class="material-symbols-outlined me-1">add</i>
                        موعد جديد
                    </button>
                </div>

                @if (aptLoading()) {
                    <div class="text-center py-20">
                        <mat-spinner diameter="32"></mat-spinner>
                    </div>
                } @else if (appointments().length === 0) {
                    <p class="text-body text-center py-20 mb-0">
                        لا يوجد مواعيد مسجلة لهذا المريض.
                    </p>
                } @else {
                    <div class="table-responsive">
                        <table mat-table [dataSource]="appointments()" class="w-100">

                            <ng-container matColumnDef="date">
                                <th mat-header-cell *matHeaderCellDef>التاريخ</th>
                                <td mat-cell *matCellDef="let a">
                                    {{ a.appointmentDate | date:'dd/MM/yyyy' }}
                                </td>
                            </ng-container>

                            <ng-container matColumnDef="time">
                                <th mat-header-cell *matHeaderCellDef>الوقت</th>
                                <td mat-cell *matCellDef="let a" dir="ltr">
                                    {{ a.startTime.substring(0,5) }} – {{ a.endTime.substring(0,5) }}
                                </td>
                            </ng-container>

                            <ng-container matColumnDef="type">
                                <th mat-header-cell *matHeaderCellDef>النوع</th>
                                <td mat-cell *matCellDef="let a">{{ typeLabel(a.type) }}</td>
                            </ng-container>

                            <ng-container matColumnDef="status">
                                <th mat-header-cell *matHeaderCellDef>الحالة</th>
                                <td mat-cell *matCellDef="let a">
                                    <span class="badge bg-{{ statusColor(a.status) }}">
                                        {{ statusLabel(a.status) }}
                                    </span>
                                </td>
                            </ng-container>

                            <tr mat-header-row *matHeaderRowDef="aptColumns"></tr>
                            <tr mat-row *matRowDef="let row; columns: aptColumns;"></tr>
                        </table>
                    </div>

                    <!-- Pagination -->
                    @if (aptTotalPages() > 1) {
                        <div class="d-flex align-items-center justify-content-between mt-15 pt-15"
                             style="border-top:1px solid #eee">
                            <span class="text-body" style="font-size:13px">
                                {{ (aptPage() - 1) * aptPageSize() + 1 }}–{{ min(aptPage() * aptPageSize(), aptTotal()) }}
                                من {{ aptTotal() }} موعد
                            </span>
                            <div class="d-flex gap-2">
                                <button class="default-btn small-btn" [disabled]="aptPage() === 1"
                                        (click)="aptPrevPage()">
                                    <i class="material-symbols-outlined">chevron_right</i>
                                </button>
                                <span class="d-flex align-items-center px-10">
                                    {{ aptPage() }} / {{ aptTotalPages() }}
                                </span>
                                <button class="default-btn small-btn" [disabled]="aptPage() >= aptTotalPages()"
                                        (click)="aptNextPage()">
                                    <i class="material-symbols-outlined">chevron_left</i>
                                </button>
                            </div>
                        </div>
                    }
                }
            </div>
        }
    `,
})
export class PatientDetailComponent implements OnInit {
    readonly         router  = inject(Router);
    private readonly route   = inject(ActivatedRoute);
    private readonly svc     = inject(PatientsService);
    private readonly aptSvc  = inject(AppointmentsService);
    private readonly toast   = inject(ToastService);

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

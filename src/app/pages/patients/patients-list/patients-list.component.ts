import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }  from '@angular/common';
import { RouterLink, Router }       from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatTableModule }     from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { PatientsService } from '../../../core/services/patients.service';
import { Patient, GenderLabels } from '../../../core/models/patient.model';

@Component({
    selector: 'app-patients-list',
    standalone: true,
    imports: [
        CommonModule, RouterLink, DatePipe,
        ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatButtonModule,
        MatTableModule, MatProgressBarModule,
    ],
    template: `
        <!-- Page header -->
        <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
            <h5 class="mb-0">
                <i class="material-symbols-outlined me-2 align-middle">patient_list</i>
                المرضى
            </h5>
            <button class="default-btn" (click)="router.navigate(['/patients/new'])">
                <i class="material-symbols-outlined me-1">person_add</i>
                مريض جديد
            </button>
        </div>

        <!-- Filters card -->
        <div class="card-box mb-25">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>بحث باسم المريض أو التليفون</mat-label>
                <input matInput [formControl]="searchControl" placeholder="اكتب للبحث…" />
                <span matSuffix class="material-symbols-outlined pe-2">search</span>
            </mat-form-field>
        </div>

        <!-- Table card -->
        <div class="card-box mb-25">
            @if (loading()) {
                <mat-progress-bar mode="indeterminate" class="mb-15"></mat-progress-bar>
            }

            @if (!loading() && patients().length === 0) {
                <div class="text-center py-40">
                    <i class="material-symbols-outlined" style="font-size:48px;color:#ccc">person_search</i>
                    <p class="text-body mt-10">لا يوجد مرضى مسجلين بعد.</p>
                    <button class="default-btn mt-10" (click)="router.navigate(['/patients/new'])">
                        سجّل أول مريض
                    </button>
                </div>
            } @else {
                <div class="table-responsive">
                    <table mat-table [dataSource]="patients()" class="w-100">

                        <!-- Name column -->
                        <ng-container matColumnDef="name">
                            <th mat-header-cell *matHeaderCellDef>الاسم</th>
                            <td mat-cell *matCellDef="let p">
                                <a [routerLink]="['/patients', p.id]" class="fw-medium text-primary">
                                    {{ p.fullName }}
                                </a>
                            </td>
                        </ng-container>

                        <!-- Phone column -->
                        <ng-container matColumnDef="phone">
                            <th mat-header-cell *matHeaderCellDef>التليفون</th>
                            <td mat-cell *matCellDef="let p" dir="ltr">{{ p.phone }}</td>
                        </ng-container>

                        <!-- Gender column -->
                        <ng-container matColumnDef="gender">
                            <th mat-header-cell *matHeaderCellDef>النوع</th>
                            <td mat-cell *matCellDef="let p">{{ genderLabel(p.gender) }}</td>
                        </ng-container>

                        <!-- DOB column -->
                        <ng-container matColumnDef="dob">
                            <th mat-header-cell *matHeaderCellDef>تاريخ الميلاد</th>
                            <td mat-cell *matCellDef="let p">
                                {{ p.dateOfBirth ? (p.dateOfBirth | date:'dd/MM/yyyy') : '—' }}
                            </td>
                        </ng-container>

                        <!-- Actions column -->
                        <ng-container matColumnDef="actions">
                            <th mat-header-cell *matHeaderCellDef></th>
                            <td mat-cell *matCellDef="let p">
                                <button mat-icon-button
                                        title="عرض الملف"
                                        (click)="router.navigate(['/patients', p.id])">
                                    <i class="material-symbols-outlined">visibility</i>
                                </button>
                                <button mat-icon-button
                                        title="حجز موعد"
                                        (click)="bookAppointment(p.id)">
                                    <i class="material-symbols-outlined">event_add</i>
                                </button>
                            </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                            class="cursor-pointer"
                            (click)="router.navigate(['/patients', row.id])"></tr>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="d-flex align-items-center justify-content-between mt-20 pt-15"
                     style="border-top:1px solid #eee">
                    <span class="text-body" style="font-size:13px">
                        {{ (page() - 1) * pageSize() + 1 }}–{{ min(page() * pageSize(), totalCount()) }}
                        من {{ totalCount() }} مريض
                    </span>
                    <div class="d-flex gap-2">
                        <button class="default-btn small-btn"
                                [disabled]="page() === 1"
                                (click)="prevPage()">
                            <i class="material-symbols-outlined">chevron_right</i>
                        </button>
                        <span class="d-flex align-items-center px-10">{{ page() }} / {{ totalPages() }}</span>
                        <button class="default-btn small-btn"
                                [disabled]="page() >= totalPages()"
                                (click)="nextPage()">
                            <i class="material-symbols-outlined">chevron_left</i>
                        </button>
                    </div>
                </div>
            }
        </div>
    `,
})
export class PatientsListComponent implements OnInit, OnDestroy {
    readonly router          = inject(Router);
    private  readonly svc    = inject(PatientsService);
    private  readonly destroy$ = new Subject<void>();

    searchControl = new FormControl('');

    // ── reactive state ────────────────────────────────────────────────────────
    patients   = signal<Patient[]>([]);
    totalCount = signal(0);
    page       = signal(1);
    pageSize   = signal(20);
    loading    = signal(false);

    displayedColumns = ['name', 'phone', 'gender', 'dob', 'actions'];

    totalPages() { return Math.ceil(this.totalCount() / this.pageSize()) || 1; }
    min(a: number, b: number) { return Math.min(a, b); }
    genderLabel(g: number) { return GenderLabels[g as keyof typeof GenderLabels] ?? '—'; }

    ngOnInit(): void {
        this.load();

        this.searchControl.valueChanges.pipe(
            debounceTime(350),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
        ).subscribe(() => {
            this.page.set(1);
            this.load();
        });
    }

    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

    load(): void {
        this.loading.set(true);
        this.svc.list({
            search:   this.searchControl.value || undefined,
            page:     this.page(),
            pageSize: this.pageSize(),
        }).subscribe({
            next: res => {
                this.patients.set(res.items);
                this.totalCount.set(res.totalCount);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    prevPage(): void { this.page.update(p => p - 1); this.load(); }
    nextPage(): void { this.page.update(p => p + 1); this.load(); }

    bookAppointment(patientId: string): void {
        this.router.navigate(['/appointments/new'], { queryParams: { patientId } });
    }
}

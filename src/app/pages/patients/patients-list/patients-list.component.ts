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
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import { CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkEmptyStateComponent } from '../../../shared/index';

@Component({
    selector: 'app-patients-list',
    standalone: true,
    templateUrl: './patients-list.component.html',
    styleUrl:    './patients-list.component.scss',
    imports: [
        CommonModule, RouterLink, DatePipe,
        ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatButtonModule,
        MatTableModule, MatProgressBarModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkEmptyStateComponent,
    ],
})
export class PatientsListComponent implements OnInit, OnDestroy {
    readonly router          = inject(Router);
    readonly langService     = inject(LanguageService);
    readonly themeService    = inject(ThemeService);
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

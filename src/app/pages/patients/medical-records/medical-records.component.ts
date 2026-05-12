import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }  from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule }       from '@angular/material/expansion';

import { PatientsService } from '../../../core/services/patients.service';
import { VisitsService }   from '../../../core/services/visits.service';
import { ToastService }    from '../../../core/services/toast.service';
import { Patient }         from '../../../core/models/patient.model';
import { Visit }           from '../../../core/models/visit.model';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import {
    CkPageHeaderComponent, CkCardComponent,
    CkBtnComponent, CkEmptyStateComponent,
} from '../../../shared/index';
import { VisitFormComponent }        from './visit-form/visit-form.component';
import { VisitAttachmentsComponent } from './visit-attachments/visit-attachments.component';

@Component({
    selector: 'app-medical-records',
    standalone: true,
    templateUrl: './medical-records.component.html',
    styleUrl: './medical-records.component.scss',
    imports: [
        CommonModule, DatePipe,
        MatProgressSpinnerModule, MatExpansionModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkEmptyStateComponent,
        VisitFormComponent,
        VisitAttachmentsComponent,
    ],
})
export class MedicalRecordsComponent implements OnInit {
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    readonly router       = inject(Router);
    private readonly route     = inject(ActivatedRoute);
    private readonly patSvc    = inject(PatientsService);
    private readonly visitsSvc = inject(VisitsService);
    private readonly toast     = inject(ToastService);

    patientId = '';

    patient        = signal<Patient | null>(null);
    patientLoading = signal(false);

    visits        = signal<Visit[]>([]);
    visitsLoading = signal(false);
    totalCount    = signal(0);
    page          = signal(1);
    pageSize      = signal(10);
    totalPages    = () => Math.ceil(this.totalCount() / this.pageSize()) || 1;

    showForm = signal(false);

    ngOnInit(): void {
        this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
        this.loadPatient();
        this.loadVisits();
    }

    private loadPatient(): void {
        this.patientLoading.set(true);
        this.patSvc.getById(this.patientId).subscribe({
            next: p  => { this.patient.set(p); this.patientLoading.set(false); },
            error: () => {
                this.toast.error(this.langService.translate('PATIENTS.LOAD_ERROR'));
                this.router.navigate(['/patients']);
            },
        });
    }

    loadVisits(): void {
        this.visitsLoading.set(true);
        this.visitsSvc.getPatientVisits(this.patientId, this.page(), this.pageSize()).subscribe({
            next: res => {
                this.visits.set(res.items);
                this.totalCount.set(res.totalCount);
                this.visitsLoading.set(false);
            },
            error: () => this.visitsLoading.set(false),
        });
    }

    onVisitSaved(_visit: Visit): void {
        this.showForm.set(false);
        this.page.set(1);
        this.loadVisits();
    }

    prevPage(): void { this.page.update(p => p - 1); this.loadVisits(); }
    nextPage(): void { this.page.update(p => p + 1); this.loadVisits(); }
}

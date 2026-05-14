import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { RouterLink, Router } from '@angular/router';

import { DoctorsService }    from '../../../core/services/doctors.service';
import { Doctor }            from '../../../core/models/doctor.model';
import { TranslatePipe }     from '../../../core/pipes/translate.pipe';
import { LanguageService }   from '../../../core/services/language.service';
import { ThemeService }      from '../../../core/services/theme.service';
import { ToastService }      from '../../../core/services/toast.service';
import { DialogService }     from '../../../core/services/dialog.service';
import {
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
    CkTableComponent, CkCellDefDirective,
} from '../../../shared/index';
import type { CkColumnDef, CkTableAction } from '../../../shared/index';

@Component({
    selector: 'app-doctors-list',
    standalone: true,
    imports: [
        CommonModule, RouterLink,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
        CkTableComponent, CkCellDefDirective,
    ],
    template: `
<div [dir]="langService.isRTL() ? 'rtl' : 'ltr'"
     [class.component-dark-theme]="themeService.isDark()">

  <ck-page-header title="DOCTORS.TITLE" icon="medical_services">
    <ck-btn icon="add" (click)="router.navigate(['/doctors/new'])">
      {{ 'DOCTORS.ADD' | translate }}
    </ck-btn>
  </ck-page-header>

  <ck-card>
    <ck-table
      [columnDefs]="colDefs"
      [data]="doctors()"
      [totalCount]="doctors().length"
      [loading]="loading()"
      [actions]="actions"
    >
      <!-- colour swatch -->
      <ng-template ckCellDef="color" let-row>
        <span class="doctor-color-dot" [style.background]="row.color"></span>
      </ng-template>

      <!-- active badge -->
      <ng-template ckCellDef="isActive" let-row>
        <span class="badge" [class.bg-success]="row.isActive" [class.bg-secondary]="!row.isActive">
          {{ row.isActive ? ('COMMON.ACTIVE' | translate) : ('COMMON.INACTIVE' | translate) }}
        </span>
      </ng-template>
    </ck-table>
  </ck-card>

</div>
    `,
    styles: [`
      .doctor-color-dot {
        display: inline-block;
        width: 18px; height: 18px;
        border-radius: 50%;
        border: 2px solid rgba(0,0,0,.15);
        vertical-align: middle;
      }
    `],
})
export class DoctorsListComponent implements OnInit {
    readonly router       = inject(Router);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly svc  = inject(DoctorsService);
    private readonly toast = inject(ToastService);
    private readonly dialog = inject(DialogService);

    doctors  = signal<Doctor[]>([]);
    loading  = signal(false);

    colDefs: CkColumnDef[] = [
        { key: 'color',           label: 'DOCTORS.COLOR',       sortable: false },
        { key: 'fullName',        label: 'DOCTORS.FULL_NAME',   sortable: true  },
        { key: 'specialty',       label: 'DOCTORS.SPECIALTY',   sortable: false },
        { key: 'phone',           label: 'DOCTORS.PHONE',       sortable: false },
        { key: 'consultationFee', label: 'DOCTORS.FEE',         sortable: false },
        { key: 'isActive',        label: 'DOCTORS.STATUS',      sortable: false },
    ];

    readonly actions: CkTableAction<Doctor>[] = [
        {
            label: 'COMMON.EDIT',
            icon:  'edit',
            click: (row) => this.router.navigate(['/doctors', row.id, 'edit']),
        },
        {
            label:   'DOCTORS.DEACTIVATE',
            icon:    'person_off',
            danger:  true,
            visible: (row) => row.isActive,
            click:   (row) => this.deactivate(row),
        },
    ];

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.loading.set(true);
        // Load all doctors (active + inactive) for the management list
        this.svc.list(false).subscribe({
            next:  (data) => { this.doctors.set(data); this.loading.set(false); },
            error: ()     => { this.loading.set(false); },
        });
    }

    deactivate(row: Doctor): void {
        this.dialog.confirm({
            title:   'DOCTORS.DEACTIVATE_CONFIRM_TITLE',
            message: 'DOCTORS.DEACTIVATE_CONFIRM_MESSAGE',
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.svc.deactivate(row.id).subscribe(() => {
                this.toast.success('DOCTORS.DEACTIVATED');
                this.load();
            });
        });
    }
}

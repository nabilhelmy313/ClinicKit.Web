import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatSelectModule }    from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { DoctorsService }  from '../../../core/services/doctors.service';
import { UsersService }    from '../../../core/services/users.service';
import { ToastService }    from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import { DoctorColorPalette } from '../../../core/models/doctor.model';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import {
    CkPageHeaderComponent, CkCardComponent,
    CkBtnComponent, CkFormActionsComponent,
} from '../../../shared/index';

@Component({
    selector: 'app-doctor-form',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkFormActionsComponent,
    ],
    template: `
<div [dir]="langService.isRTL() ? 'rtl' : 'ltr'"
     [class.component-dark-theme]="themeService.isDark()">

  <ck-page-header
    [title]="isEdit ? 'DOCTORS.EDIT' : 'DOCTORS.ADD'"
    icon="medical_services">
    <ck-btn variant="outline" icon="arrow_back" (click)="router.navigate(['/doctors'])">
      {{ 'COMMON.BACK' | translate }}
    </ck-btn>
  </ck-page-header>

  <ck-card>
    <form [formGroup]="form" (ngSubmit)="submit()">

      <!-- User account (create only) -->
      @if (!isEdit) {
        <mat-form-field class="w-100 mb-15">
          <mat-label>{{ 'DOCTORS.USER_ACCOUNT' | translate }}</mat-label>
          <mat-select formControlName="userId">
            @for (u of users(); track u.id) {
              <mat-option [value]="u.id">{{ u.email }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <!-- Full name -->
      <mat-form-field class="w-100 mb-15">
        <mat-label>{{ 'DOCTORS.FULL_NAME' | translate }}</mat-label>
        <input matInput formControlName="fullName" />
      </mat-form-field>

      <!-- Specialty -->
      <mat-form-field class="w-100 mb-15">
        <mat-label>{{ 'DOCTORS.SPECIALTY' | translate }}</mat-label>
        <input matInput formControlName="specialty" />
      </mat-form-field>

      <!-- Phone -->
      <mat-form-field class="w-100 mb-15">
        <mat-label>{{ 'DOCTORS.PHONE' | translate }}</mat-label>
        <input matInput formControlName="phone" />
      </mat-form-field>

      <!-- Consultation fee -->
      <mat-form-field class="w-100 mb-15">
        <mat-label>{{ 'DOCTORS.FEE' | translate }}</mat-label>
        <input matInput type="number" formControlName="consultationFee" min="0" />
        <span matSuffix>EGP</span>
      </mat-form-field>

      <!-- Colour picker -->
      <div class="mb-20">
        <label class="form-label">{{ 'DOCTORS.COLOR' | translate }}</label>
        <div class="d-flex gap-10 flex-wrap mt-8">
          @for (c of colorPalette; track c) {
            <button type="button" class="color-btn"
              [style.background]="c"
              [class.selected]="form.value.color === c"
              (click)="form.patchValue({ color: c })">
            </button>
          }
        </div>
      </div>

      <ck-form-actions
        [loading]="submitting()"
        [saveLabel]="isEdit ? 'COMMON.SAVE' : 'DOCTORS.ADD'"
        (cancel)="router.navigate(['/doctors'])">
      </ck-form-actions>

    </form>
  </ck-card>

</div>
    `,
    styles: [`
      .color-btn {
        width: 32px; height: 32px;
        border-radius: 50%;
        border: 3px solid transparent;
        cursor: pointer;
        transition: border-color .2s;
        &.selected { border-color: #000; }
      }
    `],
})
export class DoctorFormComponent implements OnInit {
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    readonly router       = inject(Router);
    private readonly route      = inject(ActivatedRoute);
    private readonly svc        = inject(DoctorsService);
    private readonly usersSvc   = inject(UsersService);
    private readonly toast      = inject(ToastService);
    private readonly fb         = inject(FormBuilder);

    isEdit     = false;
    doctorId   = '';
    submitting = signal(false);
    users      = signal<{ id: string; email: string }[]>([]);

    readonly colorPalette = DoctorColorPalette;

    form = this.fb.group({
        userId:          ['', Validators.required],
        fullName:        ['', [Validators.required, Validators.maxLength(200)]],
        specialty:       ['', Validators.maxLength(200)],
        phone:           ['', Validators.maxLength(20)],
        consultationFee: [0, [Validators.required, Validators.min(0)]],
        color:           ['#0D5238', Validators.required],
    });

    ngOnInit(): void {
        this.doctorId = this.route.snapshot.paramMap.get('id') ?? '';
        this.isEdit   = !!this.doctorId;

        if (!this.isEdit) {
            // Load users with Doctor role for the user selector
            this.usersSvc.list().subscribe({
                next: (data) => this.users.set(
                    data.items.filter(u => u.role === 'Doctor')
                ),
            });
        } else {
            this.svc.getById(this.doctorId).subscribe({
                next: (d) => {
                    this.form.patchValue({
                        userId: d.userId, fullName: d.fullName,
                        specialty: d.specialty, phone: d.phone,
                        consultationFee: d.consultationFee, color: d.color,
                    });
                    this.form.get('userId')?.disable(); // userId not editable
                },
            });
        }
    }

    submit(): void {
        if (this.form.invalid) return;
        this.submitting.set(true);
        const val = this.form.getRawValue();

        const body = {
            userId:          val.userId ?? '',
            fullName:        val.fullName ?? '',
            specialty:       val.specialty || null,
            phone:           val.phone || null,
            color:           val.color ?? '#0D5238',
            consultationFee: val.consultationFee ?? 0,
            workStart:       null,
            workEnd:         null,
            workingDays:     null,
        };

        const req = this.isEdit
            ? this.svc.update(this.doctorId, body)
            : this.svc.create(body);

        req.subscribe({
            next: () => {
                this.toast.success(this.isEdit ? 'DOCTORS.UPDATED' : 'DOCTORS.CREATED');
                this.router.navigate(['/doctors']);
            },
            error: () => this.submitting.set(false),
        });
    }
}

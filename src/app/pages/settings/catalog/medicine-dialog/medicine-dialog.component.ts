import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LanguageService } from '../../../../core/services/language.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { CkBtnComponent } from '../../../../shared';
import { MedicineItem } from '../../../../core/models/catalog.model';

export interface MedicineDialogData { item?: MedicineItem; }

@Component({
  selector: 'app-medicine-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    TranslatePipe, CkBtnComponent,
  ],
  template: `
    <div [dir]="lang.isRTL() ? 'rtl' : 'ltr'" class="ck-dialog">

      <!-- Header -->
      <div class="ck-dialog__header">
        <div class="ck-dialog__icon-wrap">
          <span class="material-symbols-outlined">medication</span>
        </div>
        <h2 class="ck-dialog__title">
          {{ (data.item ? 'CATALOG.EDIT_MEDICINE' : 'CATALOG.ADD_MEDICINE') | translate }}
        </h2>
      </div>

      <!-- Body -->
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="ck-dialog__body">

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>{{ 'CATALOG.MEDICINE_NAME' | translate }}</mat-label>
            <input matInput formControlName="name" />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <mat-error>{{ 'ERRORS.REQUIRED' | translate }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100 mb-15">
            <mat-label>{{ 'CATALOG.NAME_EN' | translate }}</mat-label>
            <input matInput formControlName="nameEn" dir="ltr" placeholder="e.g. Panadol 500mg" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>{{ 'CATALOG.DEFAULT_DOSAGE' | translate }}</mat-label>
            <input matInput formControlName="defaultDosage"
                   [placeholder]="'COMMON.OPTIONAL' | translate" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>{{ 'CATALOG.DEFAULT_FREQUENCY' | translate }}</mat-label>
            <input matInput formControlName="defaultFrequency"
                   [placeholder]="'COMMON.OPTIONAL' | translate" />
          </mat-form-field>

        </div>

        <!-- Actions -->
        <div class="ck-dialog__actions">
          <ck-btn variant="outline" type="button" (clicked)="dialogRef.close()">
            {{ 'COMMON.CANCEL' | translate }}
          </ck-btn>
          <ck-btn variant="primary" type="submit" [loading]="saving()">
            {{ 'COMMON.SAVE' | translate }}
          </ck-btn>
        </div>
      </form>
    </div>
  `,
})
export class MedicineDialogComponent {
  readonly data      = inject<MedicineDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<MedicineDialogComponent>);
  readonly lang      = inject(LanguageService);
  private readonly svc   = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  saving = signal(false);

  form = this.fb.group({
    name:             [this.data.item?.name ?? '',              [Validators.required, Validators.maxLength(200)]],
    nameEn:           [this.data.item?.nameEn ?? '',            [Validators.maxLength(200)]],
    defaultDosage:    [this.data.item?.defaultDosage ?? ''],
    defaultFrequency: [this.data.item?.defaultFrequency ?? ''],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const body = {
      name:             this.form.value.name!,
      nameEn:           this.form.value.nameEn || undefined,
      defaultDosage:    this.form.value.defaultDosage || undefined,
      defaultFrequency: this.form.value.defaultFrequency || undefined,
    };

    const op$ = this.data.item
      ? this.svc.updateMedicine(this.data.item.id, body)
      : this.svc.createMedicine(body);

    op$.subscribe({
      next: result => {
        this.saving.set(false);
        this.dialogRef.close(result);
      },
      error: () => this.saving.set(false),
    });
  }
}

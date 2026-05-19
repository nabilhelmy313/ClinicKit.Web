import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LanguageService } from '../../../../core/services/language.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { CkBtnComponent } from '../../../../shared';
import { ServiceItem } from '../../../../core/models/catalog.model';

export interface ServiceDialogData { item?: ServiceItem; }

@Component({
  selector: 'app-service-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    TranslatePipe, CkBtnComponent,
  ],
  template: `
    <div [dir]="lang.isRTL() ? 'rtl' : 'ltr'" class="ck-dialog">

      <!-- Header -->
      <div class="ck-dialog__header">
        <div class="ck-dialog__icon-wrap">
          <span class="material-symbols-outlined">medical_services</span>
        </div>
        <h2 class="ck-dialog__title">
          {{ (data.item ? 'CATALOG.EDIT_SERVICE' : 'CATALOG.ADD_SERVICE') | translate }}
        </h2>
      </div>

      <!-- Body -->
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="ck-dialog__body">

          <mat-form-field class="w-100">
            <mat-label>{{ 'CATALOG.SERVICE_NAME' | translate }}</mat-label>
            <input matInput formControlName="name" />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <mat-error>{{ 'ERRORS.REQUIRED' | translate }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="w-100 mb-15">
            <mat-label>{{ 'CATALOG.NAME_EN' | translate }}</mat-label>
            <input matInput formControlName="nameEn" dir="ltr" placeholder="e.g. Medical Examination" />
          </mat-form-field>

          <mat-form-field class="w-100">
            <mat-label>{{ 'CATALOG.CATEGORY' | translate }}</mat-label>
            <mat-select formControlName="category">
              <mat-option [value]="null">— {{ 'COMMON.NONE' | translate }} —</mat-option>
              <mat-option value="كشف">{{ 'CATALOG.CAT_EXAM' | translate }}</mat-option>
              <mat-option value="أشعة">{{ 'CATALOG.CAT_XRAY' | translate }}</mat-option>
              <mat-option value="تحاليل">{{ 'CATALOG.CAT_LAB' | translate }}</mat-option>
              <mat-option value="إجراءات">{{ 'CATALOG.CAT_PROC' | translate }}</mat-option>
              <mat-option value="أخرى">{{ 'CATALOG.CAT_OTHER' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field class="w-100">
            <mat-label>{{ 'CATALOG.DEFAULT_PRICE' | translate }}</mat-label>
            <input matInput type="number" min="1" formControlName="defaultPrice" />
            @if (form.get('defaultPrice')?.invalid && form.get('defaultPrice')?.touched) {
              <mat-error>{{ 'ERRORS.REQUIRED' | translate }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="w-100">
            <mat-label>{{ 'CATALOG.SORT_ORDER' | translate }}</mat-label>
            <input matInput type="number" min="1" formControlName="sortOrder" />
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
export class ServiceDialogComponent {
  readonly data      = inject<ServiceDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ServiceDialogComponent>);
  readonly lang      = inject(LanguageService);
  private readonly svc   = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  saving = signal(false);

  form = this.fb.group({
    name:         [this.data.item?.name ?? '',         [Validators.required, Validators.maxLength(150)]],
    nameEn:       [this.data.item?.nameEn ?? '',       [Validators.maxLength(150)]],
    category:     [this.data.item?.category ?? null],
    defaultPrice: [this.data.item?.defaultPrice ?? 1,  [Validators.required, Validators.min(1)]],
    sortOrder:    [this.data.item?.sortOrder ?? 1,     [Validators.required, Validators.min(1)]],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const body = {
      name:         this.form.value.name!,
      nameEn:       this.form.value.nameEn || undefined,
      category:     this.form.value.category ?? undefined,
      defaultPrice: this.form.value.defaultPrice!,
      sortOrder:    this.form.value.sortOrder!,
    };

    const op$ = this.data.item
      ? this.svc.updateService(this.data.item.id, body)
      : this.svc.createService(body);

    op$.subscribe({
      next: result => {
        this.saving.set(false);
        this.dialogRef.close(result);
      },
      error: () => this.saving.set(false),
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../../../core/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { CkBtnComponent } from '../../../../shared';

export interface ResetPasswordDialogData { userId: string; userEmail: string; }

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, TranslatePipe, CkBtnComponent,
  ],
  template: `
    <div [dir]="lang.isRTL() ? 'rtl' : 'ltr'" class="ck-dialog">

      <!-- Header -->
      <div class="ck-dialog__header">
        <div class="ck-dialog__icon-wrap">
          <span class="material-icons">lock_reset</span>
        </div>
        <h2 class="ck-dialog__title">{{ 'USERS.RESET_PASSWORD' | translate }}</h2>
        <p class="ck-dialog__subtitle">{{ data.userEmail }}</p>
      </div>

      <!-- Body -->
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="ck-dialog__body">

          <mat-form-field class="w-100">
            <mat-label>{{ 'USERS.NEW_PASSWORD' | translate }}</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput [type]="showNew() ? 'text' : 'password'" formControlName="newPassword" />
            <button mat-icon-button matSuffix type="button" (click)="showNew.set(!showNew())">
              <mat-icon>{{ showNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) {
              <mat-error>{{ 'ERRORS.MIN_LENGTH' | translate:{ length: form.get('newPassword')?.errors?.['minlength']?.requiredLength ?? 6 } }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="w-100">
            <mat-label>{{ 'USERS.CONFIRM_PASSWORD' | translate }}</mat-label>
            <mat-icon matPrefix>lock_outline</mat-icon>
            <input matInput [type]="showConfirm() ? 'text' : 'password'" formControlName="confirmPassword" />
            <button mat-icon-button matSuffix type="button" (click)="showConfirm.set(!showConfirm())">
              <mat-icon>{{ showConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
              <mat-error>{{ 'USERS.PASSWORDS_NOT_MATCH' | translate }}</mat-error>
            }
          </mat-form-field>

          <p class="ck-dialog__hint">
            <span class="material-icons">info</span>
            {{ 'USERS.PASSWORD_HINT' | translate }}
          </p>
        </div>

        <!-- Actions -->
        <div class="ck-dialog__actions">
          <ck-btn variant="outline" type="button" (clicked)="dialogRef.close()">
            {{ 'COMMON.CANCEL' | translate }}
          </ck-btn>
          <ck-btn variant="primary" type="submit" [loading]="saving()">
            {{ 'USERS.RESET_PASSWORD' | translate }}
          </ck-btn>
        </div>
      </form>
    </div>
  `,
})
export class ResetPasswordDialogComponent {
  readonly data      = inject<ResetPasswordDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);
  readonly lang      = inject(LanguageService);
  private  readonly svc   = inject(UsersService);
  private  readonly toast = inject(ToastService);
  private  readonly fb    = inject(FormBuilder);

  saving      = signal(false);
  showNew     = signal(false);
  showConfirm = signal(false);

  form = this.fb.group(
    {
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: g => g.value.newPassword !== g.value.confirmPassword ? { mismatch: true } : null }
  );

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.svc.resetPassword(this.data.userId, { newPassword: this.form.value.newPassword! }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.lang.translate('USERS.PASSWORD_RESET_SUCCESS'));
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }
}

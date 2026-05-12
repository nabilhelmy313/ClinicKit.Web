import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UsersService } from '../../../../core/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ROLES, RoleLabels, RoleType } from '../../../../core/models/user.model';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import {
  CkPageHeaderComponent, CkCardComponent,
  CkBtnComponent, CkFormActionsComponent,
} from '../../../../shared/index';

@Component({
  selector: 'app-user-form',
  standalone: true,
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    TranslatePipe,
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkFormActionsComponent,
  ],
})
export class UserFormComponent implements OnInit {
  readonly langService  = inject(LanguageService);
  readonly themeService = inject(ThemeService);
  private readonly svc   = inject(UsersService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly fb     = inject(FormBuilder);

  isEdit     = false;
  userId     = '';
  formReady  = signal(false);
  submitting = signal(false);

  readonly roles      = ROLES;
  readonly roleLabels = RoleLabels;

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role:     ['' as RoleType, Validators.required],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.userId) {
      this.isEdit = true;
      this.f['email'].disable();
      this.f['password'].clearValidators();
      this.f['password'].updateValueAndValidity();
      this.loadUser();
    } else {
      this.formReady.set(true);
    }
  }

  private loadUser(): void {
    this.svc.getById(this.userId).subscribe({
      next: u => {
        this.form.patchValue({ email: u.email, role: u.role as RoleType });
        this.formReady.set(true);
      },
      error: () => this.router.navigate(['/settings/users']),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);

    const req$ = this.isEdit
      ? this.svc.updateRole(this.userId, { newRole: this.f['role'].value! })
      : this.svc.create({
          email:    this.f['email'].value!,
          password: this.f['password'].value!,
          role:     this.f['role'].value!,
        });

    req$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success(this.langService.translate(
          this.isEdit ? 'USERS.UPDATED_SUCCESS' : 'USERS.CREATED_SUCCESS'
        ));
        this.router.navigate(['/settings/users']);
      },
      error: () => this.submitting.set(false),
    });
  }

  cancel(): void { this.router.navigate(['/settings/users']); }
}

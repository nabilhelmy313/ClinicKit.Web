import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AppUser, RoleLabels, RoleType } from '../../../core/models/user.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
  CkTableComponent, CkCellDefDirective, CkStatusBadgeComponent,
} from '../../../shared/index';
import type { CkColumnDef, CkTableAction, CkSortChange } from '../../../shared/index';
import { ResetPasswordDialogComponent } from './reset-password-dialog/reset-password-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
  imports: [
    CommonModule, TranslatePipe,
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
    CkTableComponent, CkCellDefDirective, CkStatusBadgeComponent,
  ],
})
export class UserManagementComponent implements OnInit {
  readonly router       = inject(Router);
  readonly langService  = inject(LanguageService);
  readonly themeService = inject(ThemeService);
  private readonly svc    = inject(UsersService);
  private readonly toast  = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  users      = signal<AppUser[]>([]);
  totalCount = signal(0);
  page       = signal(1);
  pageSize   = signal(20);
  loading    = signal(false);

  private _search = signal<string | undefined>(undefined);

  readonly roleLabels = RoleLabels;

  colDefs: CkColumnDef[] = [
    { key: 'email',    label: 'USERS.EMAIL',  sortable: true, searchable: true, filterType: 'text' },
    { key: 'role',     label: 'USERS.ROLE',   sortable: false },
    { key: 'isActive', label: 'USERS.STATUS', sortable: false },
  ];

  tableActions: CkTableAction<AppUser>[] = [
    {
      icon: 'manage_accounts',
      label: 'USERS.EDIT_SUBTITLE',
      inline: true,
      click: u => this.router.navigate(['/settings/users', u.id, 'edit']),
    },
    {
      icon: 'lock_reset',
      label: 'USERS.RESET_PASSWORD',
      inline: true,
      click: u => this.openResetPassword(u),
    },
    {
      icon: 'toggle_on',
      label: 'USERS.TOGGLE',
      inline: false,
      click: u => this.toggleUser(u, !u.isActive),
    },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list({
      search:   this._search(),
      page:     this.page(),
      pageSize: this.pageSize(),
    }).subscribe({
      next: res => {
        this.users.set(res.items);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(filters: Record<string, string>): void {
    this._search.set(filters['email'] || undefined);
    this.page.set(1);
    this.load();
  }

  onSortChange(_sort: CkSortChange): void { this.load(); }

  prevPage(): void     { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void     { this.page.update(p => p + 1); this.load(); }
  onPageSizeChange(s: number): void { this.pageSize.set(s); this.page.set(1); this.load(); }

  roleLabel(role: string): string {
    const key = this.roleLabels[role as RoleType];
    return key ? this.langService.translate(key) : role;
  }

  openResetPassword(user: AppUser): void {
    this.dialog.open(ResetPasswordDialogComponent, {
      width:      '440px',
      maxWidth:   '95vw',
      panelClass: 'ck-dialog-panel',
      direction:  this.langService.isRTL() ? 'rtl' : 'ltr',
      data:       { userId: user.id, userEmail: user.email },
    });
  }

  toggleUser(user: AppUser, active: boolean): void {
    this.svc.toggle(user.id, active).subscribe({
      next: () => {
        this.toast.success(this.langService.translate(
          active ? 'USERS.TOGGLE_ACTIVE_SUCCESS' : 'USERS.TOGGLE_INACTIVE_SUCCESS'
        ));
        this.load();
      },
    });
  }
}

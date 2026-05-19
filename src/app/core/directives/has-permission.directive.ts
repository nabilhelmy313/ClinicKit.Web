import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive — renders its host only when the current user holds
 * at least one of the specified permission(s). Admin role bypasses the check.
 *
 * Usage:
 *   *appHasPermission="'Invoices.Print'"
 *   *appHasPermission="['Invoices.Edit', 'Invoices.Create']"
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly vcr         = inject(ViewContainerRef);
  private readonly auth        = inject(AuthService);

  private _permissions: string[] = [];

  @Input() set appHasPermission(value: string | string[]) {
    this._permissions = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.auth.currentUser();
      this.updateView();
    });
  }

  private updateView(): void {
    const user    = this.auth.currentUser();
    const isAdmin = user?.roles.includes('Admin') ?? false;
    const hasPerm = isAdmin ||
      (user?.permissions.some(p => this._permissions.includes(p)) ?? false);

    if (hasPerm) {
      if (this.vcr.length === 0) this.vcr.createEmbeddedView(this.templateRef);
    } else {
      this.vcr.clear();
    }
  }
}

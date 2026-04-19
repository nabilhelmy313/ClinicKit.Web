import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private _roles: string[] = [];

  @Input() set appHasRole(value: string | string[]) {
    this._roles = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authService.currentUser();
      this.updateView();
    });
  }

  private updateView(): void {
    const user = this.authService.currentUser();
    const hasRole = user?.roles.some(r => this._roles.includes(r)) ?? false;
    if (hasRole) {
      if (this.vcr.length === 0) this.vcr.createEmbeddedView(this.templateRef);
    } else {
      this.vcr.clear();
    }
  }
}

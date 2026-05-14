import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { TenantConfigService } from '../services/tenant-config.service';

/**
 * Structural directive — shows the element only when the given feature flag
 * is enabled in TenantConfig.
 *
 * Usage:
 *   <ck-btn *appHasFeature="'multiDoctorEnabled'">إضافة دكتور</ck-btn>
 *   <mat-tab *appHasFeature="'vitalsEnabled'" label="Vitals">…</mat-tab>
 *
 * If the flag is false or the config isn't loaded yet, the element is removed
 * from the DOM (not just hidden with CSS).
 */
@Directive({
  selector: '[appHasFeature]',
  standalone: true,
})
export class HasFeatureDirective {
  private readonly templateRef    = inject(TemplateRef<unknown>);
  private readonly vcr            = inject(ViewContainerRef);
  private readonly tenantConfig   = inject(TenantConfigService);

  private _feature: string = '';

  @Input() set appHasFeature(feature: string) {
    this._feature = feature;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate whenever the config signal changes (after API call completes)
      this.tenantConfig.config();
      this.updateView();
    });
  }

  private updateView(): void {
    const enabled = this.tenantConfig.isEnabled(this._feature);
    if (enabled) {
      if (this.vcr.length === 0) this.vcr.createEmbeddedView(this.templateRef);
    } else {
      this.vcr.clear();
    }
  }
}

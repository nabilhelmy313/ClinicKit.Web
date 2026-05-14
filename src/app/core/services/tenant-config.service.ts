import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { TenantConfig } from '../models/tenant-config.model';

/**
 * Loads the current tenant's configuration (including feature flags) once on startup
 * and exposes it as a reactive signal.
 *
 * Feature flags control which UI sections are visible:
 *   multiDoctorEnabled → show Doctors module in sidebar + appointment doctor selector
 *   vitalsEnabled      → show Vitals tab in patient file
 *   reportsEnabled     → show Reports in sidebar
 *   etc.
 *
 * Usage:
 *   tenantConfigService.isEnabled('multiDoctorEnabled')   // → boolean
 *   *appHasFeature="'vitalsEnabled'"                      // in templates
 */
@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private readonly api = inject(ApiService);

  readonly config = signal<TenantConfig | null>(null);

  /** Load config from API. Called once after login (when config is null). */
  load(): void {
    this.api.get<TenantConfig>('/api/settings/config').subscribe({
      next: (cfg) => this.config.set(cfg),
      error: ()   => { /* config stays null — all feature flags default to false */ },
    });
  }

  /** Clear config on logout so the next user gets a fresh load. */
  clear(): void {
    this.config.set(null);
  }

  /**
   * Returns true if the given feature flag is enabled.
   * If config isn't loaded yet, returns false (safe default — hide features).
   */
  isEnabled(flag: string): boolean {
    const cfg = this.config();
    if (!cfg) return false;
    return (cfg as unknown as Record<string, unknown>)[flag] === true;
  }

  // ── Convenience getters (typed) ────────────────────────────────────────────

  get multiDoctorEnabled():  boolean { return this.isEnabled('multiDoctorEnabled');  }
  get vitalsEnabled():       boolean { return this.isEnabled('vitalsEnabled');       }
  get reportsEnabled():      boolean { return this.isEnabled('reportsEnabled');      }
  get whatsAppEnabled():     boolean { return this.isEnabled('whatsAppEnabled');     }
  get cloudBackupEnabled():  boolean { return this.isEnabled('cloudBackupEnabled');  }
  get onlineBookingEnabled(): boolean { return this.isEnabled('onlineBookingEnabled'); }
  get insuranceEnabled():    boolean { return this.isEnabled('insuranceEnabled');    }
  get eReceiptEnabled():     boolean { return this.isEnabled('eReceiptEnabled');     }
  get analyticsEnabled():    boolean { return this.isEnabled('analyticsEnabled');    }
  get clinicName():          string  { return this.config()?.clinicName ?? '';      }
}

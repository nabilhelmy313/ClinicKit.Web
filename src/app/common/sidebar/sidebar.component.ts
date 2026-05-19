import { Component, inject, computed } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink, RouterLinkActive, RouterModule, Router, NavigationEnd } from '@angular/router';
import { ToggleService } from './toggle.service';
import { NgClass } from '@angular/common';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantConfigService } from '../../core/services/tenant-config.service';
import { HasFeatureDirective } from '../../core/directives/has-feature.directive';

@Component({
    selector: 'app-sidebar',
    imports: [NgScrollbarModule, MatExpansionModule, RouterLinkActive, RouterModule, RouterLink, NgClass, TranslatePipe, HasFeatureDirective],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

    readonly langService    = inject(LanguageService);
    readonly tenantConfig   = inject(TenantConfigService);
    private readonly auth   = inject(AuthService);

    // Role helpers — computed from the JWT signal, reactive to login/logout
    readonly isSystemAdmin  = computed(() => this.auth.currentUser()?.roles.includes('SystemAdmin')  ?? false);
    readonly isAdmin        = computed(() => this.auth.currentUser()?.roles.includes('Admin')        ?? false);
    readonly isDoctor       = computed(() => this.auth.currentUser()?.roles.includes('Doctor')       ?? false);
    readonly isReceptionist = computed(() => this.auth.currentUser()?.roles.includes('Receptionist') ?? false);
    readonly isAccountant   = computed(() => this.auth.currentUser()?.roles.includes('Accountant')   ?? false);
    readonly isPharmacist   = computed(() => this.auth.currentUser()?.roles.includes('Pharmacist')   ?? false);

    /** true for Admin OR Receptionist */
    readonly isAdminOrReceptionist = computed(() => this.isAdmin() || this.isReceptionist());
    /** true for Admin OR Doctor */
    readonly isAdminOrDoctor       = computed(() => this.isAdmin() || this.isDoctor());

    // Finance section visibility
    /** Billing (Invoices): Admin, Receptionist, Accountant */
    readonly canViewBilling   = computed(() => this.isAdmin() || this.isReceptionist() || this.isAccountant());
    /** Purchases: Admin, Pharmacist */
    readonly canViewPurchases = computed(() => this.isAdmin() || this.isPharmacist());
    /** Show Finance section header when at least one sub-section is visible */
    readonly canViewFinance   = computed(() => this.canViewBilling() || this.canViewPurchases());
    /** Reports: Admin, Accountant */
    readonly canViewReports   = computed(() => this.isAdmin() || this.isAccountant());

    // isSidebarToggled
    isSidebarToggled = false;

    // isToggled
    isToggled = false;

    constructor(
        private toggleService: ToggleService,
        public themeService: CustomizerSettingsService,
        private router: Router
    ) {
        this.toggleService.isSidebarToggled$.subscribe(isSidebarToggled => {
            this.isSidebarToggled = isSidebarToggled;
        });
        this.themeService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });
        this.router.events.subscribe(e => {
            if (e instanceof NavigationEnd && window.innerWidth < 1200) {
                this.toggleService.close();
            }
        });
    }

    // Burger Menu Toggle
    toggle() {
        this.toggleService.toggle();
    }

    // Mat Expansion
    panelOpenState = false;

}
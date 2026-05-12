import { Component, inject, computed } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { ToggleService } from './toggle.service';
import { NgClass } from '@angular/common';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-sidebar',
    imports: [NgScrollbarModule, MatExpansionModule, RouterLinkActive, RouterModule, RouterLink, NgClass, TranslatePipe],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

    readonly langService  = inject(LanguageService);
    private readonly auth = inject(AuthService);

    // Role helpers — computed from the JWT signal, reactive to login/logout
    readonly isAdmin        = computed(() => this.auth.currentUser()?.roles.includes('Admin')        ?? false);
    readonly isDoctor       = computed(() => this.auth.currentUser()?.roles.includes('Doctor')       ?? false);
    readonly isReceptionist = computed(() => this.auth.currentUser()?.roles.includes('Receptionist') ?? false);

    /** true for Admin OR Receptionist */
    readonly isAdminOrReceptionist = computed(() => this.isAdmin() || this.isReceptionist());
    /** true for Admin OR Doctor */
    readonly isAdminOrDoctor       = computed(() => this.isAdmin() || this.isDoctor());

    // isSidebarToggled
    isSidebarToggled = false;

    // isToggled
    isToggled = false;

    constructor(
        private toggleService: ToggleService,
        public themeService: CustomizerSettingsService
    ) {
        this.toggleService.isSidebarToggled$.subscribe(isSidebarToggled => {
            this.isSidebarToggled = isSidebarToggled;
        });
        this.themeService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });
    }

    // Burger Menu Toggle
    toggle() {
        this.toggleService.toggle();
    }

    // Mat Expansion
    panelOpenState = false;

}
import { NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { Component, HostListener, computed, inject } from '@angular/core';
import { ToggleService } from '../sidebar/toggle.service';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
    selector: 'app-header',
    imports: [NgClass, MatMenuModule, MatButtonModule, RouterLink, TranslatePipe],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {

    readonly langService  = inject(LanguageService);
    readonly authService  = inject(AuthService);

    // Maps the first role in the JWT to its i18n translation key
    private static readonly ROLE_KEY_MAP: Record<string, string> = {
        Admin:        'USERS.ROLE_ADMIN',
        Doctor:       'USERS.ROLE_DOCTOR',
        Receptionist: 'USERS.ROLE_RECEPTIONIST',
    };

    readonly roleLabel = computed(() => {
        const role = this.authService.currentUser()?.roles?.[0];
        return role
            ? (HeaderComponent.ROLE_KEY_MAP[role] ?? role)
            : 'COMMON.ADMINISTRATOR';
    });

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

    // Navbar Sticky
    isSticky: boolean = false;
    @HostListener('window:scroll')
    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollPosition >= 50) {
            this.isSticky = true;
        } else {
            this.isSticky = false;
        }
    }

    // Dark Mode
    toggleTheme() {
        this.themeService.toggleTheme();
    }

    logout() {
        this.authService.logout();
    }

}
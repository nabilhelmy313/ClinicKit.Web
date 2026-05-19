import { Component, HostListener, computed, inject } from '@angular/core';
import { NgClass }          from '@angular/common';
import { RouterLink }       from '@angular/router';
import { MatMenuModule }    from '@angular/material/menu';
import { MatButtonModule }  from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ToggleService }              from '../sidebar/toggle.service';
import { CustomizerSettingsService }  from '../../customizer-settings/customizer-settings.service';
import { LanguageService }            from '../../core/services/language.service';
import { AuthService }                from '../../core/services/auth.service';
import { TranslatePipe }              from '../../core/pipes/translate.pipe';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [NgClass, MatMenuModule, MatButtonModule, MatTooltipModule, RouterLink, TranslatePipe],
    templateUrl: './header.component.html',
    styleUrl:    './header.component.scss',
})
export class HeaderComponent {

    readonly langService  = inject(LanguageService);
    readonly authService  = inject(AuthService);
    readonly themeService = inject(CustomizerSettingsService);

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

    /** Display name: uses the part before @ in the email, dots/underscores → spaces, title-cased */
    readonly displayName = computed(() => {
        const user = this.authService.currentUser();
        if (!user?.email) return this.langService.translate('COMMON.ADMINISTRATOR');
        return user.email
            .split('@')[0]
            .replace(/[._\-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    });

    /** Label shown on the lang button — the language you'd switch TO */
    readonly langSwitchLabel = computed(() =>
        this.langService.lang() === 'ar' ? 'EN' : 'عر'
    );

    readonly langSwitchTooltip = computed(() =>
        this.langService.lang() === 'ar' ? 'TOPBAR.SWITCH_TO_EN' : 'TOPBAR.SWITCH_TO_AR'
    );

    // ── Sidebar state ─────────────────────────────────────────────────────────
    isSidebarToggled = false;
    isToggled        = false;

    constructor(
        private toggleService: ToggleService,
    ) {
        this.toggleService.isSidebarToggled$.subscribe(v => this.isSidebarToggled = v);
        this.themeService.isToggled$.subscribe(v => this.isToggled = v);
    }

    toggle(): void { this.toggleService.toggle(); }

    // ── Sticky ────────────────────────────────────────────────────────────────
    isSticky = false;
    @HostListener('window:scroll')
    checkScroll(): void {
        this.isSticky = (window.scrollY || document.documentElement.scrollTop || 0) >= 50;
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    toggleTheme(): void { this.themeService.toggleTheme(); }

    toggleLang(): void {
        this.langService.switchLanguage(this.langService.lang() === 'ar' ? 'en' : 'ar');
    }

    logout(): void { this.authService.logout(); }
}

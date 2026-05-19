import { Component, inject, signal, effect } from '@angular/core';
import { ToggleService } from './common/sidebar/toggle.service';
import { HeaderComponent } from './common/header/header.component';
import { FooterComponent } from './common/footer/footer.component';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { BottomNavComponent } from './common/bottom-nav/bottom-nav.component';
import { CommonModule, NgClass, ViewportScroller } from '@angular/common';
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';
import { CustomizerSettingsService } from './customizer-settings/customizer-settings.service';
import { LanguageService } from './core/services/language.service';
import { TenantConfigService } from './core/services/tenant-config.service';
import { AuthService } from './core/services/auth.service';
import { DateAdapter } from '@angular/material/core';

const PUBLIC_ROUTE_PREFIXES = ['/authentication', '/queue-display'];

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, CommonModule, SidebarComponent, HeaderComponent, FooterComponent, BottomNavComponent, NgClass],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {

    protected readonly title = signal('طَبَّبَ — Clinic Management');
    readonly langService      = inject(LanguageService);
    private readonly auth     = inject(AuthService);
    private readonly tenantConfig = inject(TenantConfigService);
    private readonly dateAdapter  = inject(DateAdapter);

    // Switch datepicker calendar locale when the app language changes.
    // 'ar-u-nu-latn' = Arabic month/day names + Western (Latin) numerals.
    private readonly _localeEffect = effect(() => {
        this.dateAdapter.setLocale(
            this.langService.isRTL() ? 'ar-EG-u-nu-latn' : 'en-GB',
        );
    });

    isSidebarToggled = false;
    isPublicRoute = signal(false);

    private previousUrl: string | null = null;

    constructor(
        public router: Router,
        public toggleService: ToggleService,
        private viewportScroller: ViewportScroller,
        public themeService: CustomizerSettingsService
    ) {
        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                const currentUrl = event.urlAfterRedirects;
                this.isPublicRoute.set(
                    PUBLIC_ROUTE_PREFIXES.some(p => currentUrl.startsWith(p))
                );
                if (this.previousUrl && this.previousUrl !== currentUrl) {
                    this.viewportScroller.scrollToPosition([0, 0]);
                }
                this.previousUrl = currentUrl;
                // Load tenant config once — only if authenticated AND not yet loaded
                if (this.auth.isAuthenticated() && !this.tenantConfig.config()) {
                    this.tenantConfig.load();
                }
            }
        });
        this.toggleService.isSidebarToggled$.subscribe(isSidebarToggled => {
            this.isSidebarToggled = isSidebarToggled;
        });
    }

}
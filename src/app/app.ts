import { Component, inject, signal } from '@angular/core';
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
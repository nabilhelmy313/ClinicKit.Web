import { Component, inject, signal } from '@angular/core';
import { ToggleService } from './common/sidebar/toggle.service';
import { HeaderComponent } from './common/header/header.component';
import { FooterComponent } from './common/footer/footer.component';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { CommonModule, NgClass, ViewportScroller } from '@angular/common';
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';
import { CustomizerSettingsService } from './customizer-settings/customizer-settings.service';
import { LanguageService } from './core/services/language.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, CommonModule, SidebarComponent, HeaderComponent, FooterComponent, NgClass],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {

    protected readonly title = signal('Daxa - Angular 20 Material Design Admin Dashboard Template');
    readonly langService = inject(LanguageService);

    // isSidebarToggled
    isSidebarToggled = false;

    private previousUrl: string | null = null;

    constructor(
        public router: Router,
        private toggleService: ToggleService,
        private viewportScroller: ViewportScroller,
        public themeService: CustomizerSettingsService
    ) {
        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                const currentUrl = event.urlAfterRedirects;
                // Scroll to top ONLY if navigating to a different route (not on refresh)
                if (this.previousUrl && this.previousUrl !== currentUrl) {
                    this.viewportScroller.scrollToPosition([0, 0]);
                }
                this.previousUrl = currentUrl;
            }
        });
        this.toggleService.isSidebarToggled$.subscribe(isSidebarToggled => {
            this.isSidebarToggled = isSidebarToggled;
        });
    }

}
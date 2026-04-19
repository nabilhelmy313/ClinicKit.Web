import {
    ApplicationConfig,
    APP_INITIALIZER,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
    provideHttpClient,
    withInterceptors,
    withFetch,
} from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { LanguageService, AppLanguage } from './core/services/language.service';

/**
 * Reads the persisted language from localStorage (or defaults to 'ar'),
 * then loads the matching translation JSON before the first render.
 */
function initLanguage(langService: LanguageService): () => Promise<void> {
    return () => {
        const stored = (typeof localStorage !== 'undefined'
            ? localStorage.getItem('clinickit_lang')
            : null) as AppLanguage | null;
        const initial: AppLanguage = (stored === 'ar' || stored === 'en') ? stored : 'ar';
        return langService.switchLanguage(initial);
    };
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideClientHydration(withEventReplay()),
        provideAnimationsAsync(),
        provideHttpClient(
            withFetch(),
            withInterceptors([jwtInterceptor]),
        ),
        // ── i18n bootstrap: load translations before first render ─────────────
        {
            provide: APP_INITIALIZER,
            useFactory: initLanguage,
            deps: [LanguageService],
            multi: true,
        },
    ],
};

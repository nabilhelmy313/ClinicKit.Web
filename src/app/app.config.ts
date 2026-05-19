import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter }                      from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync }             from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS }     from '@angular/material/form-field';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

import { routes }              from './app.routes';
import { jwtInterceptor }      from './core/interceptors/jwt.interceptor';
import { languageInterceptor } from './core/interceptors/language.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideClientHydration(withEventReplay()),
        provideAnimationsAsync(),
        provideHttpClient(
            withInterceptors([jwtInterceptor, languageInterceptor]),
        ),
        // All form fields: label always above, fill style (no notch/border-cut issue)
        {
            provide:  MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: { floatLabel: 'always', appearance: 'fill', subscriptSizing: 'dynamic' },
        },
        // Register NativeDateAdapter at root so DateAdapter can be injected in App component
        provideNativeDateAdapter(),
        // DD/MM/YYYY with Western numerals — correct for Egyptian clinics
        { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    ],
};

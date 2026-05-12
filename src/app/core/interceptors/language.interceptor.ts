import { HttpInterceptorFn } from '@angular/common/http';
import { inject }            from '@angular/core';
import { LanguageService }   from '../services/language.service';

/**
 * Adds Accept-Language header to every API request so the backend
 * IStringLocalizer returns messages in the user's current language.
 */
export const languageInterceptor: HttpInterceptorFn = (req, next) => {
    const lang = inject(LanguageService);
    return next(req.clone({
        setHeaders: { 'Accept-Language': lang.lang() },
    }));
};

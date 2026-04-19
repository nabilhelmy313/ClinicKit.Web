import {
    Injectable,
    signal,
    computed,
    PLATFORM_ID,
    inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

import arTranslations from '../../../assets/i18n/ar.json';
import enTranslations from '../../../assets/i18n/en.json';

export type AppLanguage = 'ar' | 'en';

const STORAGE_KEY = 'clinickit_lang';
const DEFAULT_LANG: AppLanguage = 'ar';

const TRANSLATIONS: Record<AppLanguage, Record<string, unknown>> = {
    ar: arTranslations as Record<string, unknown>,
    en: enTranslations as Record<string, unknown>,
};

@Injectable({ providedIn: 'root' })
export class LanguageService {

    private readonly platformId = inject(PLATFORM_ID);

    // ── Reactive state ────────────────────────────────────────────────────────
    private readonly _lang         = signal<AppLanguage>(DEFAULT_LANG);
    private _translations          = TRANSLATIONS[DEFAULT_LANG];
    private readonly _cache        = new Map<string, string>();

    /** Current language code ('ar' | 'en'). */
    readonly lang  = this._lang.asReadonly();

    /** True when the current language is RTL (Arabic). */
    readonly isRTL = computed(() => this._lang() === 'ar');

    /** Emits whenever translations change (used by TranslatePipe). */
    private readonly _ready$ = new BehaviorSubject<boolean>(false);
    readonly ready$ = this._ready$.asObservable();

    // ── Bootstrap (synchronous — no HTTP) ─────────────────────────────────────
    constructor() {
        const stored = isPlatformBrowser(this.platformId)
            ? (localStorage.getItem(STORAGE_KEY) as AppLanguage | null)
            : null;
        const initial: AppLanguage = (stored === 'ar' || stored === 'en') ? stored : DEFAULT_LANG;
        this._applyLanguage(initial);
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Switch language at runtime — synchronous, instant. */
    switchLanguage(lang: AppLanguage): void {
        this._applyLanguage(lang);
    }

    /**
     * Translate a dot-notation key, with optional {{param}} interpolation.
     * Results without params are memoized per language to minimise CD overhead.
     *
     * @example translate('ERRORS.MIN_LENGTH', { length: '6' })
     */
    translate(key: string, params?: Record<string, string>): string {
        if (!params) {
            const cached = this._cache.get(key);
            if (cached !== undefined) return cached;
        }

        const value = this._getNestedValue(this._translations, key);
        if (!value) return key;

        if (!params) {
            this._cache.set(key, value);
            return value;
        }

        return Object.keys(params).reduce(
            (str, k) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), params[k]),
            value
        );
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private _applyLanguage(lang: AppLanguage): void {
        this._translations = TRANSLATIONS[lang];
        this._cache.clear();
        this._lang.set(lang);
        this._updateDocumentAttributes(lang);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(STORAGE_KEY, lang);
        }
        this._ready$.next(true);
    }

    private _getNestedValue(obj: Record<string, unknown>, key: string): string {
        const value = key.split('.').reduce<unknown>((o, k) => {
            return (o && typeof o === 'object') ? (o as Record<string, unknown>)[k] : undefined;
        }, obj);
        return typeof value === 'string' ? value : '';
    }

    private _updateDocumentAttributes(lang: AppLanguage): void {
        if (!isPlatformBrowser(this.platformId)) return;
        document.documentElement.lang = lang;
        document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
        if (lang === 'ar') {
            document.body.classList.add('rtl-enabled');
        } else {
            document.body.classList.remove('rtl-enabled');
        }
    }
}

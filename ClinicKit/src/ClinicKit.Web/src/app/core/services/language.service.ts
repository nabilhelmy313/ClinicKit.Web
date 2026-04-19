import {
    Injectable,
    signal,
    computed,
    PLATFORM_ID,
    inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export type AppLanguage = 'ar' | 'en';

const STORAGE_KEY = 'clinickit_lang';
const DEFAULT_LANG: AppLanguage = 'ar';

/**
 * LanguageService
 *
 * Manages AR/EN switching with Arabic as the default.
 * Handles:
 *  - Loading translation JSON from assets/i18n/{lang}.json
 *  - Persisting the chosen language in localStorage
 *  - Setting <html lang="…" dir="…"> on the document
 *  - Exposing a translate() helper used by TranslatePipe
 *
 * Usage in a component:
 *   constructor(public lang: LanguageService) {}
 *   // template: {{ 'COMMON.SAVE' | translate }}
 *   // switch:   lang.switchLanguage('en')
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {

    private readonly platformId = inject(PLATFORM_ID);
    private readonly http       = inject(HttpClient);

    // ── Reactive state ────────────────────────────────────────────────────────
    private readonly _lang   = signal<AppLanguage>(DEFAULT_LANG);
    private _translations: Record<string, unknown> = {};

    /** Current language code ('ar' | 'en'). */
    readonly lang = this._lang.asReadonly();

    /** True when the current language is RTL (Arabic). */
    readonly isRTL = computed(() => this._lang() === 'ar');

    /** Emits true once translations have been loaded for the first time. */
    private readonly _ready$ = new BehaviorSubject<boolean>(false);
    readonly ready$ = this._ready$.asObservable();

    // ── Bootstrap ─────────────────────────────────────────────────────────────
    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
            const initial: AppLanguage = (stored === 'ar' || stored === 'en') ? stored : DEFAULT_LANG;
            // Fire-and-forget; ready$ signals completion
            void this._applyLanguage(initial);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Switch to a new language at runtime.
     * Loads translations, updates document attributes, and persists the choice.
     */
    async switchLanguage(lang: AppLanguage): Promise<void> {
        await this._applyLanguage(lang);
    }

    /**
     * Translate a dot-notation key, with optional {{param}} interpolation.
     *
     * @example translate('ERRORS.MIN_LENGTH', { length: '6' })
     */
    translate(key: string, params?: Record<string, string>): string {
        const value = this._getNestedValue(this._translations, key);
        if (!value) return key;
        if (!params) return value;
        return Object.keys(params).reduce(
            (str, k) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), params[k]),
            value
        );
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private async _applyLanguage(lang: AppLanguage): Promise<void> {
        await this._loadTranslations(lang);
        this._lang.set(lang);
        this._updateDocumentAttributes(lang);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(STORAGE_KEY, lang);
        }
        this._ready$.next(true);
    }

    private async _loadTranslations(lang: AppLanguage): Promise<void> {
        try {
            this._translations = await firstValueFrom(
                this.http.get<Record<string, unknown>>(`/assets/i18n/${lang}.json`)
            ) ?? {};
        } catch {
            this._translations = {};
        }
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
        // Keep the body class in sync with the existing CustomizerSettingsService
        if (lang === 'ar') {
            document.body.classList.add('rtl-enabled');
        } else {
            document.body.classList.remove('rtl-enabled');
        }
    }
}

import { Pipe, PipeTransform, inject, ChangeDetectorRef } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * TranslatePipe
 *
 * Translates a dot-notation key using LanguageService.
 * The pipe is `pure: false` so it re-evaluates whenever the language
 * changes — at the cost of an extra CD cycle per switch.
 *
 * Usage in templates:
 *   {{ 'COMMON.SAVE' | translate }}
 *   {{ 'ERRORS.MIN_LENGTH' | translate:{ length: '6' } }}
 */
@Pipe({
    name: 'translate',
    standalone: true,
    pure: false,
})
export class TranslatePipe implements PipeTransform {

    private readonly langService = inject(LanguageService);
    private readonly cd          = inject(ChangeDetectorRef);

    constructor() {
        // Re-render containing view whenever language is switched
        this.langService.ready$
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.cd.markForCheck());
    }

    transform(key: string, params?: Record<string, string>): string {
        return this.langService.translate(key, params);
    }
}

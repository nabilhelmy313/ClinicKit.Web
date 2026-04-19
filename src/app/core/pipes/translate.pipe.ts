import { Pipe, PipeTransform, inject, ChangeDetectorRef, effect } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false,
})
export class TranslatePipe implements PipeTransform {

    private readonly langService = inject(LanguageService);
    private readonly cd          = inject(ChangeDetectorRef);

    constructor() {
        // Track the lang signal — effect() re-runs on every language switch
        effect(() => {
            this.langService.lang(); // register signal dependency
            this.cd.markForCheck();
        });
    }

    transform(key: string, params?: Record<string, string>): string {
        return this.langService.translate(key, params);
    }
}

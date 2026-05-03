import {
    Component, Input, inject,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe }   from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

// ─── Public types ────────────────────────────────────────────────────────────

/** How a detail value is rendered */
export type CkDetailValueType =
    | 'text'         // plain string (default)
    | 'ltr'          // always left-to-right (phone numbers, emails, dates)
    | 'date'         // formatted as dd/MM/yyyy
    | 'badge'        // a <ck-status-badge>-like chip — uses badgeClass
    | 'template';    // caller provides an <ng-template> via [valueTpl]

export interface CkDetailItem {
    /** Translation key, e.g. 'PATIENTS.PHONE' — or a plain string if labelRaw is true */
    label: string;
    /** Set true when label is already translated / plain text */
    labelRaw?: boolean;
    /** The display value */
    value: string | number | null | undefined;
    /** How to render the value */
    type?: CkDetailValueType;
    /** Optional CSS class(es) added to the value cell (useful for color-coding) */
    valueClass?: string;
    /** When true the row is hidden if value is falsy */
    hideWhenEmpty?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
    selector: 'ck-details',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './ck-details.component.html',
    styleUrl: './ck-details.component.scss',
    imports: [CommonModule, TranslatePipe],
})
export class CkDetailsComponent {

    readonly langService = inject(LanguageService);

    /** Array of detail rows to display */
    @Input() items: CkDetailItem[] = [];

    /**
     * Layout direction:
     * - 'auto'    → follows LanguageService.isRTL() (default)
     * - 'rtl'     → force RTL
     * - 'ltr'     → force LTR
     */
    @Input() dir: 'auto' | 'rtl' | 'ltr' = 'auto';

    /**
     * Column count — how many label+value pairs per row.
     * 1 → single column (stacked), 2 → two-column grid (default)
     */
    @Input() columns: 1 | 2 | 3 = 2;

    get resolvedDir(): 'rtl' | 'ltr' {
        if (this.dir !== 'auto') return this.dir;
        return this.langService.isRTL() ? 'rtl' : 'ltr';
    }

    get visibleItems(): CkDetailItem[] {
        return this.items.filter(i => !i.hideWhenEmpty || (i.value !== null && i.value !== undefined && i.value !== ''));
    }

    isLtr(item: CkDetailItem): boolean {
        return item.type === 'ltr' || item.type === 'date';
    }

    displayValue(item: CkDetailItem): string {
        if (item.value === null || item.value === undefined || item.value === '') {
            return '—';
        }
        if (item.type === 'date' && item.value) {
            const d = new Date(item.value as string);
            if (!isNaN(d.getTime())) {
                const dd   = String(d.getDate()).padStart(2, '0');
                const mm   = String(d.getMonth() + 1).padStart(2, '0');
                const yyyy = d.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            }
        }
        return String(item.value);
    }
}

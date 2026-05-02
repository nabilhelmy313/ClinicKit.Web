import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CkBtnComponent } from '../ck-btn/ck-btn.component';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
    selector: 'ck-form-actions',
    standalone: true,
    imports: [CommonModule, CkBtnComponent, TranslatePipe],
    templateUrl: './ck-form-actions.component.html',
    styleUrl: './ck-form-actions.component.scss',
})
export class CkFormActionsComponent {
    readonly langService = inject(LanguageService);

    @Input() saveLabel   = '';          // defaults to COMMON.SAVE if empty
    @Input() saveIcon    = 'save';
    @Input() cancelLabel = '';          // defaults to COMMON.CANCEL if empty
    @Input() cancelIcon  = '';
    @Input() loading     = false;
    @Input() disabled    = false;
    /** Show a back-arrow on the cancel button (for page-level cancel, not dialog) */
    @Input() backMode    = false;
    /** Put actions inside a card-box footer bar (adds top border + padding) */
    @Input() inCard      = true;

    @Output() save   = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    get backIcon(): string {
        // RTL: back means going right → arrow_forward; LTR: arrow_back
        return this.langService.isRTL() ? 'arrow_forward' : 'arrow_back';
    }

    get resolvedCancelIcon(): string {
        if (this.cancelIcon) return this.cancelIcon;
        return this.backMode ? this.backIcon : '';
    }
}

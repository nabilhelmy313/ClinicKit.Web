import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CkBtnVariant = 'primary' | 'outline' | 'danger' | 'ghost' | 'icon';
export type CkBtnSize    = 'sm' | 'md' | 'lg';

@Component({
    selector: 'ck-btn',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ck-btn.component.html',
    styleUrl: './ck-btn.component.scss',
})
export class CkBtnComponent {
    @Input() variant: CkBtnVariant = 'primary';
    @Input() size: CkBtnSize       = 'md';
    @Input() icon  = '';
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() loading   = false;
    @Input() disabled  = false;
    @Input() fullWidth = false;

    @Output() clicked = new EventEmitter<MouseEvent>();

    get classes(): string {
        return [
            'ck-btn',
            `ck-btn--${this.variant}`,
            this.size !== 'md' ? `ck-btn--${this.size}` : '',
            this.fullWidth ? 'ck-btn--full' : '',
        ].filter(Boolean).join(' ');
    }

    onClick(e: MouseEvent): void {
        if (!this.disabled && !this.loading) this.clicked.emit(e);
    }
}

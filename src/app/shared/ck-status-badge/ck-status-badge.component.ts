import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';

const APPOINTMENT_STATUS_MAP: Record<string, BadgeColor> = {
    Pending:     'warning',
    Confirmed:   'info',
    InProgress:  'success',
    Completed:   'neutral',
    Cancelled:   'danger',
    NoShow:      'purple',
    // numeric fallbacks
    '0': 'warning',
    '1': 'info',
    '2': 'success',
    '3': 'neutral',
    '4': 'danger',
    '5': 'purple',
};

@Component({
    selector: 'ck-status-badge',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ck-status-badge.component.html',
    styleUrl: './ck-status-badge.component.scss',
})
export class CkStatusBadgeComponent {
    @Input() status = '';
    @Input() label  = '';
    /** Pass a custom status→color map, or leave blank to use the appointment defaults */
    @Input() colorMap: Record<string, BadgeColor> | null = null;

    get color(): BadgeColor {
        const map = this.colorMap ?? APPOINTMENT_STATUS_MAP;
        return map[this.status] ?? 'neutral';
    }

    get displayLabel(): string {
        return this.label || this.status;
    }
}

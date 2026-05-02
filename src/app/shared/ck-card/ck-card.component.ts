import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ck-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ck-card.component.html',
    styleUrl: './ck-card.component.scss',
})
export class CkCardComponent {
    @Input() title    = '';
    @Input() subtitle = '';
    /** Remove inner padding — use for edge-to-edge tables */
    @Input() noPadding = false;
    @Input() class = '';
}

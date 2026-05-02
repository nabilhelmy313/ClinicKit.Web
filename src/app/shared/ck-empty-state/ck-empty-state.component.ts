import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CkBtnComponent } from '../ck-btn/ck-btn.component';

@Component({
    selector: 'ck-empty-state',
    standalone: true,
    imports: [CommonModule, CkBtnComponent],
    templateUrl: './ck-empty-state.component.html',
    styleUrl: './ck-empty-state.component.scss',
})
export class CkEmptyStateComponent {
    @Input() icon        = 'inbox';
    @Input() message     = '';
    @Input() actionLabel = '';
    @Input() actionIcon  = '';

    @Output() action = new EventEmitter<void>();
}

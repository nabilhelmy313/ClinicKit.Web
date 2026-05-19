import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { CkTab } from './ck-tab.model';

@Component({
    selector: 'ck-tabs',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './ck-tabs.component.html',
    styleUrl:    './ck-tabs.component.scss',
})
export class CkTabsComponent {
    /** Tab definitions */
    @Input() tabs: CkTab[] = [];

    /** Currently active tab key */
    @Input() active = '';

    /**
     * When true the tray stretches to fill its container (full-width mode).
     * Use for standalone tab bars (e.g. Reports).
     * Default false = compact inline pill for side-by-side layouts (e.g. Catalog).
     */
    @Input() block = false;

    /** Two-way binding: emits the new key on click */
    @Output() activeChange = new EventEmitter<string>();

    select(key: string): void {
        if (key !== this.active) this.activeChange.emit(key);
    }
}

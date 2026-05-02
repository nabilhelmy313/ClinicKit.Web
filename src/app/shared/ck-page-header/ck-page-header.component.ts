import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface CkBreadcrumb {
    label: string;
    link?: string;
}

@Component({
    selector: 'ck-page-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './ck-page-header.component.html',
    styleUrl: './ck-page-header.component.scss',
})
export class CkPageHeaderComponent {
    @Input() title = '';
    @Input() icon  = '';
    /** Breadcrumb trail. Last item is always the active (non-linked) crumb. */
    @Input() breadcrumbs: CkBreadcrumb[] = [];
}

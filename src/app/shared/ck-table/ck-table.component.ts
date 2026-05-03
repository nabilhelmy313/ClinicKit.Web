import {
    Component, Input, Output, EventEmitter,
    ContentChildren, QueryList, AfterContentInit, ViewChild,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { MatTableModule, MatTable, MatColumnDef } from '@angular/material/table';
import { TranslatePipe }   from '../../core/pipes/translate.pipe';
import { CkBtnComponent }        from '../ck-btn/ck-btn.component';
import { CkEmptyStateComponent } from '../ck-empty-state/ck-empty-state.component';

@Component({
    selector: 'ck-table',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './ck-table.component.html',
    styleUrl:    './ck-table.component.scss',
    imports: [
        CommonModule, MatTableModule,
        TranslatePipe, CkBtnComponent, CkEmptyStateComponent,
    ],
})
export class CkTableComponent<T> implements AfterContentInit {

    // ── Data ──────────────────────────────────────────────────────────────────
    @Input() data:    T[]      = [];
    @Input() columns: string[] = [];

    // ── State ─────────────────────────────────────────────────────────────────
    @Input() loading  = false;

    // ── Pagination ────────────────────────────────────────────────────────────
    @Input() totalCount = 0;
    @Input() page       = 1;
    @Input() pageSize   = 20;

    // ── Empty state ───────────────────────────────────────────────────────────
    @Input() emptyIcon         = 'search_off';
    @Input() emptyMessage      = '';
    @Input() emptyActionLabel  = '';
    @Input() emptyActionIcon   = '';

    // ── Row click ─────────────────────────────────────────────────────────────
    @Input() clickable = false;

    // ── Events ────────────────────────────────────────────────────────────────
    @Output() prevPage    = new EventEmitter<void>();
    @Output() nextPage    = new EventEmitter<void>();
    @Output() emptyAction = new EventEmitter<void>();
    @Output() rowClick    = new EventEmitter<T>();

    // ── Internals ─────────────────────────────────────────────────────────────
    // static: true works because mat-table is ALWAYS in the DOM (never inside an
    // @if). It is resolved before ngOnInit, so it is available in ngAfterContentInit
    // — which runs before the view renders, giving us time to register all column
    // defs before mat-table tries to build its header/row outlets.
    @ViewChild(MatTable, { static: true })
    private matTable!: MatTable<T>;

    @ContentChildren(MatColumnDef)
    private columnDefs!: QueryList<MatColumnDef>;

    ngAfterContentInit(): void {
        // Register each projected column def into the internal mat-table.
        // This must happen here (before ngAfterViewInit) so that mat-table has
        // all column definitions available when it renders its rows.
        this.columnDefs.forEach(def => this.matTable.addColumnDef(def));
    }

    totalPages(): number { return Math.ceil((this.totalCount || this.data.length) / this.pageSize) || 1; }
    min(a: number, b: number): number { return Math.min(a, b); }

    /** Show pagination bar whenever the table is visible (not loading, has data). */
    get showTable(): boolean { return !this.loading && this.data.length > 0; }
    get showPagination(): boolean { return this.showTable; }

    /** Displayed item range — falls back to data.length if totalCount is not set. */
    get effectiveTotal(): number { return this.totalCount > 0 ? this.totalCount : this.data.length; }
}

import {
    Component, Input, Output, EventEmitter, inject,
    ContentChildren, QueryList, AfterContentInit, ViewChild,
    ChangeDetectionStrategy, TemplateRef,
    signal, computed,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { MatTableModule, MatTable, MatColumnDef } from '@angular/material/table';
import { MatMenuModule }              from '@angular/material/menu';
import { MatTooltipModule }           from '@angular/material/tooltip';
import { TranslatePipe }              from '../../core/pipes/translate.pipe';
import { CkBtnComponent }             from '../ck-btn/ck-btn.component';
import { CkEmptyStateComponent }      from '../ck-empty-state/ck-empty-state.component';
import { CkCellDefDirective }         from './ck-cell-def.directive';
import { CkColumnDef, CkSortChange, CkSortDir, CkTableAction } from './ck-column-def.model';
import { LanguageService }            from '../../core/services/language.service';

@Component({
    selector: 'ck-table',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './ck-table.component.html',
    styleUrl:    './ck-table.component.scss',
    imports: [
        CommonModule, NgTemplateOutlet, MatTableModule, MatMenuModule, MatTooltipModule,
        TranslatePipe, CkBtnComponent, CkEmptyStateComponent,
        CkCellDefDirective,
    ],
})
export class CkTableComponent<T> implements AfterContentInit {

    readonly lang = inject(LanguageService);

    // ── Column definitions (new pattern) ──────────────────────────────────────
    @Input() columnDefs: CkColumnDef[] = [];

    // ── Data — backed by a signal so computed() tracks changes ────────────────
    private readonly _data = signal<T[]>([]);

    @Input() set data(val: T[]) { this._data.set(val ?? []); }
    get data(): T[]             { return this._data(); }

    /** Used only when columnDefs is NOT provided (legacy projection mode). */
    @Input() columns: string[] = [];

    // ── Built-in actions column ───────────────────────────────────────────────
    @Input() actions: CkTableAction<T>[] = [];

    // ── Server-side mode ──────────────────────────────────────────────────────
    /**
     * When true the table is "dumb" — it never filters or sorts data itself.
     * Instead it emits (filterChange) and (sortChange) so the parent can
     * call the API and push back filtered results via [data].
     *
     * When false (default) all filtering & sorting happen client-side.
     */
    @Input() serverSide     = false;
    /** Debounce delay (ms) for text-column filter in server-side mode. Default 300. */
    @Input() filterDebounce = 300;

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
    @Output() prevPage       = new EventEmitter<void>();
    @Output() nextPage       = new EventEmitter<void>();
    @Output() emptyAction    = new EventEmitter<void>();
    @Output() rowClick       = new EventEmitter<T>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() reload         = new EventEmitter<void>();
    /**
     * (serverSide only) Emits the current active filters as
     * Record<columnKey, filterValue> whenever a filter changes.
     * Text columns are debounced; select/date columns emit immediately.
     * Empty string values are omitted from the object.
     */
    @Output() filterChange   = new EventEmitter<Record<string, string>>();
    /**
     * (serverSide only) Emits when the sort column/direction changes.
     * col === null means "no sort".
     */
    @Output() sortChange     = new EventEmitter<CkSortChange>();

    // ── Internals — mat-table ─────────────────────────────────────────────────
    @ViewChild(MatTable, { static: true })
    private matTable!: MatTable<T>;

    /** Legacy: projected column defs from consuming component (old pattern). */
    @ContentChildren(MatColumnDef)
    private projectedColDefs!: QueryList<MatColumnDef>;

    /** New pattern: cell templates from <ng-template ckCell="key"> */
    @ContentChildren(CkCellDefDirective)
    private cellDefs!: QueryList<CkCellDefDirective>;

    ngAfterContentInit(): void {
        this.projectedColDefs.forEach(def => this.matTable.addColumnDef(def));
    }

    // ── Sort state ────────────────────────────────────────────────────────────
    readonly sortCol = signal<string | null>(null);
    readonly sortDir = signal<CkSortDir>(null);

    // ── Column search state ───────────────────────────────────────────────────
    readonly searchOpen   = signal<Record<string, boolean>>({});
    /** Applied filter values — drive displayData (client) and filterChange (server). */
    readonly searchValues = signal<Record<string, string>>({});
    /** Pending text typed by the user, not yet applied (Enter / Apply button). */
    readonly pendingValues = signal<Record<string, string>>({});

    // ── Debounce timer for text-column filter in server-side mode ─────────────
    private _filterDebounceTimer?: ReturnType<typeof setTimeout>;

    // ── Computed display data — tracks _data signal so it always recomputes ───
    readonly displayData = computed<T[]>(() => {
        const rows = [...this._data()];   // _data() is a signal → tracked by computed()

        // ── SERVER-SIDE: the parent feeds already-filtered rows from the API ──
        // We only track _data() here; searchValues / sort signals are
        // intentionally NOT read so computed() doesn't re-run on filter changes.
        if (this.serverSide) return rows;

        // ── CLIENT-SIDE: filter & sort locally ────────────────────────────────
        let filtered = rows;

        // Apply column filters (type-aware)
        const filters = this.searchValues();
        for (const [col, val] of Object.entries(filters)) {
            if (!val) continue;
            const colDef     = this.columnDefs.find(c => c.key === col);
            const filterType = colDef?.filterType ?? 'text';

            if (filterType === 'select') {
                filtered = filtered.filter(r =>
                    String((r as Record<string, unknown>)[col] ?? '').toLowerCase() === val.toLowerCase(),
                );
            } else if (filterType === 'date') {
                filtered = filtered.filter(r => {
                    const rv = (r as Record<string, unknown>)[col];
                    const dateStr = rv instanceof Date
                        ? rv.toISOString().split('T')[0]
                        : String(rv ?? '').split('T')[0];
                    return dateStr === val;
                });
            } else {
                filtered = filtered.filter(r =>
                    String((r as Record<string, unknown>)[col] ?? '').toLowerCase()
                        .includes(val.toLowerCase()),
                );
            }
        }

        // Apply sort
        const sc = this.sortCol();
        const sd = this.sortDir();
        if (sc && sd) {
            filtered = [...filtered].sort((a, b) => {
                const av = String((a as Record<string, unknown>)[sc] ?? '');
                const bv = String((b as Record<string, unknown>)[sc] ?? '');
                return sd === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            });
        }

        return filtered;
    });

    // ── Active filter helpers ─────────────────────────────────────────────────

    /** Returns only columns that have a non-empty filter value. */
    getActiveFilters(): Record<string, string> {
        const active: Record<string, string> = {};
        for (const [k, v] of Object.entries(this.searchValues())) {
            if (v) active[k] = v;
        }
        return active;
    }

    /** True when at least one column filter has a value. */
    hasActiveFilters(): boolean {
        return Object.values(this.searchValues()).some(v => !!v);
    }

    /** Clear all column filters and (in server-side mode) notify the parent. */
    clearFilters(): void {
        clearTimeout(this._filterDebounceTimer);
        this.searchValues.set({});
        this.pendingValues.set({});
        this.searchOpen.set({});
        if (this.serverSide) this.filterChange.emit({});
    }

    // ── Actions helpers ───────────────────────────────────────────────────────
    get inlineActions(): CkTableAction<T>[] { return this.actions.filter(a => a.inline); }
    get menuActions():   CkTableAction<T>[] { return this.actions.filter(a => !a.inline); }
    get hasActions():    boolean             { return this.actions.length > 0; }

    isActionVisible(action: CkTableAction<T>, row: T): boolean {
        return action.visible ? action.visible(row) : true;
    }
    isActionDisabled(action: CkTableAction<T>, row: T): boolean {
        return action.disabled ? action.disabled(row) : false;
    }

    // ── Derived column list ───────────────────────────────────────────────────
    getColumns(): string[] {
        const base = this.columnDefs.length ? this.columnDefs.map(c => c.key) : this.columns;
        return this.hasActions ? [...base, 'ck-actions'] : base;
    }

    // ── Cell template lookup ──────────────────────────────────────────────────
    getCellTemplate(key: string): TemplateRef<any> | null {
        return this.cellDefs.find(d => d.column === key)?.template ?? null;
    }

    /** Fallback: read a plain field value when no custom ckCell template exists. */
    getCellValue(row: T, key: string): unknown {
        return (row as Record<string, unknown>)[key] ?? '';
    }

    // ── Sort ──────────────────────────────────────────────────────────────────
    toggleSort(col: string): void {
        if (this.sortCol() !== col) {
            this.sortCol.set(col); this.sortDir.set('asc');
        } else if (this.sortDir() === 'asc') {
            this.sortDir.set('desc');
        } else {
            this.sortCol.set(null); this.sortDir.set(null);
        }
        if (this.serverSide) {
            this.sortChange.emit({ col: this.sortCol(), dir: this.sortDir() });
        }
    }

    sortIcon(col: string): string {
        if (this.sortCol() !== col) return 'swap_vert';
        return this.sortDir() === 'desc' ? 'arrow_downward' : 'arrow_upward';
    }

    sortTooltip(col: string): string {
        if (this.sortCol() !== col) return 'COMMON.SORT';
        return this.sortDir() === 'asc' ? 'COMMON.SORT_DESC' : 'COMMON.CLEAR_SORT';
    }

    // ── Search ────────────────────────────────────────────────────────────────
    toggleSearch(col: string): void {
        this.searchOpen.update(s => ({ ...s, [col]: !s[col] }));
        if (!this.searchOpen()[col]) {
            // Filter closed — clear both applied and pending values
            this.searchValues.update(v => ({ ...v, [col]: '' }));
            this.pendingValues.update(v => ({ ...v, [col]: '' }));
            if (this.serverSide) {
                clearTimeout(this._filterDebounceTimer);
                this.filterChange.emit(this.getActiveFilters());
            }
        }
    }

    /** For text inputs — updates pending state ONLY, does not trigger filtering. */
    onPendingInput(col: string, val: string): void {
        this.pendingValues.update(v => ({ ...v, [col]: val }));
    }

    /**
     * Apply the pending text value for a column (fired by Enter key or Apply button).
     * Copies pending → applied and notifies parent in server-side mode.
     */
    applyColumnSearch(col: string): void {
        const val = this.pendingValues()[col] ?? '';
        this.searchValues.update(v => ({ ...v, [col]: val }));
        if (this.serverSide) {
            clearTimeout(this._filterDebounceTimer);
            this.filterChange.emit(this.getActiveFilters());
        }
    }

    /**
     * For select / date widgets — discrete selection, apply immediately.
     * @param immediate  Always pass true from select/date templates.
     */
    onSearchInput(col: string, val: string, immediate = false): void {
        this.searchValues.update(v => ({ ...v, [col]: val }));
        this.pendingValues.update(v => ({ ...v, [col]: val })); // keep in sync
        if (this.serverSide) {
            clearTimeout(this._filterDebounceTimer);
            if (immediate) {
                this.filterChange.emit(this.getActiveFilters());
            } else {
                this._filterDebounceTimer = setTimeout(() => {
                    this.filterChange.emit(this.getActiveFilters());
                }, this.filterDebounce);
            }
        }
    }

    // ── Pagination ────────────────────────────────────────────────────────────
    onPageSizeChange(size: number): void { this.pageSizeChange.emit(size); }

    readonly pageSizeOptions = [10, 20, 50];

    totalPages(): number  { return Math.ceil((this.totalCount || this._data().length) / this.pageSize) || 1; }
    min(a: number, b: number): number { return Math.min(a, b); }

    get showTable(): boolean      { return !this.loading; }
    get showPagination(): boolean { return !this.loading && this._data().length > 0; }
    get effectiveTotal(): number  { return this.totalCount > 0 ? this.totalCount : this._data().length; }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe }  from '@angular/common';
import { RouterLink, Router }       from '@angular/router';

import { PatientsService } from '../../../core/services/patients.service';
import { Patient, Gender, GenderLabels } from '../../../core/models/patient.model';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import {
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
    CkTableComponent, CkCellDefDirective,
} from '../../../shared/index';
import type { CkColumnDef, CkTableAction, CkFilterOption, CkSortChange } from '../../../shared/index';

@Component({
    selector: 'app-patients-list',
    standalone: true,
    templateUrl: './patients-list.component.html',
    styleUrl:    './patients-list.component.scss',
    imports: [
        CommonModule, RouterLink, DatePipe,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
        CkTableComponent, CkCellDefDirective,
    ],
})
export class PatientsListComponent implements OnInit {
    readonly router       = inject(Router);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly svc  = inject(PatientsService);

    // ── Reactive state ────────────────────────────────────────────────────────
    patients   = signal<Patient[]>([]);
    totalCount = signal(0);
    page       = signal(1);
    pageSize   = signal(20);
    loading    = signal(false);

    // ── Active backend filters + sort ─────────────────────────────────────────
    private _search      = signal<string | undefined>(undefined);
    private _gender      = signal<Gender | undefined>(undefined);
    private _dateOfBirth = signal<string | undefined>(undefined);
    private _sortBy      = signal<string | undefined>(undefined);
    private _sortDir     = signal<'asc' | 'desc' | undefined>(undefined);

    // ── Gender select options ─────────────────────────────────────────────────
    private readonly genderOptions: CkFilterOption[] = [
        { value: String(Gender.Male),   label: 'PATIENTS.MALE'   },
        { value: String(Gender.Female), label: 'PATIENTS.FEMALE' },
    ];

    // ── Column definitions ────────────────────────────────────────────────────
    colDefs: CkColumnDef[] = [
        {
            key: 'name', label: 'PATIENTS.FULL_NAME', sortable: true,
            searchable: true, filterType: 'text',
        },
        {
            key: 'phone', label: 'PATIENTS.PHONE', sortable: false,
            searchable: true, filterType: 'text',
        },
        {
            key: 'gender', label: 'PATIENTS.GENDER', sortable: true,
            searchable: true, filterType: 'select', filterOptions: this.genderOptions,
        },
        {
            key: 'dob', label: 'PATIENTS.BIRTH_DATE', sortable: true,
            searchable: true, filterType: 'date',
        },
    ];

    // ── Built-in actions ──────────────────────────────────────────────────────
    tableActions: CkTableAction<Patient>[] = [
        {
            icon:   'visibility',
            label:  'COMMON.VIEW',
            inline: true,
            click:  (p) => this.router.navigate(['/patients', p.id]),
        },
        {
            icon:   'calendar_add_on',
            label:  'PATIENTS.BOOK_APPOINTMENT',
            inline: false,
            click:  (p) => this.bookAppointment(p.id),
        },
    ];

    genderLabel(g: number) { return GenderLabels[g as keyof typeof GenderLabels] ?? '—'; }

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading.set(true);
        this.svc.list({
            search:      this._search(),
            gender:      this._gender(),
            dateOfBirth: this._dateOfBirth(),
            sortBy:      this._sortBy(),
            sortDir:     this._sortDir(),
            page:        this.page(),
            pageSize:    this.pageSize(),
        }).subscribe({
            next: res => {
                this.patients.set(res.items);
                this.totalCount.set(res.totalCount);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    /** Fired by ck-table (filterChange) — maps column keys → API params. */
    onFilterChange(filters: Record<string, string>): void {
        // name + phone both use the `search` param (backend ORs them)
        this._search.set(filters['name'] || filters['phone'] || undefined);
        this._gender.set(
            filters['gender'] !== undefined && filters['gender'] !== ''
                ? (Number(filters['gender']) as Gender)
                : undefined,
        );
        this._dateOfBirth.set(filters['dob'] || undefined);
        this.page.set(1);
        this.load();
    }

    onSortChange(sort: CkSortChange): void {
        this._sortBy.set(sort.col ?? undefined);
        this._sortDir.set(sort.dir ?? undefined);
        this.page.set(1);
        this.load();
    }

    prevPage(): void { this.page.update(p => p - 1); this.load(); }
    nextPage(): void { this.page.update(p => p + 1); this.load(); }

    onPageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.page.set(1);
        this.load();
    }

    bookAppointment(patientId: string): void {
        this.router.navigate(['/appointments/new'], { queryParams: { patientId } });
    }
}

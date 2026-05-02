import { Injectable, inject, signal, computed } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { PatientsApiService } from './services/patients-api.service';
import {
  Patient,
  PatientBrief,
  CreatePatientDto,
  UpdatePatientDto,
  PatientQuery,
} from './models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientsFacade {
  private readonly api   = inject(PatientsApiService);
  private readonly toast = inject(ToastService);

  private readonly _patients    = signal<Patient[]>([]);
  private readonly _selected    = signal<Patient | null>(null);
  private readonly _searchResults = signal<PatientBrief[]>([]);
  private readonly _loading     = signal(false);
  private readonly _saving      = signal(false);
  private readonly _error       = signal<string | null>(null);
  private readonly _totalCount  = signal(0);
  private readonly _page        = signal(1);
  private readonly _pageSize    = signal(20);
  private readonly _search      = signal('');

  readonly patients      = this._patients.asReadonly();
  readonly selected      = this._selected.asReadonly();
  readonly searchResults = this._searchResults.asReadonly();
  readonly loading       = this._loading.asReadonly();
  readonly saving        = this._saving.asReadonly();
  readonly error         = this._error.asReadonly();
  readonly totalCount    = this._totalCount.asReadonly();
  readonly page          = this._page.asReadonly();
  readonly pageSize      = this._pageSize.asReadonly();
  readonly search        = this._search.asReadonly();

  readonly totalPages = computed(() =>
    Math.ceil(this._totalCount() / this._pageSize()) || 1
  );

  readonly isEmpty = computed(() =>
    !this._loading() && this._patients().length === 0
  );

  loadAll(query: PatientQuery = {}): void {
    this._loading.set(true);
    this._error.set(null);

    const q: PatientQuery = {
      page:     this._page(),
      pageSize: this._pageSize(),
      search:   this._search() || undefined,
      ...query,
    };

    this.api.getAll(q).subscribe({
      next: res => {
        this._patients.set(res.items);
        this._totalCount.set(res.totalCount);
        this._page.set(res.page);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this._error.set('تعذّر تحميل بيانات المرضى');
      },
    });
  }

  loadById(id: string): void {
    this._loading.set(true);
    this._selected.set(null);
    this.api.getById(id).subscribe({
      next:  patient => { this._selected.set(patient); this._loading.set(false); },
      error: ()      => { this._loading.set(false); },
    });
  }

  searchPatients(term: string): void {
    if (!term.trim()) { this._searchResults.set([]); return; }
    this.api.search(term).subscribe({
      next:  results => this._searchResults.set(results),
      error: ()      => this._searchResults.set([]),
    });
  }

  create(dto: CreatePatientDto, onSuccess?: (p: Patient) => void): void {
    this._saving.set(true);
    this.api.create(dto).subscribe({
      next: patient => {
        this._patients.update(list => [patient, ...list]);
        this._totalCount.update(n => n + 1);
        this._saving.set(false);
        this.toast.success('تم إضافة المريض بنجاح');
        onSuccess?.(patient);
      },
      error: () => { this._saving.set(false); },
    });
  }

  update(id: string, dto: UpdatePatientDto, onSuccess?: () => void): void {
    this._saving.set(true);
    this.api.update(id, dto).subscribe({
      next: updated => {
        this._patients.update(list =>
          list.map(p => (p.id === id ? updated : p))
        );
        if (this._selected()?.id === id) this._selected.set(updated);
        this._saving.set(false);
        this.toast.success('تم تحديث بيانات المريض');
        onSuccess?.();
      },
      error: () => { this._saving.set(false); },
    });
  }

  setPage(page: number): void {
    this._page.set(page);
    this.loadAll();
  }

  setPageSize(size: number): void {
    this._pageSize.set(size);
    this._page.set(1);
    this.loadAll();
  }

  setSearch(term: string): void {
    this._search.set(term);
    this._page.set(1);
    this.loadAll();
  }

  selectPatient(patient: Patient | null): void {
    this._selected.set(patient);
  }

  clearError(): void {
    this._error.set(null);
  }

  clearSearchResults(): void {
    this._searchResults.set([]);
  }
}

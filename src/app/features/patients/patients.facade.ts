import { Injectable, inject, signal, computed } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { PatientsApiService } from './services/patients-api.service';
import {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  PatientQuery,
} from './models/patient.model';

/**
 * Facade for the Patients feature.
 *
 * The component talks ONLY to this facade — never directly to the API service.
 *
 * Responsibilities:
 *  • Owns all Patients state as Angular Signals.
 *  • Orchestrates API calls + loading/error feedback.
 *  • Exposes clean computed signals to the template.
 *
 * Pattern (replicate for every feature):
 *  Component → Facade → ApiService → Backend
 */
@Injectable({ providedIn: 'root' })
export class PatientsFacade {
  private readonly api   = inject(PatientsApiService);
  private readonly toast = inject(ToastService);

  // ── Private state signals ─────────────────────────────────────────────────

  private readonly _patients    = signal<Patient[]>([]);
  private readonly _selected    = signal<Patient | null>(null);
  private readonly _loading     = signal(false);
  private readonly _error       = signal<string | null>(null);
  private readonly _totalCount  = signal(0);
  private readonly _page        = signal(1);
  private readonly _pageSize    = signal(10);
  private readonly _search      = signal('');

  // ── Public read-only signals ──────────────────────────────────────────────

  readonly patients   = this._patients.asReadonly();
  readonly selected   = this._selected.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly error      = this._error.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly page       = this._page.asReadonly();
  readonly pageSize   = this._pageSize.asReadonly();
  readonly search     = this._search.asReadonly();

  // ── Computed ──────────────────────────────────────────────────────────────

  readonly totalPages = computed(() =>
    Math.ceil(this._totalCount() / this._pageSize())
  );

  readonly isEmpty = computed(() =>
    !this._loading() && this._patients().length === 0
  );

  // ── Commands ──────────────────────────────────────────────────────────────

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
    this.api.getById(id).subscribe({
      next:  patient => { this._selected.set(patient); this._loading.set(false); },
      error: ()      => { this._loading.set(false); },
    });
  }

  create(dto: CreatePatientDto): void {
    this._loading.set(true);
    this.api.create(dto).subscribe({
      next: patient => {
        this._patients.update(list => [patient, ...list]);
        this._totalCount.update(n => n + 1);
        this._loading.set(false);
        this.toast.success('تم إضافة المريض بنجاح');
      },
      error: () => { this._loading.set(false); },
    });
  }

  update(id: string, dto: UpdatePatientDto): void {
    this._loading.set(true);
    this.api.update(id, dto).subscribe({
      next: updated => {
        this._patients.update(list =>
          list.map(p => (p.id === id ? updated : p))
        );
        if (this._selected()?.id === id) this._selected.set(updated);
        this._loading.set(false);
        this.toast.success('تم تحديث بيانات المريض');
      },
      error: () => { this._loading.set(false); },
    });
  }

  remove(id: string): void {
    this._loading.set(true);
    this.api.remove(id).subscribe({
      next: () => {
        this._patients.update(list => list.filter(p => p.id !== id));
        this._totalCount.update(n => n - 1);
        if (this._selected()?.id === id) this._selected.set(null);
        this._loading.set(false);
        this.toast.success('تم حذف المريض');
      },
      error: () => { this._loading.set(false); },
    });
  }

  // ── Pagination & search helpers ───────────────────────────────────────────

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
}

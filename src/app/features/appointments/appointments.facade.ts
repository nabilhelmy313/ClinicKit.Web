import { Injectable, inject, signal, computed } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentsApiService } from './services/appointments-api.service';
import {
  Appointment,
  AppointmentStatus,
  AppointmentQuery,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentsFacade {
  private readonly api   = inject(AppointmentsApiService);
  private readonly toast = inject(ToastService);

  private readonly _appointments = signal<Appointment[]>([]);
  private readonly _daily        = signal<Appointment[]>([]);
  private readonly _selected     = signal<Appointment | null>(null);
  private readonly _loading      = signal(false);
  private readonly _saving       = signal(false);
  private readonly _totalCount   = signal(0);
  private readonly _page         = signal(1);
  private readonly _pageSize     = signal(20);

  readonly appointments = this._appointments.asReadonly();
  readonly daily        = this._daily.asReadonly();
  readonly selected     = this._selected.asReadonly();
  readonly loading      = this._loading.asReadonly();
  readonly saving       = this._saving.asReadonly();
  readonly totalCount   = this._totalCount.asReadonly();
  readonly page         = this._page.asReadonly();
  readonly pageSize     = this._pageSize.asReadonly();

  readonly totalPages = computed(() =>
    Math.ceil(this._totalCount() / this._pageSize()) || 1
  );

  readonly isEmpty = computed(() =>
    !this._loading() && this._appointments().length === 0
  );

  loadAll(query: AppointmentQuery = {}): void {
    this._loading.set(true);
    const q: AppointmentQuery = {
      page: this._page(), pageSize: this._pageSize(), ...query,
    };
    this.api.getAll(q).subscribe({
      next: res => {
        this._appointments.set(res.items);
        this._totalCount.set(res.totalCount);
        this._page.set(res.page);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  loadById(id: string): void {
    this._loading.set(true);
    this._selected.set(null);
    this.api.getById(id).subscribe({
      next:  a  => { this._selected.set(a); this._loading.set(false); },
      error: () => this._loading.set(false),
    });
  }

  loadDaily(date: string): void {
    this._loading.set(true);
    this.api.getDaily(date).subscribe({
      next:  list => { this._daily.set(list); this._loading.set(false); },
      error: ()   => this._loading.set(false),
    });
  }

  create(dto: CreateAppointmentDto, onSuccess?: (a: Appointment) => void): void {
    this._saving.set(true);
    this.api.create(dto).subscribe({
      next: appt => {
        this._appointments.update(list => [appt, ...list]);
        this._saving.set(false);
        this.toast.success('تم حجز الموعد بنجاح');
        onSuccess?.(appt);
      },
      error: () => this._saving.set(false),
    });
  }

  update(id: string, dto: UpdateAppointmentDto, onSuccess?: () => void): void {
    this._saving.set(true);
    this.api.update(id, dto).subscribe({
      next: updated => {
        this._appointments.update(list =>
          list.map(a => (a.id === id ? updated : a))
        );
        if (this._selected()?.id === id) this._selected.set(updated);
        this._saving.set(false);
        this.toast.success('تم تحديث الموعد');
        onSuccess?.();
      },
      error: () => this._saving.set(false),
    });
  }

  updateStatus(id: string, newStatus: AppointmentStatus): void {
    this.api.updateStatus(id, newStatus).subscribe({
      next: updated => {
        this._appointments.update(list =>
          list.map(a => (a.id === id ? updated : a))
        );
        this._daily.update(list =>
          list.map(a => (a.id === id ? updated : a))
        );
        if (this._selected()?.id === id) this._selected.set(updated);
        this.toast.success('تم تحديث حالة الموعد');
      },
      error: () => {},
    });
  }

  cancel(id: string, reason?: string): void {
    this.api.cancel(id, reason).subscribe({
      next: updated => {
        this._appointments.update(list =>
          list.map(a => (a.id === id ? updated : a))
        );
        this._daily.update(list =>
          list.map(a => (a.id === id ? updated : a))
        );
        if (this._selected()?.id === id) this._selected.set(updated);
        this.toast.success('تم إلغاء الموعد');
      },
      error: () => {},
    });
  }

  setPage(page: number, query: AppointmentQuery = {}): void {
    this._page.set(page);
    this.loadAll(query);
  }
}

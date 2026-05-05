import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService }          from '../../../core/services/auth.service';
import { AppointmentsService }  from '../../../core/services/appointments.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import { ToastService }    from '../../../core/services/toast.service';
import { QueueService }    from '../../../core/services/queue.service';
import {
  QueueEntry,
  QueueStatus,
  QueueStatusLabels,
  QueueStatusColor,
} from '../../../core/models/queue.model';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import {
  CkPageHeaderComponent,
  CkCardComponent,
  CkBtnComponent,
  CkStatusBadgeComponent,
  CkEmptyStateComponent,
} from '../../../shared/index';

// Serving=0 → top; Waiting=1 → next (by queueNumber); Completed/Skipped=2 → bottom
const sortPriority = (s: QueueStatus): number => {
  if (s === QueueStatus.Serving) return 0;
  if (s === QueueStatus.Waiting) return 1;
  return 2;
};

const PAGE_SIZE = 10;

@Component({
  selector: 'app-queue-manager',
  templateUrl: './queue-manager.component.html',
  styleUrl:    './queue-manager.component.scss',
  standalone: true,
  imports: [
    TranslatePipe,
    MatProgressSpinnerModule,
    CkPageHeaderComponent,
    CkCardComponent,
    CkBtnComponent,
    CkStatusBadgeComponent,
    CkEmptyStateComponent,
  ],
})
export class QueueManagerComponent implements OnInit {

  // ── DI ──────────────────────────────────────────────────────────────────────
  readonly router       = inject(Router);
  readonly langService  = inject(LanguageService);
  readonly themeService = inject(ThemeService);
  private readonly svc        = inject(QueueService);
  private readonly apptSvc    = inject(AppointmentsService);
  private readonly auth       = inject(AuthService);
  private readonly toast      = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ────────────────────────────────────────────────────────────────────
  entries     = signal<QueueEntry[]>([]);
  todayAppts  = signal<Appointment[]>([]);
  loading     = signal(false);
  actionId    = signal<string | null>(null);
  enqueuingId = signal<string | null>(null);
  searchQuery = signal('');
  page        = signal(1);

  // ── Sorted + filtered + paginated ────────────────────────────────────────────
  sortedFiltered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.entries()
      .filter(e =>
        !q ||
        e.patientName.toLowerCase().includes(q) ||
        e.patientPhone.includes(q)
      )
      .sort((a, b) => {
        const pa = sortPriority(a.status), pb = sortPriority(b.status);
        if (pa !== pb) return pa - pb;
        return a.queueNumber - b.queueNumber;
      });
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedFiltered().length / PAGE_SIZE))
  );

  paginated = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * PAGE_SIZE;
    return this.sortedFiltered().slice(start, start + PAGE_SIZE);
  });

  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  // ── Summary counters (always from full entries, not filtered) ─────────────
  waiting    = computed(() => this.entries().filter(e => e.status === QueueStatus.Waiting));
  waitingCnt = computed(() => this.waiting().length);
  servedCnt  = computed(() => this.entries().filter(e => e.status === QueueStatus.Completed).length);

  // Appointments not yet added to the queue
  notQueued = computed(() => {
    const queuedIds = new Set(this.entries().map(e => e.appointmentId));
    return this.todayAppts().filter(a =>
      !queuedIds.has(a.id) &&
      a.status !== AppointmentStatus.Cancelled &&
      a.status !== AppointmentStatus.NoShow
    );
  });

  // ── Constants exposed to template ────────────────────────────────────────────
  readonly QueueStatus      = QueueStatus;
  readonly QueueStatusColor = QueueStatusColor;

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  private pollHandle?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.load();
    this.loadTodayAppts();

    this.pollHandle = setInterval(() => this.load(), 15_000);
    this.destroyRef.onDestroy(() => clearInterval(this.pollHandle));
  }

  // ── Data ──────────────────────────────────────────────────────────────────────
  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.svc.getToday().subscribe({
      next: items => { this.entries.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadTodayAppts(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.apptSvc.getDaily(today).subscribe({
      next: appts => this.todayAppts.set(appts),
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────────
  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.page.set(1); // reset to first page on new search
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.page.set(1);
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  goTo(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  callNext(): void {
    if (this.waitingCnt() === 0) return;
    this.loading.set(true);
    this.svc.callNext().subscribe({
      next: () => {
        this.toast.success(this.langService.translate('QUEUE.CALL_NEXT_SUCCESS'));
        this.loading.set(false);
        this.load();
      },
      error: () => this.loading.set(false),
    });
  }

  complete(entry: QueueEntry): void {
    this.actionId.set(entry.id);
    this.svc.complete(entry.id).subscribe({
      next: updated => {
        this.entries.update(list => list.map(e => e.id === updated.id ? updated : e));
        this.actionId.set(null);
      },
      error: () => this.actionId.set(null),
    });
  }

  skip(entry: QueueEntry): void {
    this.actionId.set(entry.id);
    this.svc.skip(entry.id).subscribe({
      next: updated => {
        this.entries.update(list => list.map(e => e.id === updated.id ? updated : e));
        this.actionId.set(null);
      },
      error: () => this.actionId.set(null),
    });
  }

  enqueue(appt: Appointment): void {
    this.enqueuingId.set(appt.id);
    this.svc.enqueue(appt.id).subscribe({
      next: entry => {
        this.entries.update(list => [...list, entry]);
        this.enqueuingId.set(null);
        this.toast.success(this.langService.translate('QUEUE.ENQUEUE_SUCCESS'));
      },
      error: () => this.enqueuingId.set(null),
    });
  }

  openDisplayScreen(): void {
    const tenantId = this.auth.currentUser()?.tenantId ?? '';
    window.open(`/queue-display?tenantId=${tenantId}`, '_blank');
  }

  // ── Display helpers ───────────────────────────────────────────────────────────
  statusLabel(status: QueueStatus): string {
    return this.langService.translate(QueueStatusLabels[status]);
  }

  statusColor(status: QueueStatus): string {
    return QueueStatusColor[status];
  }

  isActionable(entry: QueueEntry): boolean {
    return entry.status === QueueStatus.Waiting || entry.status === QueueStatus.Serving;
  }
}

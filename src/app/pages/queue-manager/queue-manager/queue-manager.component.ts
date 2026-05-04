import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService }     from '../../../core/services/auth.service';
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
import {
  CkPageHeaderComponent,
  CkCardComponent,
  CkBtnComponent,
  CkStatusBadgeComponent,
  CkEmptyStateComponent,
} from '../../../shared/index';

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
  readonly router      = inject(Router);
  readonly langService = inject(LanguageService);
  readonly themeService = inject(ThemeService);
  private readonly svc  = inject(QueueService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ────────────────────────────────────────────────────────────────────
  entries  = signal<QueueEntry[]>([]);
  loading  = signal(false);
  actionId = signal<string | null>(null); // entry currently being acted on

  // ── Computed ─────────────────────────────────────────────────────────────────
  serving    = computed(() => this.entries().find(e => e.status === QueueStatus.Serving) ?? null);
  waiting    = computed(() => this.entries().filter(e => e.status === QueueStatus.Waiting));
  waitingCnt = computed(() => this.waiting().length);
  servedCnt  = computed(() => this.entries().filter(e => e.status === QueueStatus.Completed).length);

  // ── Constants exposed to template ────────────────────────────────────────────
  readonly QueueStatus      = QueueStatus;
  readonly QueueStatusColor = QueueStatusColor;

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  private pollHandle?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.load();

    // Auto-refresh every 15 seconds
    this.pollHandle = setInterval(() => this.load(), 15_000);
    this.destroyRef.onDestroy(() => clearInterval(this.pollHandle));
  }

  // ── Data ──────────────────────────────────────────────────────────────────────
  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.svc.getToday().subscribe({
      next: items => {
        this.entries.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  callNext(): void {
    if (this.waitingCnt() === 0) return;
    this.loading.set(true);
    this.svc.callNext().subscribe({
      next: () => {
        this.toast.success(this.langService.translate('QUEUE.CALL_NEXT_SUCCESS'));
        this.load();
      },
      error: () => this.loading.set(false),
    });
  }

  complete(entry: QueueEntry): void {
    this.actionId.set(entry.id);
    this.svc.complete(entry.id).subscribe({
      next: updated => {
        this.entries.update(list =>
          list.map(e => e.id === updated.id ? updated : e));
        this.actionId.set(null);
      },
      error: () => this.actionId.set(null),
    });
  }

  skip(entry: QueueEntry): void {
    this.actionId.set(entry.id);
    this.svc.skip(entry.id).subscribe({
      next: updated => {
        this.entries.update(list =>
          list.map(e => e.id === updated.id ? updated : e));
        this.actionId.set(null);
      },
      error: () => this.actionId.set(null),
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

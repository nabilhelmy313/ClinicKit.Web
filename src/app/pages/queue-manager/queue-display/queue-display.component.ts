import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute }          from '@angular/router';
import { TranslatePipe }           from '../../../core/pipes/translate.pipe';
import { LanguageService }         from '../../../core/services/language.service';
import { QueueService }            from '../../../core/services/queue.service';
import { QueueSignalRService }     from '../../../core/services/queue-signalr.service';
import {
  QueueEntry,
  QueueStatus,
  QueueStatusResponse,
} from '../../../core/models/queue.model';

@Component({
  selector: 'app-queue-display',
  templateUrl: './queue-display.component.html',
  styleUrl:    './queue-display.component.scss',
  standalone: true,
  imports: [
    TranslatePipe,
  ],
})
export class QueueDisplayComponent implements OnInit {

  // ── DI ──────────────────────────────────────────────────────────────────────
  readonly langService = inject(LanguageService);
  private readonly svc        = inject(QueueService);
  private readonly signalR    = inject(QueueSignalRService);
  private readonly route      = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ────────────────────────────────────────────────────────────────────
  status   = signal<QueueStatusResponse | null>(null);
  tenantId = '';

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.tenantId = this.route.snapshot.queryParamMap.get('tenantId') ?? '';

    // Initial HTTP load so the screen is populated immediately on open
    this.svc.getStatus(this.tenantId || undefined).subscribe({
      next: s => this.status.set(s),
    });

    // Real-time updates via SignalR (replaces 5-second polling)
    this.signalR.connect(this.tenantId);

    const sub = this.signalR.queueUpdated$.subscribe(entries =>
      this.status.set(this.toStatusResponse(entries))
    );
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  // ── Compute QueueStatusResponse from the full entry list ─────────────────────
  private toStatusResponse(entries: QueueEntry[]): QueueStatusResponse {
    const waiting = entries
      .filter(e => e.status === QueueStatus.Waiting)
      .sort((a, b) => a.queueNumber - b.queueNumber);

    return {
      currentlyServing: entries.find(e => e.status === QueueStatus.Serving) ?? null,
      next:             waiting.slice(0, 3),
      waitingCount:     waiting.length,
      servedCount:      entries.filter(e => e.status === QueueStatus.Completed).length,
      totalCount:       entries.length,
    };
  }
}

import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute }      from '@angular/router';
import { TranslatePipe }       from '../../../core/pipes/translate.pipe';
import { LanguageService }     from '../../../core/services/language.service';
import { QueueService }        from '../../../core/services/queue.service';
import { QueueStatusResponse } from '../../../core/models/queue.model';

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
  private readonly svc   = inject(QueueService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ────────────────────────────────────────────────────────────────────
  status   = signal<QueueStatusResponse | null>(null);
  tenantId = '';   // read from ?tenantId= query param

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  private pollHandle?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Read tenantId from URL query param (?tenantId=...)
    this.tenantId = this.route.snapshot.queryParamMap.get('tenantId') ?? '';

    this.load();

    // Refresh every 5 seconds (silent — no loading state)
    this.pollHandle = setInterval(() => this.load(), 5_000);
    this.destroyRef.onDestroy(() => clearInterval(this.pollHandle));
  }

  private load(): void {
    this.svc.getStatus(this.tenantId || undefined).subscribe({
      next: s => this.status.set(s),
    });
  }
}

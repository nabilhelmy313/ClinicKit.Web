import { Injectable, OnDestroy } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { QueueEntry } from '../models/queue.model';

/**
 * Singleton SignalR service for real-time queue updates.
 * Both QueueManagerComponent and QueueDisplayComponent subscribe to queueUpdated$.
 *
 * Usage:
 *   await signalRSvc.connect(tenantId);
 *   signalRSvc.queueUpdated$.subscribe(entries => ...);
 *
 * The connection is shared — multiple connects with the same tenantId are no-ops.
 */
@Injectable({ providedIn: 'root' })
export class QueueSignalRService implements OnDestroy {

  private connection?: HubConnection;
  private connectedTenantId?: string;

  /** Emits the full today-queue list whenever the server broadcasts a change. */
  readonly queueUpdated$ = new Subject<QueueEntry[]>();

  async connect(tenantId: string): Promise<void> {
    // Already connected to this tenant — nothing to do
    if (
      this.connection?.state === HubConnectionState.Connected &&
      this.connectedTenantId === tenantId
    ) return;

    // Stop existing connection if tenant changed
    if (this.connection) await this.stop();

    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/queue')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('queueUpdated', (entries: QueueEntry[]) => {
      this.queueUpdated$.next(entries);
    });

    // Rejoin group after automatic reconnect
    this.connection.onreconnected(async () => {
      if (tenantId) await this.connection!.invoke('JoinTenantGroup', tenantId);
    });

    await this.connection.start();
    await this.connection.invoke('JoinTenantGroup', tenantId);
    this.connectedTenantId = tenantId;
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection      = undefined;
      this.connectedTenantId = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}

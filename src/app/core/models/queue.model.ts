// ── Queue domain models ────────────────────────────────────────────────────────

export enum QueueStatus {
  Waiting   = 0,
  Serving   = 1,
  Completed = 2,
  Skipped   = 3,
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const QueueStatusLabels: Record<QueueStatus, string> = {
  [QueueStatus.Waiting]:   'QUEUE.STATUS_WAITING',
  [QueueStatus.Serving]:   'QUEUE.STATUS_SERVING',
  [QueueStatus.Completed]: 'QUEUE.STATUS_COMPLETED',
  [QueueStatus.Skipped]:   'QUEUE.STATUS_SKIPPED',
};

export const QueueStatusColor: Record<QueueStatus, string> = {
  [QueueStatus.Waiting]:   'warning',
  [QueueStatus.Serving]:   'primary',
  [QueueStatus.Completed]: 'success',
  [QueueStatus.Skipped]:   'secondary',
};

// ── Response shapes ───────────────────────────────────────────────────────────

export interface QueueEntry {
  id:            string;
  queueNumber:   number;
  queueDate:     string;          // "YYYY-MM-DD"
  status:        QueueStatus;
  appointmentId: string;
  patientName:   string;
  patientPhone:  string;
  startTime:     string;          // "HH:mm"
  calledAt:      string | null;
  completedAt:   string | null;
}

export interface QueueStatusResponse {
  currentlyServing: QueueEntry | null;
  next:             QueueEntry[];   // next 3 waiting
  waitingCount:     number;
  servedCount:      number;
  totalCount:       number;
}

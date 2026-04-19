import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToggleService {
  private _sidebarOpen = signal(false);

  /** Whether the sidebar is currently open (collapsed on mobile). */
  readonly sidebarOpen = this._sidebarOpen.asReadonly();

  toggle(): void {
    this._sidebarOpen.update(v => !v);
  }

  open(): void {
    this._sidebarOpen.set(true);
  }

  close(): void {
    this._sidebarOpen.set(false);
  }
}

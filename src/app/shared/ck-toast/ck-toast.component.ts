import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type CkToastType = 'success' | 'error' | 'info' | 'warn';

export interface CkToastData {
  type:    CkToastType;
  message: string;
  title?:  string;
  isRtl:   boolean;
}

const ICONS: Record<CkToastType, string> = {
  success: 'check_circle',
  error:   'error',
  info:    'info',
  warn:    'warning',
};

@Component({
  selector: 'ck-toast',
  standalone: true,
  encapsulation: ViewEncapsulation.None,   // styles must pierce the CDK overlay
  imports: [CommonModule],
  template: `
    <div class="ckt-toast ckt-toast--{{ data.type }}"
         [dir]="data.isRtl ? 'rtl' : 'ltr'">

      <!-- Icon badge -->
      <div class="ckt-toast__icon">
        <span class="material-icons">{{ icon }}</span>
      </div>

      <!-- Text -->
      <div class="ckt-toast__body">
        @if (data.title) {
          <p class="ckt-toast__title">{{ data.title }}</p>
        }
        <p class="ckt-toast__message">{{ data.message }}</p>
      </div>

      <!-- Close -->
      <button class="ckt-toast__close" type="button" (click)="ref.dismiss()">
        <span class="material-icons">close</span>
      </button>

    </div>
  `,
  styles: [`
    /* ── Container ──────────────────────────────────────────────────────────── */
    .mat-mdc-snack-bar-container.ck-toast-panel {
      padding: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      min-width: 0 !important;
      max-width: 420px !important;
    }

    .mat-mdc-snack-bar-container.ck-toast-panel .mdc-snackbar__surface {
      padding: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      min-width: 0 !important;
    }

    /* ── Toast card ─────────────────────────────────────────────────────────── */
    .ckt-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      min-width: 280px;
      max-width: 420px;
      box-shadow: 0 8px 32px rgba(0,0,0,.14), 0 2px 8px rgba(0,0,0,.08);
      border: 1px solid transparent;
      animation: ckt-toast-in 0.25s cubic-bezier(.22,.68,0,1.2) both;
      font-family: inherit;
    }

    @keyframes ckt-toast-in {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }

    /* ── Colour variants ────────────────────────────────────────────────────── */
    .ckt-toast--success {
      background: #f0faf5;
      border-color: #b2dfcc;
      .ckt-toast__icon { color: #0D5238; background: #d4f0e2; }
      .ckt-toast__title { color: #0D5238; }
    }

    .ckt-toast--error {
      background: #fff5f5;
      border-color: #fecaca;
      .ckt-toast__icon { color: #b91c1c; background: #fee2e2; }
      .ckt-toast__title { color: #b91c1c; }
    }

    .ckt-toast--info {
      background: #eff6ff;
      border-color: #bfdbfe;
      .ckt-toast__icon { color: #1d4ed8; background: #dbeafe; }
      .ckt-toast__title { color: #1d4ed8; }
    }

    .ckt-toast--warn {
      background: #fffbeb;
      border-color: #fde68a;
      .ckt-toast__icon { color: #92400e; background: #fef3c7; }
      .ckt-toast__title { color: #92400e; }
    }

    /* ── Dark mode ──────────────────────────────────────────────────────────── */
    .dark-theme .ckt-toast--success {
      background: #0d2e1f;
      border-color: #1a5c38;
      .ckt-toast__message { color: rgba(255,255,255,.75); }
    }
    .dark-theme .ckt-toast--error {
      background: #2d1010;
      border-color: #7f1d1d;
      .ckt-toast__message { color: rgba(255,255,255,.75); }
    }
    .dark-theme .ckt-toast--info {
      background: #0f1e3d;
      border-color: #1e3a8a;
      .ckt-toast__message { color: rgba(255,255,255,.75); }
    }
    .dark-theme .ckt-toast--warn {
      background: #2d1f00;
      border-color: #78350f;
      .ckt-toast__message { color: rgba(255,255,255,.75); }
    }

    /* ── Icon badge ─────────────────────────────────────────────────────────── */
    .ckt-toast__icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;

      .material-icons { font-size: 20px; }
    }

    /* ── Text ───────────────────────────────────────────────────────────────── */
    .ckt-toast__body {
      flex: 1;
      min-width: 0;
    }

    .ckt-toast__title {
      margin: 0 0 2px;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
    }

    .ckt-toast__message {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: #444;
      white-space: pre-line;   /* supports \n for multiple validation errors */
    }

    /* ── Close button ───────────────────────────────────────────────────────── */
    .ckt-toast__close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      border-radius: 50%;
      color: #aaa;
      display: flex;
      align-items: center;
      transition: color .15s, background .15s;
      margin-top: -2px;

      .material-icons { font-size: 17px; }

      &:hover { color: #555; background: rgba(0,0,0,.06); }
    }

    .dark-theme .ckt-toast__close {
      color: rgba(255,255,255,.3);
      &:hover { color: rgba(255,255,255,.7); background: rgba(255,255,255,.08); }
    }
  `],
})
export class CkToastComponent {
  readonly data = inject<CkToastData>(MAT_SNACK_BAR_DATA);
  readonly ref  = inject(MatSnackBarRef);

  get icon(): string { return ICONS[this.data.type]; }
}

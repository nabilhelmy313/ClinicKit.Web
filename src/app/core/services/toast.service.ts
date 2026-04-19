import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'toast-success', 3000);
  }

  error(message: string): void {
    this.open(message, 'toast-error', 5000);
  }

  info(message: string): void {
    this.open(message, 'toast-info', 3000);
  }

  warn(message: string): void {
    this.open(message, 'toast-warn', 3000);
  }

  private open(message: string, panelClass: string, duration: number): void {
    this.snackBar.open(message, '✕', {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}

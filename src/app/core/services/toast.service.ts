import { Injectable, inject } from '@angular/core';
import { MatSnackBar }        from '@angular/material/snack-bar';
import { LanguageService }    from './language.service';
import { CkToastComponent, CkToastData, CkToastType } from '../../shared/ck-toast/ck-toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly lang     = inject(LanguageService);

  success(message: string, title?: string): void { this.open('success', message, title, 3500); }
  error  (message: string, title?: string): void { this.open('error',   message, title, 6000); }
  info   (message: string, title?: string): void { this.open('info',    message, title, 3500); }
  warn   (message: string, title?: string): void { this.open('warn',    message, title, 4000); }

  private open(type: CkToastType, message: string, title: string | undefined, duration: number): void {
    const data: CkToastData = {
      type,
      message,
      title,
      isRtl: this.lang.isRTL(),
    };

    this.snackBar.openFromComponent(CkToastComponent, {
      data,
      duration,
      panelClass:         ['ck-toast-panel'],
      horizontalPosition: 'center',
      verticalPosition:   'bottom',
    });
  }
}

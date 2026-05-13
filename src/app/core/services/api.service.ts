import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ToastService }    from './toast.service';
import { LanguageService } from './language.service';
import { ApiError }        from '../models/api.models';
import { environment }     from '../../../environments/environment';

/**
 * Base HTTP helper shared by all feature API services.
 *
 * Provides:
 *  • A typed get/post/put/delete wrapper around HttpClient.
 *  • Centralised error handling — shows a toast and re-throws.
 *  • Builds the full URL from environment.apiUrl automatically.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly http = inject(HttpClient);
  private readonly toast  = inject(ToastService);
  private readonly lang   = inject(LanguageService);

  protected readonly base = environment.apiUrl;

  // ── HTTP helpers ──────────────────────────────────────────────────────────

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http
      .get<T>(`${this.base}${path}`, { params: this.buildParams(params) })
      .pipe(catchError(err => this.handleError(err)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.base}${path}`, body)
      .pipe(catchError(err => this.handleError(err)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(`${this.base}${path}`, body)
      .pipe(catchError(err => this.handleError(err)));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<T>(`${this.base}${path}`, body)
      .pipe(catchError(err => this.handleError(err)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(`${this.base}${path}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Error handling ────────────────────────────────────────────────────────

  private handleError(err: { status?: number; error?: ApiError }): Observable<never> {
    const apiErr = err.error;
    const status = err.status ?? 0;
    let message: string;
    let title:   string | undefined;

    if (apiErr?.errors) {
      // 422 — field-level validation: show every message, one per line
      const msgs = Object.values(apiErr.errors).flat().filter(Boolean);
      title   = this.lang.translate('ERRORS.VALIDATION');
      message = msgs.length > 0 ? msgs.join('\n') : this.lang.translate('ERRORS.VALIDATION');

    } else if (status === 400 && apiErr?.title) {
      // 400 Bad Request — backend message is specific, show it as-is
      message = apiErr.title;

    } else if (status === 401) {
      message = this.lang.translate('ERRORS.UNAUTHORIZED');

    } else if (status === 404) {
      message = this.lang.translate('ERRORS.NOT_FOUND');

    } else if (status === 0) {
      message = this.lang.translate('ERRORS.NETWORK');

    } else {
      // 500 or anything else — generic translated message
      message = this.lang.translate('ERRORS.SERVER_ERROR');
    }

    this.toast.error(message, title);
    return throwError(() => err);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildParams(obj?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    if (!obj) return params;
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

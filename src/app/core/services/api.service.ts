import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';
import { ApiError } from '../models/api.models';
import { environment } from '../../../environments/environment.development';

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
  protected readonly http   = inject(HttpClient);
  private   readonly toast  = inject(ToastService);

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

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(`${this.base}${path}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Error handling ────────────────────────────────────────────────────────

  private handleError(err: { status?: number; error?: ApiError }): Observable<never> {
    const message = err.error?.message ?? 'حدث خطأ غير متوقع';
    this.toast.error(message);
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

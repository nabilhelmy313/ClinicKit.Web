import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  LoginRequest,
  RefreshRequest,
  AuthResponse,
  TokenPayload,
  CurrentUser,
} from '../models/auth.models';
import { environment } from '../../../environments/environment.development';

const ACCESS_TOKEN_KEY  = 'ck_access_token';
const REFRESH_TOKEN_KEY = 'ck_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http       = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  // Evaluated lazily after inject() so platformId is available
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Signals — safe on SSR (returns null on server)
  private readonly _accessToken  = signal<string | null>(
    this.isBrowser ? localStorage.getItem(ACCESS_TOKEN_KEY)  : null
  );
  private readonly _refreshToken = signal<string | null>(
    this.isBrowser ? localStorage.getItem(REFRESH_TOKEN_KEY) : null
  );

  // ── Public signals ────────────────────────────────────────────────────────

  readonly accessToken  = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();

  readonly isAuthenticated = computed(() => {
    const token = this._accessToken();
    if (!token) return false;
    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });

  readonly currentUser = computed<CurrentUser | null>(() => {
    const token = this._accessToken();
    if (!token) return null;
    try {
      const p = this.decodeToken(token);
      return {
        userId:   p.sub,
        email:    p.email,
        tenantId: p.tenant_id,
        roles:    Array.isArray(p.role) ? p.role : [p.role],
      };
    } catch {
      return null;
    }
  });

  // ── API calls ─────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, credentials)
      .pipe(tap(res => this.storeTokens(res)));
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    const body: RefreshRequest = { refreshToken };
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/refresh`, body)
      .pipe(
        tap(res => this.storeTokens(res)),
        catchError(err => {
          this.clearTokens();
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    const refreshToken = this._refreshToken();
    if (refreshToken) {
      this.http
        .post(`${environment.apiUrl}/api/auth/revoke`, { refreshToken })
        .subscribe({ error: () => {} });
    }
    this.clearTokens();
    this.router.navigate(['/authentication/sign-in']);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private storeTokens(res: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(ACCESS_TOKEN_KEY,  res.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    }
    this._accessToken.set(res.accessToken);
    this._refreshToken.set(res.refreshToken);
  }

  private clearTokens(): void {
    if (this.isBrowser) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    this._accessToken.set(null);
    this._refreshToken.set(null);
  }

  decodeToken(token: string): TokenPayload {
    const base64Payload = token.split('.')[1];
    const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as TokenPayload;
  }
}

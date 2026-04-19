// ── Request shapes ────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RevokeRequest {
  refreshToken: string;
}

// ── Response shapes (match AuthResponse record in the backend) ────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;   // ISO 8601 datetime string
  refreshTokenExpiresAt: string;
}

// ── Decoded JWT payload ────────────────────────────────────────────────────────
// Claims embedded by JwtService:
//   sub, email, tenant_id, role (may repeat), jti, + permission claims

export interface TokenPayload {
  sub: string;           // userId (GUID)
  email: string;
  tenant_id: string;
  role: string | string[];
  jti: string;
  exp: number;           // unix epoch
  iat: number;
  [key: string]: unknown; // permission claims
}

// ── Convenience view model used by components ─────────────────────────────────

export interface CurrentUser {
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
}

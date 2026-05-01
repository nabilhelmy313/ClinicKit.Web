// ── Shared API response models ────────────────────────────────────────────────
// Used by all feature API services and facades.

/** Standard paginated response from the backend. */
export interface PagedResult<T> {
  items:      T[];
  totalCount: number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

/** Standard query params for any paginated list endpoint. */
export interface PagedQuery {
  page?:     number;
  pageSize?: number;
  search?:   string;
  sortBy?:   string;
  sortDir?:  'asc' | 'desc';
}

/** API error shape returned by the backend GlobalExceptionHandler. */
export interface ApiError {
  status:  number;
  message: string;
  errors?: Record<string, string[]>;
}

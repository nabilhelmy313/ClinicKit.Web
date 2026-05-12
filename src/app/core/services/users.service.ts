import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PagedResult } from '../models/api.models';
import { AppUser, CreateUserRequest, UpdateUserRoleRequest, ResetPasswordRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService extends ApiService {

  list(params?: { search?: string; page?: number; pageSize?: number }): Observable<PagedResult<AppUser>> {
    return this.get<PagedResult<AppUser>>('/api/users', params as Record<string, unknown>);
  }

  getById(id: string): Observable<AppUser> {
    return this.get<AppUser>(`/api/users/${id}`);
  }

  create(body: CreateUserRequest): Observable<AppUser> {
    return this.post<AppUser>('/api/users', body);
  }

  updateRole(id: string, body: UpdateUserRoleRequest): Observable<AppUser> {
    return this.put<AppUser>(`/api/users/${id}/role`, body);
  }

  resetPassword(id: string, body: ResetPasswordRequest): Observable<void> {
    return this.put<void>(`/api/users/${id}/reset-password`, body);
  }

  toggle(id: string, isActive: boolean): Observable<void> {
    return this.put<void>(`/api/users/${id}/toggle`, { isActive });
  }
}

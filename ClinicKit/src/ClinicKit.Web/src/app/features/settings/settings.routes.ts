import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  { path: '', redirectTo: 'clinic', pathMatch: 'full' },
  {
    path: 'clinic',
    loadComponent: () =>
      import('./clinic-profile/clinic-profile.component').then(m => m.ClinicProfileComponent),
    title: 'Clinic Profile — ClinicKit',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./user-management/user-management.component').then(m => m.UserManagementComponent),
    title: 'Users & Roles — ClinicKit',
  },
  {
    path: 'tenants',
    loadComponent: () =>
      import('./tenants/tenants.component').then(m => m.TenantsComponent),
    title: 'Tenants — ClinicKit',
  },
];

import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  { path: '', redirectTo: 'invoices', pathMatch: 'full' },
  {
    path: 'invoices',
    loadComponent: () =>
      import('./invoices/invoices.component').then(m => m.InvoicesComponent),
    title: 'Invoices — ClinicKit',
  },
  {
    path: 'payments',
    loadComponent: () =>
      import('./payments/payments.component').then(m => m.PaymentsComponent),
    title: 'Payments — ClinicKit',
  },
  {
    path: 'insurance',
    loadComponent: () =>
      import('./insurance/insurance.component').then(m => m.InsuranceComponent),
    title: 'Insurance — ClinicKit',
  },
];

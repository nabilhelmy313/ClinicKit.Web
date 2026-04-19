import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./patients-list/patients-list.component')
        .then(m => m.PatientsListComponent),
    title: 'All Patients — ClinicKit',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./patient-form/patient-form.component')
        .then(m => m.PatientFormComponent),
    title: 'Register Patient — ClinicKit',
  },
  {
    path: 'records',
    loadComponent: () =>
      import('./medical-records/medical-records.component')
        .then(m => m.MedicalRecordsComponent),
    title: 'Medical Records — ClinicKit',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./patient-detail/patient-detail.component')
        .then(m => m.PatientDetailComponent),
    title: 'Patient Profile — ClinicKit',
  },
];

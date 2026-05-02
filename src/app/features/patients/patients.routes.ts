import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./patients-list/patients-list.component')
        .then(m => m.PatientsListComponent),
    title: 'المرضى — طَبَّبَ',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./patient-form/patient-form.component')
        .then(m => m.PatientFormComponent),
    title: 'إضافة مريض — طَبَّبَ',
  },
  {
    path: 'records',
    loadComponent: () =>
      import('./medical-records/medical-records.component')
        .then(m => m.MedicalRecordsComponent),
    title: 'السجلات الطبية — طَبَّبَ',
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./patient-form/patient-form.component')
        .then(m => m.PatientFormComponent),
    title: 'تعديل المريض — طَبَّبَ',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./patient-detail/patient-detail.component')
        .then(m => m.PatientDetailComponent),
    title: 'ملف المريض — طَبَّبَ',
  },
];

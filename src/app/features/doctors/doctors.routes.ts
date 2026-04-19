import { Routes } from '@angular/router';

export const DOCTORS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./doctors-list/doctors-list.component')
        .then(m => m.DoctorsListComponent),
    title: 'Doctors — ClinicKit',
  },
  {
    path: 'schedule',
    loadComponent: () =>
      import('./doctors-schedule/doctors-schedule.component')
        .then(m => m.DoctorsScheduleComponent),
    title: 'Doctor Schedules — ClinicKit',
  },
  {
    path: 'departments',
    loadComponent: () =>
      import('./departments/departments.component')
        .then(m => m.DepartmentsComponent),
    title: 'Departments — ClinicKit',
  },
];

import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./appointments-list/appointments-list.component')
        .then(m => m.AppointmentsListComponent),
    title: 'المواعيد — طَبَّبَ',
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./appointments-calendar/appointments-calendar.component')
        .then(m => m.AppointmentsCalendarComponent),
    title: 'تقويم المواعيد — طَبَّبَ',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./appointment-form/appointment-form.component')
        .then(m => m.AppointmentFormComponent),
    title: 'حجز موعد — طَبَّبَ',
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./appointment-form/appointment-form.component')
        .then(m => m.AppointmentFormComponent),
    title: 'تعديل الموعد — طَبَّبَ',
  },
];

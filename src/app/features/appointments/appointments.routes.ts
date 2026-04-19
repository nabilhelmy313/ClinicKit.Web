import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./appointments-list/appointments-list.component')
        .then(m => m.AppointmentsListComponent),
    title: 'Appointments — ClinicKit',
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./appointments-calendar/appointments-calendar.component')
        .then(m => m.AppointmentsCalendarComponent),
    title: 'Appointment Calendar — ClinicKit',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./appointment-form/appointment-form.component')
        .then(m => m.AppointmentFormComponent),
    title: 'Book Appointment — ClinicKit',
  },
];

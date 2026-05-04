import { Routes } from '@angular/router';
import { NotFoundComponent } from './common/not-found/not-found.component';
import { authGuard }   from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [

    // ── Default redirect ──────────────────────────────────────────────────
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    // ── Dashboard ─────────────────────────────────────────────────────────
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/dashboard/dashboard.component')
                .then(m => m.DashboardComponent),
        title: 'Dashboard — ClinicKit',
    },

    // ── Patients ──────────────────────────────────────────────────────────
    {
        path: 'patients',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./pages/patients/patients-list/patients-list.component')
                        .then(m => m.PatientsListComponent),
                title: 'All Patients — ClinicKit',
            },
            {
                path: 'new',
                loadComponent: () =>
                    import('./pages/patients/patient-form/patient-form.component')
                        .then(m => m.PatientFormComponent),
                title: 'Register Patient — ClinicKit',
            },
            {
                path: 'records',
                loadComponent: () =>
                    import('./pages/patients/medical-records/medical-records.component')
                        .then(m => m.MedicalRecordsComponent),
                title: 'Medical Records — ClinicKit',
            },
            {
                path: ':id',
                loadComponent: () =>
                    import('./pages/patients/patient-detail/patient-detail.component')
                        .then(m => m.PatientDetailComponent),
                title: 'Patient Profile — ClinicKit',
            },
            {
                path: ':id/edit',
                loadComponent: () =>
                    import('./pages/patients/patient-form/patient-form.component')
                        .then(m => m.PatientFormComponent),
                title: 'Edit Patient — ClinicKit',
            },
        ],
    },

    // ── Appointments ──────────────────────────────────────────────────────
    {
        path: 'appointments',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./pages/appointments/appointments-list/appointments-list.component')
                        .then(m => m.AppointmentsListComponent),
                title: 'Appointments — ClinicKit',
            },
            {
                path: 'calendar',
                loadComponent: () =>
                    import('./pages/appointments/appointments-calendar/appointments-calendar.component')
                        .then(m => m.AppointmentsCalendarComponent),
                title: 'Calendar — ClinicKit',
            },
            {
                path: 'new',
                loadComponent: () =>
                    import('./pages/appointments/appointment-form/appointment-form.component')
                        .then(m => m.AppointmentFormComponent),
                title: 'Book Appointment — ClinicKit',
            },
            {
                path: ':id',
                loadComponent: () =>
                    import('./pages/appointments/appointment-detail/appointment-detail.component')
                        .then(m => m.AppointmentDetailComponent),
                title: 'Appointment Details — ClinicKit',
            },
            {
                path: ':id/edit',
                loadComponent: () =>
                    import('./pages/appointments/appointment-form/appointment-form.component')
                        .then(m => m.AppointmentFormComponent),
                title: 'Edit Appointment — ClinicKit',
            },
        ],
    },

    // ── Doctors ───────────────────────────────────────────────────────────
    {
        path: 'doctors',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./pages/doctors/doctors-list/doctors-list.component')
                        .then(m => m.DoctorsListComponent),
                title: 'Doctors — ClinicKit',
            },
            {
                path: 'schedule',
                loadComponent: () =>
                    import('./pages/doctors/doctors-schedule/doctors-schedule.component')
                        .then(m => m.DoctorsScheduleComponent),
                title: 'Doctor Schedules — ClinicKit',
            },
            {
                path: 'departments',
                loadComponent: () =>
                    import('./pages/doctors/departments/departments.component')
                        .then(m => m.DepartmentsComponent),
                title: 'Departments — ClinicKit',
            },
        ],
    },

    // ── Queue Manager ─────────────────────────────────────────────────────
    {
        path: 'queue-manager',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/queue-manager/queue-manager/queue-manager.component')
                .then(m => m.QueueManagerComponent),
        title: 'Queue Manager — ClinicKit',
    },

    // ── Queue Display — public, no auth, no sidebar ───────────────────────
    {
        path: 'queue-display',
        loadComponent: () =>
            import('./pages/queue-manager/queue-display/queue-display.component')
                .then(m => m.QueueDisplayComponent),
        title: 'Waiting Room — ClinicKit',
    },

    // ── Billing ───────────────────────────────────────────────────────────
    {
        path: 'billing',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'invoices', pathMatch: 'full' },
            {
                path: 'invoices',
                loadComponent: () =>
                    import('./pages/billing/invoices/invoices.component')
                        .then(m => m.InvoicesComponent),
                title: 'Invoices — ClinicKit',
            },
            {
                path: 'payments',
                loadComponent: () =>
                    import('./pages/billing/payments/payments.component')
                        .then(m => m.PaymentsComponent),
                title: 'Payments — ClinicKit',
            },
            {
                path: 'insurance',
                loadComponent: () =>
                    import('./pages/billing/insurance/insurance.component')
                        .then(m => m.InsuranceComponent),
                title: 'Insurance — ClinicKit',
            },
        ],
    },

    // ── Reports ───────────────────────────────────────────────────────────
    {
        path: 'reports',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/reports/reports.component')
                .then(m => m.ReportsComponent),
        title: 'Reports — ClinicKit',
    },

    // ── Settings ──────────────────────────────────────────────────────────
    {
        path: 'settings',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'clinic', pathMatch: 'full' },
            {
                path: 'clinic',
                loadComponent: () =>
                    import('./pages/settings/clinic-profile/clinic-profile.component')
                        .then(m => m.ClinicProfileComponent),
                title: 'Clinic Profile — ClinicKit',
            },
            {
                path: 'users',
                loadComponent: () =>
                    import('./pages/settings/user-management/user-management.component')
                        .then(m => m.UserManagementComponent),
                title: 'Users & Roles — ClinicKit',
            },
            {
                path: 'tenants',
                loadComponent: () =>
                    import('./pages/settings/tenants/tenants.component')
                        .then(m => m.TenantsComponent),
                title: 'Tenants — ClinicKit',
            },
        ],
    },

    // ── Auth (public only — redirects logged-in users to dashboard) ───────
    {
        path: 'authentication',
        children: [
            {
                path: 'sign-in',
                canActivate: [publicGuard],
                loadComponent: () =>
                    import('./authentication/sign-in/sign-in.component')
                        .then(m => m.SignInComponent),
                title: 'Sign In — ClinicKit',
            },
            {
                path: 'sign-up',
                canActivate: [publicGuard],
                loadComponent: () =>
                    import('./authentication/sign-up/sign-up.component')
                        .then(m => m.SignUpComponent),
                title: 'Sign Up — ClinicKit',
            },
            {
                path: 'forgot-password',
                loadComponent: () =>
                    import('./authentication/forgot-password/forgot-password.component')
                        .then(m => m.ForgotPasswordComponent),
                title: 'Forgot Password — ClinicKit',
            },
            {
                path: 'reset-password',
                loadComponent: () =>
                    import('./authentication/reset-password/reset-password.component')
                        .then(m => m.ResetPasswordComponent),
                title: 'Reset Password — ClinicKit',
            },
        ],
    },

    // ── 404 ───────────────────────────────────────────────────────────────
    { path: '**', component: NotFoundComponent, title: '404 — ClinicKit' },

];

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Router }        from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppointmentsService } from '../../../core/services/appointments.service';
import {
    Appointment,
    AppointmentStatusLabels,
    AppointmentTypeLabels,
} from '../../../core/models/appointment.model';
import { TranslatePipe }   from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService }    from '../../../core/services/theme.service';
import {
    CkPageHeaderComponent, CkCardComponent,
    CkBtnComponent, CkStatusBadgeComponent,
} from '../../../shared/index';

@Component({
    selector: 'app-appointments-calendar',
    standalone: true,
    templateUrl: './appointments-calendar.component.html',
    styleUrl:    './appointments-calendar.component.scss',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkStatusBadgeComponent,
    ],
})
export class AppointmentsCalendarComponent implements OnInit {
    readonly router       = inject(Router);
    private readonly svc  = inject(AppointmentsService);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);

    // ── State ─────────────────────────────────────────────────────────────────
    /** Any date inside the week we want to display. */
    anchor       = signal(new Date());
    appointments = signal<Appointment[]>([]);
    loading      = signal(false);

    // ── Computed ──────────────────────────────────────────────────────────────
    weekStart = computed(() => {
        const d = new Date(this.anchor());
        d.setDate(d.getDate() - d.getDay()); // roll back to Sunday
        d.setHours(0, 0, 0, 0);
        return d;
    });

    weekDays = computed<Date[]>(() =>
        Array.from({ length: 7 }, (_, i) => {
            const d = new Date(this.weekStart());
            d.setDate(d.getDate() + i);
            return d;
        }),
    );

    weekEnd = computed(() => this.weekDays()[6]);

    /** RTL-aware chevron icons for prev/next navigation. */
    prevIcon = computed(() => this.langService.isRTL() ? 'chevron_right' : 'chevron_left');
    nextIcon = computed(() => this.langService.isRTL() ? 'chevron_left'  : 'chevron_right');

    // ── Helpers ───────────────────────────────────────────────────────────────
    fmt(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    isToday(date: Date): boolean {
        return this.fmt(date) === this.fmt(new Date());
    }

    dayName(date: Date): string {
        return new Intl.DateTimeFormat(
            this.langService.isRTL() ? 'ar-EG' : 'en-US',
            { weekday: 'short' },
        ).format(date);
    }

    appointmentsForDay(date: Date): Appointment[] {
        const key = this.fmt(date);
        return this.appointments()
            .filter(a => a.appointmentDate === key)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    statusLabel(s: number): string {
        return AppointmentStatusLabels[s as keyof typeof AppointmentStatusLabels] ?? '—';
    }

    typeLabel(t: number): string {
        return AppointmentTypeLabels[t as keyof typeof AppointmentTypeLabels] ?? '—';
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    ngOnInit(): void { this.load(); }

    prevWeek(): void {
        const d = new Date(this.anchor());
        d.setDate(d.getDate() - 7);
        this.anchor.set(d);
        this.load();
    }

    nextWeek(): void {
        const d = new Date(this.anchor());
        d.setDate(d.getDate() + 7);
        this.anchor.set(d);
        this.load();
    }

    goToToday(): void {
        this.anchor.set(new Date());
        this.load();
    }

    // ── Data ──────────────────────────────────────────────────────────────────
    load(): void {
        this.loading.set(true);
        this.svc.list({
            fromDate: this.fmt(this.weekStart()),
            toDate:   this.fmt(this.weekEnd()),
            pageSize: 200,
        }).subscribe({
            next:  res => { this.appointments.set(res.items); this.loading.set(false); },
            error: ()  => this.loading.set(false),
        });
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    bookOnDay(date: Date): void {
        this.router.navigate(['/appointments/new'], {
            queryParams: { date: this.fmt(date) },
        });
    }

    viewPatient(appt: Appointment): void {
        this.router.navigate(['/patients', appt.patientId]);
    }
}

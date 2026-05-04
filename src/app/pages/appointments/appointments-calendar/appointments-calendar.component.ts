import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Router }        from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
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
        ReactiveFormsModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        MatNativeDateModule,
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
    anchor       = signal(new Date());
    appointments = signal<Appointment[]>([]);
    loading      = signal(false);
    viewMode     = signal<'week' | 'day'>('week');

    jumpControl = new FormControl<Date | null>(null);

    // Work hours 8 AM → 8 PM
    readonly WORK_START = 8;
    readonly WORK_END   = 20;
    readonly hours      = Array.from(
        { length: this.WORK_END - this.WORK_START + 1 },
        (_, i) => i + this.WORK_START,
    );

    // ── Computed ──────────────────────────────────────────────────────────────
    /**
     * Egypt week starts on Saturday (getDay() === 6).
     * Days to roll back: Sat→0, Sun→1, Mon→2, Tue→3, Wed→4, Thu→5, Fri→6
     */
    weekStart = computed(() => {
        const d = new Date(this.anchor());
        const daysBack = (d.getDay() + 1) % 7;
        d.setDate(d.getDate() - daysBack);
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

    prevIcon = computed(() => this.langService.isRTL() ? 'chevron_right' : 'chevron_left');
    nextIcon = computed(() => this.langService.isRTL() ? 'chevron_left'  : 'chevron_right');

    monthLabel = computed(() =>
        new Intl.DateTimeFormat(
            this.langService.isRTL() ? 'ar-EG' : 'en-US',
            { month: 'long', year: 'numeric' },
        ).format(this.anchor()),
    );

    /** Full localised date for day view header. */
    dayLabel = computed(() =>
        new Intl.DateTimeFormat(
            this.langService.isRTL() ? 'ar-EG' : 'en-US',
            { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
        ).format(this.anchor()),
    );

    weekNumber = computed(() => {
        const d   = new Date(this.weekStart());
        const jan = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(((d.getTime() - jan.getTime()) / 86_400_000 + jan.getDay() + 1) / 7);
    });

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

    appointmentsAtHour(hour: number): Appointment[] {
        const dayKey = this.fmt(this.anchor());
        return this.appointments()
            .filter(a => {
                if (a.appointmentDate !== dayKey) return false;
                return parseInt(a.startTime.substring(0, 2), 10) === hour;
            })
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    isCurrentHour(hour: number): boolean {
        return this.isToday(this.anchor()) && new Date().getHours() === hour;
    }

    formatHour(hour: number): string {
        return `${String(hour).padStart(2, '0')}:00`;
    }

    statusLabel(s: number): string {
        const key = AppointmentStatusLabels[s as keyof typeof AppointmentStatusLabels];
        return key ? this.langService.translate(key) : '—';
    }

    typeLabel(t: number): string {
        const key = AppointmentTypeLabels[t as keyof typeof AppointmentTypeLabels];
        return key ? this.langService.translate(key) : '—';
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    ngOnInit(): void { this.load(); }

    setView(mode: 'week' | 'day'): void { this.viewMode.set(mode); }

    prevPeriod(): void {
        const d = new Date(this.anchor());
        d.setDate(d.getDate() - (this.viewMode() === 'week' ? 7 : 1));
        this.anchor.set(d);
        this.load();
    }

    nextPeriod(): void {
        const d = new Date(this.anchor());
        d.setDate(d.getDate() + (this.viewMode() === 'week' ? 7 : 1));
        this.anchor.set(d);
        this.load();
    }

    goToToday(): void {
        this.anchor.set(new Date());
        this.load();
    }

    /** Click on a day number in week view → switch to day view for that date. */
    switchToDay(date: Date): void {
        this.anchor.set(new Date(date));
        this.viewMode.set('day');
    }

    onJump(event: MatDatepickerInputEvent<Date>): void {
        if (!event.value) return;
        this.anchor.set(event.value);
        this.jumpControl.setValue(null, { emitEvent: false });
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

    openAppointment(appt: Appointment): void {
        this.router.navigate(['/appointments', appt.id]);
    }
}

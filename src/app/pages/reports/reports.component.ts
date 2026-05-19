import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule }  from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { NgApexchartsModule }  from 'ng-apexcharts';
import type {
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexDataLabels,
    ApexStroke,
    ApexFill,
    ApexTooltip,
    ApexNonAxisChartSeries,
    ApexPlotOptions,
    ApexTheme,
    ApexGrid,
} from 'ng-apexcharts';

import { ReportsService }     from '../../core/services/reports.service';
import { LanguageService }    from '../../core/services/language.service';
import { BreakpointService }  from '../../core/services/breakpoint.service';
import { ThemeService }       from '../../core/services/theme.service';
import { TranslatePipe }      from '../../core/pipes/translate.pipe';
import {
    RevenueReport,
    AppointmentReport,
    TopServicesReport,
    PatientFlowReport,
    LowStockReport,
} from '../../core/models/report.model';
import {
    CkPageHeaderComponent,
    CkCardComponent,
    CkBtnComponent,
    CkTableComponent,
    CkCellDefDirective,
    CkTabsComponent,
} from '../../shared/index';
import type { CkColumnDef, CkTab } from '../../shared/index';

@Component({
    selector: 'app-reports',
    standalone: true,
    templateUrl: './reports.component.html',
    styleUrl:    './reports.component.scss',
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule,
        MatDatepickerModule,
        NgApexchartsModule,
        TranslatePipe,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent,
        CkTableComponent, CkCellDefDirective, CkTabsComponent,
    ],
})
export class ReportsComponent implements OnInit {
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    readonly bp           = inject(BreakpointService);
    private readonly svc  = inject(ReportsService);
    private readonly fb   = inject(FormBuilder);

    // ── Date range form ───────────────────────────────────────────────────────
    today = new Date();
    firstOfMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

    range = this.fb.group({
        from: [this.firstOfMonth],
        to:   [this.today],
    });

    // ── Active report tab ─────────────────────────────────────────────────────
    activeTab = signal('revenue');

    reportTabs: CkTab[] = [
        { key: 'revenue',      label: 'REPORTS.TAB_REVENUE',      icon: 'payments'        },
        { key: 'appointments', label: 'REPORTS.TAB_APPOINTMENTS', icon: 'event_available' },
        { key: 'patients',     label: 'REPORTS.TAB_PATIENTS',     icon: 'group_add'       },
        { key: 'services',     label: 'REPORTS.TAB_SERVICES',     icon: 'medical_services'},
        { key: 'lowstock',     label: 'REPORTS.TAB_LOW_STOCK',    icon: 'inventory_2'     },
    ];

    // ── Loading flags ─────────────────────────────────────────────────────────
    loadingRevenue     = signal(false);
    loadingAppointment = signal(false);
    loadingServices    = signal(false);
    loadingPatients    = signal(false);
    loadingLowStock    = signal(false);
    exporting          = signal(false);

    // ── Report data ───────────────────────────────────────────────────────────
    revenue     = signal<RevenueReport | null>(null);
    appointment = signal<AppointmentReport | null>(null);
    services    = signal<TopServicesReport | null>(null);
    patients    = signal<PatientFlowReport | null>(null);
    lowStock    = signal<LowStockReport | null>(null);

    // ── Reactive dark-mode helpers for charts ─────────────────────────────────
    /** ApexCharts theme — switches with the app theme */
    chartTheme = computed<ApexTheme>(() => ({
        mode: this.themeService.isDark() ? 'dark' : 'light',
    }));

    /** Card-surface background so charts match the card they sit in */
    private chartBg = computed(() =>
        this.themeService.isDark() ? '#1b232d' : '#ffffff');

    /** Grid line colour */
    chartGrid = computed<ApexGrid>(() => ({
        borderColor: this.themeService.isDark()
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(0,0,0,0.07)',
        strokeDashArray: 4,
    }));

    /** Axis label text colour */
    private axisLabelColor = computed(() =>
        this.themeService.isDark() ? 'rgba(255,255,255,0.45)' : '#607D8B');

    /** Tooltip dark/light */
    chartTooltip = computed<ApexTooltip>(() => ({
        theme: this.themeService.isDark() ? 'dark' : 'light',
    }));

    // ── Charts — Revenue ──────────────────────────────────────────────────────
    revenueSeries = computed<ApexAxisChartSeries>(() => {
        const r = this.revenue();
        if (!r) return [];
        return [
            { name: this.langService.translate('REPORTS.INVOICED'), data: r.rows.map(x => x.invoiced) },
            { name: this.langService.translate('REPORTS.PAID'),     data: r.rows.map(x => x.paid) },
        ];
    });

    revenueXAxis = computed<ApexXAxis>(() => ({
        categories: this.revenue()?.rows.map(x => x.date) ?? [],
        labels: {
            rotate: -45,
            style: { fontSize: '10px', colors: this.axisLabelColor() },
        },
    }));

    revenueChart = computed<ApexChart>(() => ({
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        background: this.chartBg(),
    }));

    revenueStroke:  ApexStroke        = { show: false };
    revenueColors                     = ['#0D5238', '#C8893A'];
    revenueDataLabels: ApexDataLabels = { enabled: false };
    revenuePlotOptions: ApexPlotOptions = {
        bar: { borderRadius: 5, columnWidth: '55%' },
    };
    revenueFill: ApexFill = {
        type: ['gradient', 'gradient'],
        gradient: {
            shade:         'light',
            type:          'vertical',
            shadeIntensity: 0.35,
            opacityFrom:   1,
            opacityTo:     0.65,
            stops:         [0, 100],
        },
    };

    // ── Charts — Appointments ─────────────────────────────────────────────────

    // Status → colour map (keyed by lowercase status string from backend)
    private readonly statusColorMap: Record<string, string> = {
        pending:    '#3B82F6',   // blue
        confirmed:  '#0D5238',   // sage green (brand primary)
        inprogress: '#C8893A',   // gold (brand accent)
        completed:  '#10B981',   // emerald
        cancelled:  '#6B7280',   // neutral gray
        noshow:     '#EF4444',   // red
    };

    // Derived colour array that always lines up with the actual data order
    apptDonutColors = computed<string[]>(() =>
        this.appointment()?.byStatus.map(x =>
            this.statusColorMap[x.status.toLowerCase()] ?? '#94A3B8'
        ) ?? []
    );

    apptDonutSeries = computed<ApexNonAxisChartSeries>(() =>
        this.appointment()?.byStatus.map(x => x.count) ?? []);

    apptDonutLabels = computed(() =>
        this.appointment()?.byStatus.map(x =>
            this.langService.translate(`REPORTS.APPT_STATUS.${x.status.toUpperCase()}`) || x.status
        ) ?? []);

    apptDonutChart = computed<ApexChart>(() => ({
        type: 'donut',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        background: this.chartBg(),
    }));

    apptDonutPlotOptions: ApexPlotOptions = {
        pie: {
            donut: {
                size: '68%',
                labels: {
                    show: true,
                    total: {
                        show: true,
                        fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#607D8B',
                    },
                    value: {
                        fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                        fontSize: '22px',
                        fontWeight: 700,
                    },
                },
            },
        },
    };

    apptDonutDataLabels: ApexDataLabels = {
        enabled: true,
        style: {
            fontSize: '11px',
            fontFamily: 'IBM Plex Sans Arabic, sans-serif',
            fontWeight: 600,
        },
        dropShadow: { enabled: false },
    };

    apptLineSeries = computed<ApexAxisChartSeries>(() => [{
        name: this.langService.translate('REPORTS.APPOINTMENTS'),
        data: this.appointment()?.byDay.map(x => x.count) ?? [],
    }]);

    apptLineXAxis = computed<ApexXAxis>(() => ({
        categories: this.appointment()?.byDay.map(x => x.date) ?? [],
        labels: {
            rotate: -45,
            style: { fontSize: '10px', colors: this.axisLabelColor() },
        },
    }));

    apptLineChart = computed<ApexChart>(() => ({
        type: 'area',
        height: 220,
        toolbar: { show: false },
        fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        background: this.chartBg(),
    }));

    apptFill: ApexFill     = {
        type: 'gradient',
        gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.1, opacityFrom: 0.50, opacityTo: 0.02, stops: [0, 90, 100] },
    };
    apptStroke: ApexStroke  = { curve: 'smooth', width: 2.5 };
    apptColors              = ['#0D5238'];

    // ── Charts — Patient Flow ─────────────────────────────────────────────────
    patientSeries = computed<ApexAxisChartSeries>(() => [{
        name: this.langService.translate('REPORTS.NEW_PATIENTS'),
        data: this.patients()?.rows.map(x => x.newPatients) ?? [],
    }]);

    patientXAxis = computed<ApexXAxis>(() => ({
        categories: this.patients()?.rows.map(x => x.date) ?? [],
        labels: {
            rotate: -45,
            style: { fontSize: '10px', colors: this.axisLabelColor() },
        },
    }));

    patientChart = computed<ApexChart>(() => ({
        type: 'area',
        height: 260,
        toolbar: { show: false },
        fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        background: this.chartBg(),
    }));

    patientFill: ApexFill    = {
        type: 'gradient',
        gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.1, opacityFrom: 0.50, opacityTo: 0.02, stops: [0, 90, 100] },
    };
    patientStroke: ApexStroke = { curve: 'smooth', width: 2.5 };
    patientColors             = ['#0D5238'];

    // ── Charts — Top Services ─────────────────────────────────────────────────
    servicesSeries = computed<ApexAxisChartSeries>(() => [{
        name: this.langService.translate('REPORTS.REVENUE'),
        data: this.services()?.rows.map(x => x.totalRevenue) ?? [],
    }]);

    servicesXAxis = computed<ApexXAxis>(() => ({
        categories: this.services()?.rows.map(x => x.serviceName) ?? [],
        labels: {
            style: { fontSize: '11px', colors: this.axisLabelColor() },
        },
    }));

    servicesChart = computed<ApexChart>(() => ({
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        background: this.chartBg(),
    }));

    servicesPlotOptions: ApexPlotOptions = {
        bar: { horizontal: true, borderRadius: 5, barHeight: '60%' },
    };

    servicesDataLabels: ApexDataLabels = { enabled: false };
    servicesColors = ['#C8893A'];

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadAll();
    }

    loadAll(): void {
        const { from, to } = this.getRange();
        this.loadRevenue(from, to);
        this.loadAppointments(from, to);
        this.loadServices(from, to);
        this.loadPatients(from, to);
        this.loadLowStock();
    }

    applyRange(): void { this.loadAll(); }

    private getRange(): { from: string; to: string } {
        const v = this.range.value;
        const fmt = (d: Date | null) => d ? this.toISODate(d) : this.toISODate(new Date());
        return { from: fmt(v.from ?? null), to: fmt(v.to ?? null) };
    }

    private toISODate(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // ── Loaders ───────────────────────────────────────────────────────────────
    private loadRevenue(from: string, to: string): void {
        this.loadingRevenue.set(true);
        this.svc.getRevenue(from, to).subscribe({
            next: r  => { this.revenue.set(r); this.loadingRevenue.set(false); },
            error: () => this.loadingRevenue.set(false),
        });
    }

    private loadAppointments(from: string, to: string): void {
        this.loadingAppointment.set(true);
        this.svc.getAppointments(from, to).subscribe({
            next: r  => { this.appointment.set(r); this.loadingAppointment.set(false); },
            error: () => this.loadingAppointment.set(false),
        });
    }

    private loadServices(from: string, to: string): void {
        this.loadingServices.set(true);
        this.svc.getTopServices(from, to).subscribe({
            next: r  => { this.services.set(r); this.loadingServices.set(false); },
            error: () => this.loadingServices.set(false),
        });
    }

    private loadPatients(from: string, to: string): void {
        this.loadingPatients.set(true);
        this.svc.getPatientFlow(from, to).subscribe({
            next: r  => { this.patients.set(r); this.loadingPatients.set(false); },
            error: () => this.loadingPatients.set(false),
        });
    }

    private loadLowStock(): void {
        this.loadingLowStock.set(true);
        this.svc.getLowStock().subscribe({
            next: r  => { this.lowStock.set(r); this.loadingLowStock.set(false); },
            error: () => this.loadingLowStock.set(false),
        });
    }

    // ── Export ────────────────────────────────────────────────────────────────
    exportRevenue(): void {
        if (this.exporting()) return;
        const { from, to } = this.getRange();
        this.exporting.set(true);
        this.svc.exportRevenue(from, to).subscribe({
            next: (blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = `revenue-${from}-${to}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
                this.exporting.set(false);
            },
            error: () => this.exporting.set(false),
        });
    }

    // ── Stock urgency ─────────────────────────────────────────────────────────
    stockUrgency(row: { currentStock: number; threshold: number }): string {
        const ratio = row.currentStock / (row.threshold || 1);
        if (ratio === 0) return 'danger';
        if (ratio < 0.5) return 'warning';
        return 'info';
    }

    // ── CkTable column definitions ────────────────────────────────────────────
    readonly servicesCols: CkColumnDef[] = [
        { key: 'serviceName', label: 'REPORTS.SERVICE_NAME', sortable: true, searchable: true },
        { key: 'count',       label: 'REPORTS.COUNT',       sortable: true, width: '100px' },
        { key: 'totalRevenue', label: 'REPORTS.REVENUE',    sortable: true, width: '160px' },
    ];

    readonly stockCols: CkColumnDef[] = [
        { key: 'name',         label: 'CATALOG.MEDICINE_NAME', sortable: true, searchable: true },
        { key: 'currentStock', label: 'REPORTS.CURRENT_STOCK', sortable: true, width: '130px' },
        { key: 'threshold',    label: 'REPORTS.THRESHOLD',     sortable: true, width: '110px' },
        { key: 'unit',         label: 'CATALOG.UNIT',          width: '90px' },
    ];
}

// ── Revenue ───────────────────────────────────────────────────────────────────
export interface DailyRevenueRow {
    date:         string; // 'YYYY-MM-DD'
    invoiced:     number;
    paid:         number;
    count:        number;
}

export interface RevenueReport {
    rows:          DailyRevenueRow[];
    totalInvoiced: number;
    totalPaid:     number;
    outstanding:   number;
    invoiceCount:  number;
}

// ── Appointments ──────────────────────────────────────────────────────────────
export interface AppointmentStatusRow {
    status: string;
    count:  number;
}

export interface DailyAppointmentRow {
    date:  string;
    count: number;
}

export interface AppointmentReport {
    byStatus:   AppointmentStatusRow[];
    byDay:      DailyAppointmentRow[];
    totalCount: number;
}

// ── Top Services ──────────────────────────────────────────────────────────────
export interface ServiceUsageRow {
    serviceName:  string;
    count:        number;
    totalRevenue: number;
}

export interface TopServicesReport {
    rows: ServiceUsageRow[];
}

// ── Patient Flow ──────────────────────────────────────────────────────────────
export interface DailyPatientRow {
    date:        string;
    newPatients: number;
}

export interface PatientFlowReport {
    rows:     DailyPatientRow[];
    totalNew: number;
}

// ── Low Stock ─────────────────────────────────────────────────────────────────
export interface LowStockReportRow {
    id:           string;
    name:         string;
    currentStock: number;
    threshold:    number;
    unit:         string | null;
}

export interface LowStockReport {
    rows: LowStockReportRow[];
}

// ── Date range helper ─────────────────────────────────────────────────────────
export interface DateRange {
    from: string; // 'YYYY-MM-DD'
    to:   string;
}

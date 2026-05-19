import { Injectable } from '@angular/core';
import { Observable }  from 'rxjs';
import { HttpClient }  from '@angular/common/http';
import { inject }      from '@angular/core';
import { catchError }  from 'rxjs/operators';

import { ApiService }          from './api.service';
import { environment }         from '../../../environments/environment';
import {
    RevenueReport,
    AppointmentReport,
    TopServicesReport,
    PatientFlowReport,
    LowStockReport,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsService extends ApiService {

    getRevenue(from: string, to: string): Observable<RevenueReport> {
        return this.get<RevenueReport>('/api/reports/revenue', { from, to });
    }

    getAppointments(from: string, to: string): Observable<AppointmentReport> {
        return this.get<AppointmentReport>('/api/reports/appointments', { from, to });
    }

    getTopServices(from: string, to: string, top = 10): Observable<TopServicesReport> {
        return this.get<TopServicesReport>('/api/reports/top-services', { from, to, top });
    }

    getPatientFlow(from: string, to: string): Observable<PatientFlowReport> {
        return this.get<PatientFlowReport>('/api/reports/patient-flow', { from, to });
    }

    getLowStock(): Observable<LowStockReport> {
        return this.get<LowStockReport>('/api/reports/low-stock');
    }

    exportRevenue(from: string, to: string): Observable<Blob> {
        return this.http
            .get(`${environment.apiUrl}/api/reports/export/revenue`, {
                params:       { from, to },
                responseType: 'blob',
            });
    }
}

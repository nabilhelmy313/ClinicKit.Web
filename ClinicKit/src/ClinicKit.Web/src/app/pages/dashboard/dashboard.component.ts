import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-ck-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
            <h5 class="mb-0">Dashboard</h5>
        </div>

        <div class="row">
            @for (stat of stats; track stat.label) {
                <div class="col-xxl-3 col-sm-6">
                    <div class="card-box mb-25">
                        <div class="d-flex align-items-center">
                            <div class="icon flex-shrink-0 me-15"
                                 [style.background]="stat.bg" [style.color]="stat.color"
                                 style="width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;">
                                <i class="material-symbols-outlined" style="font-size:28px">{{ stat.icon }}</i>
                            </div>
                            <div>
                                <span class="d-block fw-medium" style="font-size:22px">{{ stat.value }}</span>
                                <span class="text-body">{{ stat.label }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>

        <div class="card-box mb-25">
            <div class="d-flex align-items-center justify-content-between mb-15">
                <h5 class="mb-0">Today's Appointments</h5>
                <a routerLink="/appointments" class="default-btn small-btn">View All</a>
            </div>
            <div class="alert alert-warning" role="alert">
                <i class="material-symbols-outlined me-2">construction</i>
                Appointment table — Week 2 sprint.
            </div>
        </div>
    `,
})
export class DashboardComponent {
    protected stats = [
        { icon: 'patient_list',    value: '1,248', label: 'Total Patients',        bg: '#FEF2F2', color: '#C41E3A' },
        { icon: 'event_available', value: '34',     label: "Today's Appointments",  bg: '#EFF6FF', color: '#2563eb' },
        { icon: 'stethoscope',     value: '18',     label: 'Active Doctors',        bg: '#F0FDF4', color: '#059669' },
        { icon: 'receipt_long',    value: '$8,420', label: 'Monthly Revenue',       bg: '#FFFBEB', color: '#d97706' },
    ];
}

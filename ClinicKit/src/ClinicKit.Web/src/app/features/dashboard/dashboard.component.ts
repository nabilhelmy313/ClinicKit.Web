import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ck-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ck-page-header">
      <h1 class="ck-page-title">Dashboard</h1>
      <p class="ck-page-sub">Welcome back — here's what's happening today.</p>
    </div>

    <div class="ck-stats-grid">
      @for (stat of stats; track stat.label) {
        <div class="ck-stat-card">
          <span class="ck-stat-icon" [style.color]="stat.color">
            <i [class]="stat.icon"></i>
          </span>
          <div>
            <p class="ck-stat-value">{{ stat.value }}</p>
            <p class="ck-stat-label">{{ stat.label }}</p>
          </div>
        </div>
      }
    </div>

    <div class="ck-placeholder-banner">
      <i class="ri-tools-line"></i>
      <p>Dashboard charts &amp; analytics coming in Week 2 sprint.</p>
    </div>
  `,
  styles: [`
    .ck-page-header { margin-bottom: 24px; }
    .ck-page-title  { font-size: 1.6rem; font-weight: 700; margin: 0 0 4px; color: #1a1a2e; }
    .ck-page-sub    { color: #888; margin: 0; }

    .ck-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .ck-stat-card {
      background: #fff;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,.05);
    }
    .ck-stat-icon { font-size: 32px; }
    .ck-stat-value { font-size: 1.5rem; font-weight: 700; margin: 0 0 2px; color: #1a1a2e; }
    .ck-stat-label { font-size: 13px; color: #888; margin: 0; }

    .ck-placeholder-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #FEF3C7;
      border-radius: 10px;
      padding: 14px 20px;
      color: #92400E;
      font-size: 14px;
      i { font-size: 20px; }
    }
  `]
})
export class DashboardComponent {
  protected stats = [
    { icon: 'ri-user-heart-line',      value: '1 248', label: 'Total Patients',       color: '#C41E3A' },
    { icon: 'ri-calendar-check-line',  value: '34',    label: "Today's Appointments", color: '#2563eb' },
    { icon: 'ri-stethoscope-line',     value: '18',    label: 'Active Doctors',       color: '#059669' },
    { icon: 'ri-bill-line',            value: '$8 420', label: 'Monthly Revenue',      color: '#d97706' },
  ];
}

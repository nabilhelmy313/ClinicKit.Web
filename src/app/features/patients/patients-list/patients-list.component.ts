import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PatientsFacade } from '../patients.facade';

@Component({
  selector: 'ck-patients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Header -->
    <div class="ck-page-header">
      <div>
        <h1 class="ck-page-title">المرضى</h1>
        <p class="ck-page-sub">إدارة جميع المرضى المسجلين في العيادة</p>
      </div>
      <button class="ck-btn-primary" routerLink="../new">
        + إضافة مريض
      </button>
    </div>

    <!-- Search -->
    <div class="ck-toolbar">
      <input
        class="ck-search"
        type="text"
        placeholder="بحث بالاسم أو التليفون..."
        [ngModel]="facade.search()"
        (ngModelChange)="facade.setSearch($event)"
      />
    </div>

    <!-- Loading -->
    @if (facade.loading()) {
      <div class="ck-loading">جاري التحميل…</div>
    }

    <!-- Error -->
    @if (facade.error()) {
      <div class="ck-error-banner">
        {{ facade.error() }}
        <button (click)="facade.clearError()">✕</button>
      </div>
    }

    <!-- Empty state -->
    @if (facade.isEmpty()) {
      <div class="ck-empty">
        <p>لا يوجد مرضى مسجلين بعد.</p>
      </div>
    }

    <!-- Table -->
    @if (!facade.loading() && facade.patients().length > 0) {
      <table class="ck-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>التليفون</th>
            <th>تاريخ الميلاد</th>
            <th>النوع</th>
            <th>فصيلة الدم</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (p of facade.patients(); track p.id) {
            <tr>
              <td>{{ p.fullName }}</td>
              <td>{{ p.phone }}</td>
              <td>{{ p.dateOfBirth ?? '—' }}</td>
              <td>{{ p.gender === 'male' ? 'ذكر' : 'أنثى' }}</td>
              <td>{{ p.bloodType ?? '—' }}</td>
              <td class="ck-actions">
                <a [routerLink]="['..', p.id]">عرض</a>
                <button (click)="confirmDelete(p.id)">حذف</button>
              </td>
            </tr>
          }
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="ck-pagination">
        <span>{{ facade.totalCount() }} مريض</span>
        <div class="ck-pages">
          <button
            [disabled]="facade.page() === 1"
            (click)="facade.setPage(facade.page() - 1)">
            ‹
          </button>
          <span>{{ facade.page() }} / {{ facade.totalPages() }}</span>
          <button
            [disabled]="facade.page() === facade.totalPages()"
            (click)="facade.setPage(facade.page() + 1)">
            ›
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .ck-page-header  { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    .ck-page-title   { font-size:1.6rem; font-weight:700; margin:0 0 4px; }
    .ck-page-sub     { color:#888; margin:0; font-size:.9rem; }
    .ck-btn-primary  { background:#0D5238; color:#fff; border:none; border-radius:8px; padding:10px 20px; cursor:pointer; font-size:.9rem; }
    .ck-toolbar      { margin-bottom:16px; }
    .ck-search       { width:300px; padding:8px 14px; border:1px solid #ddd; border-radius:8px; font-size:.9rem; }
    .ck-loading      { padding:40px; text-align:center; color:#888; }
    .ck-error-banner { background:#FEF2F2; color:#B91C1C; border-radius:8px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; }
    .ck-empty        { padding:60px; text-align:center; color:#aaa; }
    .ck-table        { width:100%; border-collapse:collapse; font-size:.9rem; }
    .ck-table th     { background:#F9FAFB; padding:10px 14px; text-align:right; font-weight:600; border-bottom:1px solid #E5E7EB; }
    .ck-table td     { padding:10px 14px; border-bottom:1px solid #F3F4F6; }
    .ck-actions      { display:flex; gap:8px; }
    .ck-actions a, .ck-actions button { font-size:.85rem; cursor:pointer; background:none; border:none; color:#0D5238; text-decoration:underline; }
    .ck-actions button { color:#DC2626; }
    .ck-pagination   { display:flex; justify-content:space-between; align-items:center; margin-top:16px; font-size:.9rem; color:#555; }
    .ck-pages        { display:flex; align-items:center; gap:10px; }
    .ck-pages button { border:1px solid #ddd; background:#fff; border-radius:4px; padding:4px 10px; cursor:pointer; }
    .ck-pages button:disabled { opacity:.4; cursor:default; }
  `],
})
export class PatientsListComponent implements OnInit {
  readonly facade = inject(PatientsFacade);

  ngOnInit(): void {
    this.facade.loadAll();
  }

  confirmDelete(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذا المريض؟')) {
      this.facade.remove(id);
    }
  }
}

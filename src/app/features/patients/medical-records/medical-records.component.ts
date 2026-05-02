import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ck-medical-records',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ck-page-header">
      <div>
        <h1 class="ck-page-title">السجلات الطبية</h1>
        <p class="ck-page-sub">عرض سجل المواعيد والملاحظات الطبية للمرضى</p>
      </div>
    </div>

    <div class="ck-info-card">
      <div class="ck-info-icon">📋</div>
      <div>
        <h3>السجلات الطبية مرتبطة بملف المريض</h3>
        <p>
          للاطلاع على السجل الطبي الكامل لأي مريض، ابحث عنه في قائمة المرضى وافتح ملفه.
          <br />
          سجل المواعيد والتشخيصات يظهر في صفحة كل مريض على حدة.
        </p>
        <a class="ck-btn-primary" routerLink="/patients">الذهاب إلى المرضى →</a>
      </div>
    </div>
  `,
  styles: [`
    .ck-page-header { margin-bottom:24px; }
    .ck-page-title  { font-size:1.6rem; font-weight:700; margin:0 0 4px; }
    .ck-page-sub    { color:#888; margin:0; font-size:.9rem; }
    .ck-info-card   { background:#fff; border-radius:12px; border:1px solid #E5E7EB; padding:32px; display:flex; gap:24px; align-items:flex-start; }
    .ck-info-icon   { font-size:2.5rem; flex-shrink:0; }
    .ck-info-card h3 { font-size:1.1rem; font-weight:600; margin:0 0 8px; }
    .ck-info-card p  { color:#555; font-size:.9rem; line-height:1.6; margin:0 0 16px; }
    .ck-btn-primary  { display:inline-block; background:#0D5238; color:#fff; border:none; border-radius:8px; padding:10px 20px; font-size:.9rem; text-decoration:none; cursor:pointer; }
  `],
})
export class MedicalRecordsComponent {}

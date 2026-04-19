import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ck-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ck-page-header"><h1 class="ck-page-title">Invoices</h1><p class="ck-page-sub">All patient invoices and billing records.</p></div>
    <div class="ck-placeholder-banner"><i class="ri-tools-line"></i><p>Invoice table — Week 2 sprint.</p></div>
  `,
  styles: [`.ck-page-header{margin-bottom:24px}.ck-page-title{font-size:1.6rem;font-weight:700;margin:0 0 4px}.ck-page-sub{color:#888;margin:0}.ck-placeholder-banner{display:flex;align-items:center;gap:10px;background:#EFF6FF;border-radius:10px;padding:14px 20px;color:#1e40af;font-size:14px}`]
})
export class InvoicesComponent {}

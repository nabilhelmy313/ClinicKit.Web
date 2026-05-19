import { Injectable, inject } from '@angular/core';

import { Invoice }      from '../models/billing.model';
import { Visit }        from '../models/visit.model';
import { Patient }      from '../models/patient.model';
import { Appointment }  from '../models/appointment.model';
import { LanguageService }    from './language.service';
import { TenantConfigService } from './tenant-config.service';

@Injectable({ providedIn: 'root' })
export class PrintService {
    private readonly lang   = inject(LanguageService);
    private readonly tenant = inject(TenantConfigService);

    // ── Public API ────────────────────────────────────────────────────────────

    printInvoice(invoice: Invoice): void {
        this.open(this.invoiceHtml(invoice));
    }

    printThermal(invoice: Invoice): void {
        this.open(this.thermalHtml(invoice));
    }

    printPrescription(visit: Visit, patient: Patient): void {
        this.open(this.prescriptionHtml(visit, patient));
    }

    printAppointmentCard(appt: Appointment): void {
        this.open(this.appointmentCardHtml(appt));
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private open(html: string): void {
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return;
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.print(); w.close(); }, 400);
    }

    private t(key: string): string { return this.lang.translate(key); }

    private get clinic(): string { return this.tenant.clinicName || 'طَبَّبَ'; }

    private get dir(): string { return this.lang.isRTL() ? 'rtl' : 'ltr'; }

    private fmt(dateStr: string): string {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }

    private commonHead(title: string, extraCss = ''): string {
        return `<!DOCTYPE html>
<html dir="${this.dir}" lang="${this.lang.lang()}">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: 'Noto Naskh Arabic', 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif;
    font-size: 13px; color: #1a1a1a; background: #fff;
}
.clinic-name { font-size: 18px; font-weight: 700; color: #0D5238; }
.doc-title { font-size: 14px; color: #666; margin-top: 2px; }
.separator { border: none; border-top: 1.5px solid #0D5238; margin: 10px 0; }
.separator-light { border: none; border-top: 1px solid #ddd; margin: 8px 0; }
.label { color: #555; font-size: 11px; }
.value { font-weight: 600; }
table { width: 100%; border-collapse: collapse; }
th { background: #f0f7f4; color: #0D5238; font-weight: 600;
     padding: 6px 8px; font-size: 11px; border-bottom: 1.5px solid #c0d9d0; }
td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
.text-end { text-align: end; }
.text-center { text-align: center; }
.total-row td { font-weight: 700; background: #f0f7f4; border-top: 1.5px solid #c0d9d0; }
.footer { font-size: 10px; color: #888; text-align: center; margin-top: 12px; }
@media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 8mm; }
}
${extraCss}
</style>
</head><body>`;
    }

    // ── Invoice A5 ────────────────────────────────────────────────────────────

    private invoiceHtml(inv: Invoice): string {
        const currency = this.t('BILLING.CURRENCY');
        const num = (n: number) => n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const itemRows = inv.items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-end">${num(item.unitPrice)}</td>
                <td class="text-end">${num(item.amount)}</td>
            </tr>`).join('');

        const discountRow = inv.discount > 0 ? `
            <tr>
                <td colspan="3" class="text-end">${this.t('BILLING.DISCOUNT')}</td>
                <td class="text-end">− ${num(inv.discount)} ${currency}</td>
            </tr>` : '';

        return this.commonHead(`${this.clinic} — ${inv.invoiceNumber}`, `
            body { padding: 16mm; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
            .inv-meta td { padding: 2px 0; }
        `) + `
<div class="header">
    <div>
        <div class="clinic-name">${this.clinic}</div>
        <div class="doc-title">${this.t('BILLING.INVOICE_PRINT_TITLE')}</div>
    </div>
    <div style="text-align:end">
        <div style="font-size:16px;font-weight:700;color:#0D5238">${inv.invoiceNumber}</div>
        <div class="label">${this.fmt(inv.invoiceDate)}</div>
        ${inv.paidAt ? `<div style="color:#16a34a;font-size:11px">✓ ${this.t('BILLING.PAID_AT')}: ${this.fmt(inv.paidAt)}</div>` : ''}
    </div>
</div>
<hr class="separator"/>
<table class="inv-meta" style="margin-bottom:10px">
    <tr>
        <td class="label" style="width:120px">${this.t('BILLING.PATIENT')}</td>
        <td class="value">${inv.patientName}</td>
    </tr>
</table>
<table>
    <thead><tr>
        <th style="text-align:start">${this.t('BILLING.ITEM_DESCRIPTION')}</th>
        <th class="text-center" style="width:50px">${this.t('BILLING.ITEM_QTY')}</th>
        <th class="text-end" style="width:90px">${this.t('BILLING.ITEM_UNIT_PRICE')}</th>
        <th class="text-end" style="width:90px">${this.t('BILLING.ITEM_AMOUNT')}</th>
    </tr></thead>
    <tbody>
        ${itemRows}
    </tbody>
    <tfoot>
        <tr>
            <td colspan="3" class="text-end">${this.t('BILLING.SUBTOTAL')}</td>
            <td class="text-end">${num(inv.subTotal)} ${currency}</td>
        </tr>
        ${discountRow}
        <tr class="total-row">
            <td colspan="3" class="text-end">${this.t('BILLING.TOTAL')}</td>
            <td class="text-end">${num(inv.total)} ${currency}</td>
        </tr>
    </tfoot>
</table>
${inv.notes ? `<p style="margin-top:10px;font-size:11px;color:#555">${this.t('BILLING.NOTES')}: ${inv.notes}</p>` : ''}
<div class="footer" style="margin-top:20px">
    ${this.t('BILLING.PRINT_FOOTER')}
</div>
</body></html>`;
    }

    // ── Thermal 80mm ─────────────────────────────────────────────────────────

    private thermalHtml(inv: Invoice): string {
        const currency = this.t('BILLING.CURRENCY');
        const num = (n: number) => n.toFixed(2);

        const itemRows = inv.items.map(item => `
<div style="display:flex;justify-content:space-between;margin-bottom:3px">
    <span style="flex:1">${item.description}</span>
    <span style="margin-inline-start:6px;white-space:nowrap">${item.quantity} × ${num(item.unitPrice)}</span>
</div>
<div style="text-align:end;margin-bottom:4px">${num(item.amount)} ${currency}</div>
<hr style="border:none;border-top:1px dashed #ccc;margin:3px 0">`).join('');

        return this.commonHead(`${this.clinic} — ${inv.invoiceNumber}`, `
            @media print { @page { size: 80mm auto; margin: 3mm; } }
            body { width: 72mm; padding: 2mm; font-size: 12px; }
        `) + `
<div style="text-align:center;margin-bottom:8px">
    <div class="clinic-name">${this.clinic}</div>
    <div style="font-size:11px;color:#555">${this.t('BILLING.INVOICE_PRINT_TITLE')}</div>
    <div style="font-size:11px">${inv.invoiceNumber} — ${this.fmt(inv.invoiceDate)}</div>
</div>
<hr class="separator"/>
<div style="margin-bottom:6px"><span class="label">${this.t('BILLING.PATIENT')}: </span><strong>${inv.patientName}</strong></div>
<hr class="separator-light"/>
${itemRows}
<hr class="separator"/>
${inv.discount > 0 ? `<div style="display:flex;justify-content:space-between"><span>${this.t('BILLING.DISCOUNT')}</span><span>− ${num(inv.discount)} ${currency}</span></div>` : ''}
<div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px">
    <span>${this.t('BILLING.TOTAL')}</span>
    <span>${num(inv.total)} ${currency}</span>
</div>
${inv.paidAt ? `<div style="text-align:center;margin-top:6px;color:#16a34a;font-weight:700">✓ ${this.t('BILLING.STATUS_PAID')}</div>` : ''}
<div class="footer" style="margin-top:10px">${this.t('BILLING.PRINT_FOOTER')}</div>
</body></html>`;
    }

    // ── Prescription A5 ───────────────────────────────────────────────────────

    private prescriptionHtml(visit: Visit, patient: Patient): string {
        const medRows = visit.medications.map(med => `
            <tr>
                <td class="value">${med.medicineName}</td>
                <td>${med.dosage ?? '—'}</td>
                <td>${med.frequency ?? '—'}</td>
                <td>${med.duration ?? '—'}</td>
                <td style="font-size:11px">${med.instructions ?? ''}</td>
            </tr>`).join('');

        return this.commonHead(`${this.clinic} — ${this.t('VISITS.PRESCRIPTION')}`, `
            body { padding: 14mm; }
            .rx-header { display: flex; justify-content: space-between; align-items: flex-start; }
            .rx-symbol { font-size: 32px; font-weight: 700; color: #0D5238; line-height: 1; }
        `) + `
<div class="rx-header">
    <div>
        <div class="clinic-name">${this.clinic}</div>
        <div class="doc-title">${this.t('VISITS.PRESCRIPTION')}</div>
    </div>
    <div class="rx-symbol">℞</div>
</div>
<hr class="separator"/>
<table style="margin-bottom:10px">
    <tr>
        <td class="label" style="width:120px">${this.t('PATIENTS.FULL_NAME')}</td>
        <td class="value">${patient.fullName}</td>
        <td class="label" style="width:80px;text-align:end">${this.t('VISITS.VISIT_DATE')}</td>
        <td class="value" style="text-align:end">${this.fmt(visit.visitDate)}</td>
    </tr>
    ${visit.diagnosis ? `<tr>
        <td class="label">${this.t('VISITS.DIAGNOSIS')}</td>
        <td colspan="3" class="value">${visit.diagnosis}</td>
    </tr>` : ''}
</table>
<table>
    <thead><tr>
        <th style="text-align:start">${this.t('VISITS.MEDICINE_NAME')}</th>
        <th class="text-center">${this.t('VISITS.DOSAGE')}</th>
        <th class="text-center">${this.t('VISITS.FREQUENCY')}</th>
        <th class="text-center">${this.t('VISITS.DURATION')}</th>
        <th style="text-align:start">${this.t('VISITS.INSTRUCTIONS')}</th>
    </tr></thead>
    <tbody>${medRows}</tbody>
</table>
${visit.notes ? `<p style="margin-top:10px;font-size:11px;color:#555;border-top:1px dashed #ddd;padding-top:8px">${this.t('VISITS.NOTES')}: ${visit.notes}</p>` : ''}
<div style="margin-top:30px;display:flex;justify-content:flex-end">
    <div style="text-align:center;width:160px">
        <div style="border-top:1px solid #333;padding-top:4px;font-size:11px">${this.t('VISITS.DOCTOR_SIGNATURE')}</div>
    </div>
</div>
<div class="footer">${this.clinic}</div>
</body></html>`;
    }

    // ── Appointment card A6 ───────────────────────────────────────────────────

    private appointmentCardHtml(appt: Appointment): string {
        const timeStr = `${appt.startTime.substring(0, 5)} – ${appt.endTime.substring(0, 5)}`;

        return this.commonHead(`${this.clinic} — ${this.t('APPOINTMENTS.PRINT_TITLE')}`, `
            @media print { @page { size: A6; margin: 8mm; } }
            body { padding: 10mm; }
            .card-body { border: 1.5px solid #0D5238; border-radius: 8px; padding: 12px 16px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .row-label { color: #555; font-size: 11px; }
            .row-value { font-weight: 600; font-size: 13px; }
        `) + `
<div style="text-align:center;margin-bottom:12px">
    <div class="clinic-name">${this.clinic}</div>
    <div class="doc-title">${this.t('APPOINTMENTS.PRINT_TITLE')}</div>
</div>
<div class="card-body">
    <div class="row">
        <div>
            <div class="row-label">${this.t('APPOINTMENTS.PATIENT')}</div>
            <div class="row-value">${appt.patientName}</div>
        </div>
        <div style="text-align:end">
            <div class="row-label">${this.t('APPOINTMENTS.PHONE')}</div>
            <div class="row-value" dir="ltr">${appt.patientPhone}</div>
        </div>
    </div>
    <hr class="separator-light"/>
    <div class="row">
        <div>
            <div class="row-label">${this.t('APPOINTMENTS.DATE')}</div>
            <div class="row-value">${this.fmt(appt.appointmentDate)}</div>
        </div>
        <div style="text-align:end">
            <div class="row-label">${this.t('APPOINTMENTS.TIME')}</div>
            <div class="row-value" dir="ltr">${timeStr}</div>
        </div>
    </div>
    ${appt.doctorName ? `<hr class="separator-light"/>
    <div class="row">
        <div>
            <div class="row-label">${this.t('APPOINTMENTS.DOCTOR')}</div>
            <div class="row-value">${appt.doctorName}</div>
        </div>
    </div>` : ''}
    ${appt.notes ? `<hr class="separator-light"/>
    <div style="font-size:11px;color:#555">${this.t('APPOINTMENTS.NOTES')}: ${appt.notes}</div>` : ''}
</div>
<div class="footer" style="margin-top:16px">${this.t('APPOINTMENTS.PRINT_FOOTER')}</div>
</body></html>`;
    }
}

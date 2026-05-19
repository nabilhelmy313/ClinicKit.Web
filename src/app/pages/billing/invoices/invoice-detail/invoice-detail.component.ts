import {
    Component, OnInit, inject, signal, computed, HostListener,
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatIconModule }    from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule }    from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BillingService }  from '../../../../core/services/billing.service';
import { DialogService }   from '../../../../core/services/dialog.service';
import { ToastService }    from '../../../../core/services/toast.service';
import { PrintService }    from '../../../../core/services/print.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ThemeService }    from '../../../../core/services/theme.service';
import { TranslatePipe }   from '../../../../core/pipes/translate.pipe';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import {
    Invoice, InvoiceStatusLabels,
} from '../../../../core/models/billing.model';
import {
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkStatusBadgeComponent,
} from '../../../../shared/index';

@Component({
    selector: 'app-invoice-detail',
    standalone: true,
    templateUrl: './invoice-detail.component.html',
    styleUrl:    './invoice-detail.component.scss',
    imports: [
        CommonModule, TranslatePipe,
        MatIconModule, MatDividerModule, MatMenuModule, MatTooltipModule,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkStatusBadgeComponent,
        HasPermissionDirective,
    ],
})
export class InvoiceDetailComponent implements OnInit {
    readonly router       = inject(Router);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly route   = inject(ActivatedRoute);
    private readonly billing = inject(BillingService);
    private readonly dialog  = inject(DialogService);
    private readonly toast   = inject(ToastService);
    private readonly print   = inject(PrintService);

    // ── State ─────────────────────────────────────────────────────────────────
    invoice   = signal<Invoice | null>(null);
    loading   = signal(true);
    actioning = signal(false);

    readonly invoiceColorMap = { Draft: 'warning', Paid: 'success', Cancelled: 'neutral' } as const;

    readonly isDraft    = computed(() => this.invoice()?.status === 'Draft');
    readonly statusLabel = computed(() => {
        const s = this.invoice()?.status;
        return s ? InvoiceStatusLabels[s] : '';
    });

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.load(id);
    }

    private load(id: string): void {
        this.loading.set(true);
        this.billing.getInvoiceById(id).subscribe({
            next: inv => { this.invoice.set(inv); this.loading.set(false); },
            error: ()  => { this.loading.set(false); this.router.navigate(['/billing/invoices']); },
        });
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    markPaid(): void {
        const inv = this.invoice();
        if (!inv) return;

        this.dialog.confirm({
            title:   this.langService.translate('BILLING.MARK_PAID'),
            message: this.langService.translate('BILLING.CONFIRM_MARK_PAID'),
            confirmLabel: this.langService.translate('BILLING.MARK_PAID'),
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.actioning.set(true);
            this.billing.updateStatus(inv.id, { newStatus: 'Paid' }).subscribe({
                next: updated => {
                    this.invoice.set(updated);
                    this.actioning.set(false);
                    this.toast.success(this.langService.translate('BILLING.PAID_SUCCESS'));
                },
                error: () => this.actioning.set(false),
            });
        });
    }

    cancelInvoice(): void {
        const inv = this.invoice();
        if (!inv) return;

        this.dialog.confirm({
            title:   this.langService.translate('BILLING.CANCEL_INVOICE'),
            message: this.langService.translate('BILLING.CONFIRM_CANCEL'),
            confirmLabel: this.langService.translate('BILLING.CANCEL_INVOICE'),
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.actioning.set(true);
            this.billing.updateStatus(inv.id, { newStatus: 'Cancelled' }).subscribe({
                next: updated => {
                    this.invoice.set(updated);
                    this.actioning.set(false);
                    this.toast.success(this.langService.translate('BILLING.CANCELLED_SUCCESS'));
                },
                error: () => this.actioning.set(false),
            });
        });
    }

    printInvoice(): void {
        const inv = this.invoice();
        if (inv) this.print.printInvoice(inv);
    }

    printThermal(): void {
        const inv = this.invoice();
        if (inv) this.print.printThermal(inv);
    }

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    @HostListener('document:keydown', ['$event'])
    onKeydown(e: KeyboardEvent): void {
        if (!this.invoice()) return;
        if (e.ctrlKey && !e.shiftKey && e.key === 'p') {
            e.preventDefault();
            this.printInvoice();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            this.printThermal();
        }
    }

    back(): void { this.router.navigate(['/billing/invoices']); }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule }           from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { PurchasesService } from '../../../../core/services/purchases.service';
import { DialogService }    from '../../../../core/services/dialog.service';
import { ToastService }     from '../../../../core/services/toast.service';
import { LanguageService }  from '../../../../core/services/language.service';
import { ThemeService }     from '../../../../core/services/theme.service';
import { TranslatePipe }    from '../../../../core/pipes/translate.pipe';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import {
    PurchaseOrder,
    PurchaseOrderStatusLabels,
} from '../../../../core/models/purchase.model';
import {
    CkPageHeaderComponent, CkCardComponent,
    CkBtnComponent, CkStatusBadgeComponent,
} from '../../../../shared/index';

@Component({
    selector: 'app-purchase-order-detail',
    standalone: true,
    templateUrl: './purchase-order-detail.component.html',
    styleUrl:    './purchase-order-detail.component.scss',
    imports: [
        CommonModule, TranslatePipe,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkStatusBadgeComponent,
        HasPermissionDirective,
    ],
})
export class PurchaseOrderDetailComponent implements OnInit {
    readonly router       = inject(Router);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly route   = inject(ActivatedRoute);
    private readonly svc     = inject(PurchasesService);
    private readonly dialog  = inject(DialogService);
    private readonly toast   = inject(ToastService);

    order     = signal<PurchaseOrder | null>(null);
    loading   = signal(true);
    actioning = signal(false);

    readonly isDraft = computed(() => this.order()?.status === 'Draft');

    readonly statusColorMap = {
        Draft: 'warning', Received: 'success', Cancelled: 'neutral',
    } as const;

    statusLabel(s: string): string {
        const key = PurchaseOrderStatusLabels[s as keyof typeof PurchaseOrderStatusLabels];
        return key ? this.langService.translate(key) : s;
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.load(id);
    }

    private load(id: string): void {
        this.loading.set(true);
        this.svc.getOrderById(id).subscribe({
            next: o  => { this.order.set(o); this.loading.set(false); },
            error: () => { this.loading.set(false); this.router.navigate(['/purchases/orders']); },
        });
    }

    receive(): void {
        const o = this.order();
        if (!o) return;
        this.dialog.confirm({
            title:        this.langService.translate('PURCHASES.RECEIVE_CONFIRM_TITLE'),
            message:      this.langService.translate('PURCHASES.RECEIVE_CONFIRM_MSG'),
            confirmLabel: this.langService.translate('PURCHASES.RECEIVE'),
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.actioning.set(true);
            this.svc.receiveOrder(o.id).subscribe({
                next: updated => {
                    this.order.set(updated);
                    this.actioning.set(false);
                    this.toast.success(this.langService.translate('PURCHASES.RECEIVED_SUCCESS'));
                },
                error: () => this.actioning.set(false),
            });
        });
    }

    cancelOrder(): void {
        const o = this.order();
        if (!o) return;
        this.dialog.confirm({
            title:        this.langService.translate('PURCHASES.CANCEL_CONFIRM_TITLE'),
            message:      this.langService.translate('PURCHASES.CANCEL_CONFIRM_MSG'),
            confirmLabel: this.langService.translate('PURCHASES.CANCEL_ORDER'),
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.actioning.set(true);
            this.svc.cancelOrder(o.id).subscribe({
                next: updated => {
                    this.order.set(updated);
                    this.actioning.set(false);
                    this.toast.success(this.langService.translate('PURCHASES.CANCELLED_SUCCESS'));
                },
                error: () => this.actioning.set(false),
            });
        });
    }

    back(): void { this.router.navigate(['/purchases/orders']); }
}

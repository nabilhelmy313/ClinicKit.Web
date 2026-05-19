import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Router }        from '@angular/router';
import {
    ReactiveFormsModule, FormBuilder, FormArray, Validators, AbstractControl,
} from '@angular/forms';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatSelectModule }      from '@angular/material/select';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { PurchasesService } from '../../../../core/services/purchases.service';
import { CatalogService }   from '../../../../core/services/catalog.service';
import { ToastService }     from '../../../../core/services/toast.service';
import { LanguageService }  from '../../../../core/services/language.service';
import { BreakpointService } from '../../../../core/services/breakpoint.service';
import { ThemeService }     from '../../../../core/services/theme.service';
import { TranslatePipe }    from '../../../../core/pipes/translate.pipe';
import { Supplier }         from '../../../../core/models/purchase.model';
import { MedicineItem }     from '../../../../core/models/catalog.model';
import {
    CkPageHeaderComponent, CkCardComponent,
    CkBtnComponent, CkFormActionsComponent,
} from '../../../../shared/index';

@Component({
    selector: 'app-purchase-order-form',
    standalone: true,
    templateUrl: './purchase-order-form.component.html',
    styleUrl:    './purchase-order-form.component.scss',
    imports: [
        CommonModule, ReactiveFormsModule, TranslatePipe,
        MatFormFieldModule, MatInputModule,
        MatDatepickerModule,
        MatAutocompleteModule,
        CkPageHeaderComponent, CkCardComponent,
        CkBtnComponent, CkFormActionsComponent,
        MatSelectModule,
    ],
})
export class PurchaseOrderFormComponent implements OnInit {
    readonly router       = inject(Router);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    readonly bp           = inject(BreakpointService);
    private readonly svc       = inject(PurchasesService);
    private readonly catalog   = inject(CatalogService);
    private readonly toast     = inject(ToastService);
    private readonly fb        = inject(FormBuilder);

    suppliers        = signal<Supplier[]>([]);
    medicineOptions  = signal<MedicineItem[][]>([]);  // per-row medicine suggestions
    saving           = signal(false);
    today            = new Date();

    form = this.fb.group({
        supplierId: ['', Validators.required],
        orderDate:  [this.fmt(new Date()), Validators.required],
        notes:      [''],
        items:      this.fb.array([this.newItemGroup()]),
    });

    get items(): FormArray { return this.form.get('items') as FormArray; }

    ngOnInit(): void {
        this.svc.listSuppliers(1, 200).subscribe({
            next: res => this.suppliers.set(res.items),
        });
        this.medicineOptions.set([[]]);
        this.watchItemMedicine(0);
    }

    private newItemGroup() {
        return this.fb.group({
            medicineCatalogId: [null as string | null],
            medicineName:      [''],
            description:       ['', [Validators.required, Validators.maxLength(300)]],
            quantity:          [1, [Validators.required, Validators.min(1)]],
            unitCost:          [null as number | null, [Validators.required, Validators.min(0.01)]],
        });
    }

    addItem(): void {
        this.items.push(this.newItemGroup());
        this.medicineOptions.update(opts => [...opts, []]);
        this.watchItemMedicine(this.items.length - 1);
    }

    removeItem(i: number): void {
        if (this.items.length === 1) return;
        this.items.removeAt(i);
        this.medicineOptions.update(opts => opts.filter((_, idx) => idx !== i));
    }

    private watchItemMedicine(i: number): void {
        const ctrl = this.items.at(i).get('medicineName')!;
        ctrl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(q => q && q.length > 1 ? this.catalog.getMedicines(q) : of([])),
        ).subscribe(meds => {
            this.medicineOptions.update(opts => {
                const copy = [...opts];
                copy[i] = meds;
                return copy;
            });
        });
    }

    selectMedicine(i: number, med: MedicineItem): void {
        const group = this.items.at(i);
        group.patchValue({
            medicineCatalogId: med.id,
            medicineName:      med.name,
            description:       med.name,
        });
    }

    onDateChange(event: MatDatepickerInputEvent<Date>): void {
        if (event.value) this.form.patchValue({ orderDate: this.fmt(event.value) });
    }

    lineTotal(ctrl: AbstractControl): number {
        const qty  = ctrl.get('quantity')?.value  ?? 0;
        const cost = ctrl.get('unitCost')?.value  ?? 0;
        return qty * cost;
    }

    get grandTotal(): number {
        return this.items.controls.reduce((sum, c) => sum + this.lineTotal(c), 0);
    }

    save(): void {
        if (this.form.invalid) return;
        this.saving.set(true);
        const v = this.form.getRawValue();
        this.svc.createOrder({
            supplierId: v.supplierId!,
            orderDate:  v.orderDate!,
            notes:      v.notes || undefined,
            items: v.items.map((it: any) => ({
                medicineCatalogId: it.medicineCatalogId || undefined,
                description:       it.description,
                quantity:          it.quantity,
                unitCost:          it.unitCost,
            })),
        }).subscribe({
            next: order => {
                this.toast.success(this.langService.translate('PURCHASES.ORDER_CREATED'));
                this.router.navigate(['/purchases/orders', order.id]);
            },
            error: () => this.saving.set(false),
        });
    }

    cancel(): void { this.router.navigate(['/purchases/orders']); }

    private fmt(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}

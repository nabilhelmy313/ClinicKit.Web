import {
    Component, OnInit, inject, signal, computed, DestroyRef,
} from '@angular/core';
import {
    FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl,
} from '@angular/forms';
import { Router }           from '@angular/router';
import { CommonModule }     from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule }    from '@angular/material/form-field';
import { MatInputModule }        from '@angular/material/input';
import { MatSelectModule }       from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule }         from '@angular/material/icon';
import { MatButtonModule }       from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BillingService }   from '../../../../core/services/billing.service';
import { PatientsService }  from '../../../../core/services/patients.service';
import { VisitsService }    from '../../../../core/services/visits.service';
import { CatalogService }   from '../../../../core/services/catalog.service';
import { ToastService }     from '../../../../core/services/toast.service';
import { LanguageService }  from '../../../../core/services/language.service';
import { ThemeService }     from '../../../../core/services/theme.service';
import { TranslatePipe }    from '../../../../core/pipes/translate.pipe';
import { PatientBrief }     from '../../../../core/models/patient.model';
import { Visit }            from '../../../../core/models/visit.model';
import { ServiceItem }      from '../../../../core/models/catalog.model';
import {
    CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkFormActionsComponent,
} from '../../../../shared/index';

@Component({
    selector: 'app-invoice-form',
    standalone: true,
    templateUrl: './invoice-form.component.html',
    styleUrl:    './invoice-form.component.scss',
    imports: [
        CommonModule, ReactiveFormsModule, TranslatePipe,
        MatFormFieldModule, MatInputModule, MatSelectModule,
        MatAutocompleteModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
        CkPageHeaderComponent, CkCardComponent, CkBtnComponent, CkFormActionsComponent,
    ],
})
export class InvoiceFormComponent implements OnInit {
    readonly router       = inject(Router);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
    private readonly fb          = inject(FormBuilder);
    private readonly billing     = inject(BillingService);
    private readonly patientsSvc = inject(PatientsService);
    private readonly visitsSvc   = inject(VisitsService);
    private readonly catalogSvc  = inject(CatalogService);
    private readonly toast       = inject(ToastService);
    private readonly destroyRef  = inject(DestroyRef);

    // ── State ─────────────────────────────────────────────────────────────────
    submitting      = signal(false);
    patientOptions  = signal<PatientBrief[]>([]);
    visitOptions    = signal<Visit[]>([]);
    loadingVisits   = signal(false);
    selectedPatient = signal<PatientBrief | null>(null);
    serviceItems    = signal<ServiceItem[]>([]);
    serviceOptions  = signal<ServiceItem[]>([]);

    private readonly patientSearch$ = new Subject<string>();

    // ── Form ──────────────────────────────────────────────────────────────────
    form: FormGroup = this.fb.group({
        patientInput: ['', Validators.required],  // autocomplete display
        visitId:      [null],                     // اختياري — null = كشف قبل الزيارة
        notes:        [''],
        items: this.fb.array([this.buildItemGroup('رسوم الكشف', 1, 0)]),
    });

    get itemsArray(): FormArray { return this.form.get('items') as FormArray; }
    itemAt(i: number): AbstractControl { return this.itemsArray.at(i); }

    // ── Computed totals ───────────────────────────────────────────────────────
    get subTotal(): number {
        return this.itemsArray.controls.reduce((sum, ctrl) => {
            const qty   = Number(ctrl.get('quantity')?.value)  || 0;
            const price = Number(ctrl.get('unitPrice')?.value) || 0;
            return sum + qty * price;
        }, 0);
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.patientSearch$
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                switchMap(term => term.length >= 2
                    ? this.patientsSvc.search(term)
                    : of([])),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(list => this.patientOptions.set(list));

        // Load full service catalog for quick-pick chips and autocomplete
        this.catalogSvc.getServices()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(items => {
                this.serviceItems.set(items);
                this.serviceOptions.set(items);
            });
    }

    // ── Patient autocomplete ──────────────────────────────────────────────────
    onPatientInput(event: Event): void {
        const val = (event.target as HTMLInputElement).value;
        if (!val) {
            this.selectedPatient.set(null);
            this.visitOptions.set([]);
            this.form.patchValue({ visitId: null });
        }
        this.patientSearch$.next(val);
    }

    onPatientSelected(patient: PatientBrief): void {
        this.selectedPatient.set(patient);
        this.loadingVisits.set(true);
        this.visitOptions.set([]);
        this.form.patchValue({ visitId: null });

        this.visitsSvc.getPatientVisits(patient.id, 1, 50)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: res => {
                    this.visitOptions.set(res.items);
                    this.loadingVisits.set(false);
                },
                error: () => this.loadingVisits.set(false),
            });
    }

    displayPatient(p: PatientBrief | null): string {
        return p ? `${p.fullName} — ${p.phone}` : '';
    }

    visitLabel(v: Visit): string {
        return `${v.visitDate}${v.chiefComplaint ? ' — ' + v.chiefComplaint : ''}`;
    }

    // ── Quick-pick catalog ────────────────────────────────────────────────────
    quickAddService(svc: ServiceItem): void {
        this.itemsArray.push(this.buildItemGroup(svc.name, 1, svc.defaultPrice));
    }

    onDescriptionSearch(index: number, term: string): void {
        const filtered = term
            ? this.serviceItems().filter(s =>
                s.name.toLowerCase().includes(term.toLowerCase()))
            : this.serviceItems();
        this.serviceOptions.set(filtered);
    }

    onServiceSelected(index: number, svc: ServiceItem): void {
        this.itemsArray.at(index).patchValue({
            description: svc.name,
            unitPrice:   svc.defaultPrice,
        });
    }

    displayServiceOption(svc: ServiceItem | string | null): string {
        if (!svc) return '';
        if (typeof svc === 'string') return svc;
        return svc.name;
    }

    displayServiceName(svc: ServiceItem): string {
        return (this.langService.lang() === 'en' && svc.nameEn) ? svc.nameEn : svc.name;
    }

    // ── Items ─────────────────────────────────────────────────────────────────
    private buildItemGroup(description = '', quantity = 1, unitPrice = 0): FormGroup {
        return this.fb.group({
            description: [description, [Validators.required, Validators.maxLength(200)]],
            quantity:    [quantity,    [Validators.required, Validators.min(1)]],
            unitPrice:   [unitPrice,   [Validators.required, Validators.min(0.01)]],
        });
    }

    addItem(): void { this.itemsArray.push(this.buildItemGroup()); }

    removeItem(i: number): void {
        if (this.itemsArray.length > 1) this.itemsArray.removeAt(i);
    }

    lineTotal(i: number): number {
        const ctrl = this.itemsArray.at(i);
        return (Number(ctrl.get('quantity')?.value) || 0)
             * (Number(ctrl.get('unitPrice')?.value) || 0);
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    onSubmit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        const patient = this.selectedPatient();
        if (!patient) {
            this.form.get('patientInput')?.setErrors({ required: true });
            return;
        }

        this.submitting.set(true);
        const val = this.form.value;

        this.billing.createInvoice({
            patientId: patient.id,
            visitId:   val.visitId || undefined,   // لو مفيش زيارة → undefined
            notes:     val.notes   || undefined,
            items:     val.items.map((it: { description: string; quantity: number; unitPrice: number }) => ({
                description: it.description,
                quantity:    it.quantity,
                unitPrice:   it.unitPrice,
            })),
        }).subscribe({
            next: inv => {
                this.toast.success(this.langService.translate('BILLING.CREATED_SUCCESS'));
                this.router.navigate(['/billing/invoices', inv.id]);
            },
            error: () => this.submitting.set(false),
        });
    }

    cancel(): void { this.router.navigate(['/billing/invoices']); }
}

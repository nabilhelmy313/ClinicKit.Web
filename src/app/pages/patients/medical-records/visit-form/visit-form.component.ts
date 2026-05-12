import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule }     from '@angular/common';
import {
    FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl,
} from '@angular/forms';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatButtonModule }          from '@angular/material/button';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule }            from '@angular/material/icon';

import { VisitsService }   from '../../../../core/services/visits.service';
import { ToastService }    from '../../../../core/services/toast.service';
import { Visit }           from '../../../../core/models/visit.model';
import { TranslatePipe }   from '../../../../core/pipes/translate.pipe';
import { CkCardComponent, CkFormActionsComponent } from '../../../../shared/index';
import { VisitAttachmentsComponent } from '../visit-attachments/visit-attachments.component';

@Component({
    selector: 'app-visit-form',
    standalone: true,
    templateUrl: './visit-form.component.html',
    styleUrl: './visit-form.component.scss',
    imports: [
        CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatButtonModule,
        MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule, MatIconModule,
        TranslatePipe,
        CkCardComponent, CkFormActionsComponent,
        VisitAttachmentsComponent,
    ],
})
export class VisitFormComponent implements OnInit {
    @Input() patientId = '';
    @Output() saved   = new EventEmitter<Visit>();
    @Output() cancelled = new EventEmitter<void>();

    private readonly fb    = inject(FormBuilder);
    private readonly svc   = inject(VisitsService);
    private readonly toast = inject(ToastService);

    form!: FormGroup;
    submitting = false;

    savedVisit = signal<Visit | null>(null);

    get meds(): FormArray { return this.form.get('medications') as FormArray; }
    get f(): Record<string, AbstractControl> { return this.form.controls; }

    ngOnInit(): void {
        this.form = this.fb.group({
            visitDate:      [new Date(), Validators.required],
            chiefComplaint: [''],
            diagnosis:      [''],
            notes:          [''],
            medications:    this.fb.array([]),
        });
    }

    addMedication(): void {
        this.meds.push(this.fb.group({
            medicineName: ['', Validators.required],
            dosage:       [''],
            frequency:    [''],
            duration:     [''],
            instructions: [''],
        }));
    }

    removeMedication(index: number): void {
        this.meds.removeAt(index);
    }

    onSubmit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.submitting = true;
        const raw = this.form.value;

        this.svc.create({
            patientId:      this.patientId,
            visitDate:      (raw.visitDate as Date).toISOString().split('T')[0],
            chiefComplaint: raw.chiefComplaint || undefined,
            diagnosis:      raw.diagnosis || undefined,
            notes:          raw.notes || undefined,
            medications:    raw.medications.map((m: Record<string, string>) => ({
                medicineName: m['medicineName'],
                dosage:       m['dosage'] || undefined,
                frequency:    m['frequency'] || undefined,
                duration:     m['duration'] || undefined,
                instructions: m['instructions'] || undefined,
            })),
        }).subscribe({
            next: visit => {
                this.submitting = false;
                this.toast.success('تم حفظ الزيارة بنجاح');
                // Show attachments step instead of closing immediately
                this.savedVisit.set(visit);
            },
            error: () => { this.submitting = false; },
        });
    }

    onDone(): void {
        this.saved.emit(this.savedVisit()!);
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}

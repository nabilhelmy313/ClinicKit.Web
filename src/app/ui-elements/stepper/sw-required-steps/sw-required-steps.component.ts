import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
    selector: 'app-sw-required-steps',
    imports: [
        MatButtonModule,
        MatStepperModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        AsyncPipe
    ],
    templateUrl: './sw-required-steps.component.html',
    styleUrl: './sw-required-steps.component.scss'
})
export class SwRequiredStepsComponent {

    private _formBuilder = inject(FormBuilder);

    firstFormGroup = this._formBuilder.group({
        firstCtrl: ['', Validators.required],
    });
    secondFormGroup = this._formBuilder.group({
        secondCtrl: ['', Validators.required],
    });
    thirdFormGroup = this._formBuilder.group({
        thirdCtrl: ['', Validators.required],
    });
    stepperOrientation: Observable<StepperOrientation>;

    constructor() {
        const breakpointObserver = inject(BreakpointObserver);
        this.stepperOrientation = breakpointObserver
        .observe('(min-width: 800px)')
        .pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
    }

}
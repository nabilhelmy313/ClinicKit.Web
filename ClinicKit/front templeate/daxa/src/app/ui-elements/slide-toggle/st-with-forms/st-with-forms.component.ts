import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-st-with-forms',
    imports: [
        FormsModule,
        MatButtonModule,
        ReactiveFormsModule,
        MatSlideToggleModule
    ],
    templateUrl: './st-with-forms.component.html',
    styleUrl: './st-with-forms.component.scss'
})
export class StWithFormsComponent {

    private _formBuilder = inject(FormBuilder);

    isChecked = true;
    formGroup = this._formBuilder.group({
        enableWifi: '',
        acceptTerms: ['', Validators.requiredTrue],
    });

    alertFormValues(formGroup: FormGroup) {
        alert(JSON.stringify(formGroup.value, null, 2));
    }

}
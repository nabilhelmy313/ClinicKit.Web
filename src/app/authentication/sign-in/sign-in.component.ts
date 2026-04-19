import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-sign-in',
    imports: [
        RouterLink, NgIf,
        MatFormFieldModule, MatInputModule, MatButtonModule,
        MatCheckboxModule, MatProgressSpinnerModule,
        ReactiveFormsModule,
    ],
    templateUrl: './sign-in.component.html',
    styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

    // Form
    authForm: FormGroup;

    // UI state
    hide      = true;
    isLoading = signal(false);
    apiError  = signal<string | null>(null);

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        public themeService: CustomizerSettingsService,
    ) {
        this.authForm = this.fb.group({
            email:    ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
        });
    }

    onSubmit(): void {
        if (this.authForm.invalid) return;

        this.isLoading.set(true);
        this.apiError.set(null);

        const { email, password } = this.authForm.value;

        this.authService.login({ email, password }).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.router.navigate(['/dashboard']);
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading.set(false);
                if (err.status === 401 || err.status === 400) {
                    this.apiError.set('Invalid email or password. Please try again.');
                } else if (err.status === 0) {
                    this.apiError.set('Cannot reach the server. Please check your connection.');
                } else {
                    this.apiError.set('An unexpected error occurred. Please try again.');
                }
            },
        });
    }
}

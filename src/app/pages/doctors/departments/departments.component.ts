import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-departments',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
            <h5 class="mb-0">Departments</h5>
        </div>
        <div class="card-box mb-25">
            <p class="text-body mb-0">Clinic departments and specialities.</p>
            <div class="alert alert-info mt-15" role="alert">
                <i class="material-symbols-outlined me-2">construction</i>
                Full implementation — Week 2 sprint.
            </div>
        </div>
    `,
})
export class DepartmentsComponent {}

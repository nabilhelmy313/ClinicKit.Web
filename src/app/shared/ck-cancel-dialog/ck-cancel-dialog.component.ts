import { Component, inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
    MatDialogRef, MAT_DIALOG_DATA, MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';

import { TranslatePipe }   from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { ThemeService }    from '../../core/services/theme.service';
import { CkBtnComponent }  from '../ck-btn/ck-btn.component';

/** Data passed when opening the dialog. */
export interface CkCancelDialogData {
    /** Patient's full name — shown in the dialog body. */
    patientName: string;
}

/** Value emitted via dialogRef.close() on confirm. `undefined` = dismissed. */
export interface CkCancelDialogResult {
    confirmed: true;
    reason: string | null;
}

@Component({
    selector: 'ck-cancel-dialog',
    standalone: true,
    templateUrl: './ck-cancel-dialog.component.html',
    styleUrl:    './ck-cancel-dialog.component.scss',
    imports: [
        CommonModule, ReactiveFormsModule,
        MatDialogModule, MatFormFieldModule, MatInputModule,
        TranslatePipe, CkBtnComponent,
    ],
})
export class CkCancelDialogComponent {
    readonly dialogRef    = inject(MatDialogRef<CkCancelDialogComponent>);
    readonly data         = inject<CkCancelDialogData>(MAT_DIALOG_DATA);
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);

    reasonCtrl = new FormControl<string>('');

    confirm(): void {
        const reason = this.reasonCtrl.value?.trim() || null;
        this.dialogRef.close({ confirmed: true, reason } satisfies CkCancelDialogResult);
    }

    dismiss(): void {
        this.dialogRef.close(undefined);
    }
}

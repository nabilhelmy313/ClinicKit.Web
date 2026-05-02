import { Component, inject } from '@angular/core';
import { TranslatePipe }     from '../../../core/pipes/translate.pipe';
import { LanguageService }   from '../../../core/services/language.service';
import { ThemeService }      from '../../../core/services/theme.service';
import { CkPageHeaderComponent, CkCardComponent } from '../../../shared/index';

@Component({
    selector: 'app-medical-records',
    standalone: true,
    templateUrl: './medical-records.component.html',
    styleUrl:    './medical-records.component.scss',
    imports: [TranslatePipe, CkPageHeaderComponent, CkCardComponent],
})
export class MedicalRecordsComponent {
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
}

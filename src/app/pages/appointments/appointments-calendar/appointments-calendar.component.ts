import { Component, inject } from '@angular/core';
import { TranslatePipe }     from '../../../core/pipes/translate.pipe';
import { LanguageService }   from '../../../core/services/language.service';
import { ThemeService }      from '../../../core/services/theme.service';
import { CkPageHeaderComponent, CkCardComponent } from '../../../shared/index';

@Component({
    selector: 'app-appointments-calendar',
    standalone: true,
    templateUrl: './appointments-calendar.component.html',
    styleUrl:    './appointments-calendar.component.scss',
    imports: [TranslatePipe, CkPageHeaderComponent, CkCardComponent],
})
export class AppointmentsCalendarComponent {
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(ThemeService);
}

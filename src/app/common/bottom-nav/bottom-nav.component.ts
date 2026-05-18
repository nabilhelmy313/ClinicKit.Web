import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { AuthService } from '../../core/services/auth.service';
import { BottomNavMoreSheetComponent } from './bottom-nav-more-sheet.component';

@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, NgClass, MatBottomSheetModule, TranslatePipe],
    templateUrl: './bottom-nav.component.html',
    styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
    readonly langService  = inject(LanguageService);
    readonly themeService = inject(CustomizerSettingsService);
    private readonly auth = inject(AuthService);
    private readonly bottomSheet = inject(MatBottomSheet);
    private readonly router = inject(Router);

    readonly isAdmin = computed(() => this.auth.currentUser()?.roles.includes('Admin') ?? false);
    readonly isAdminOrReceptionist = computed(
        () => this.auth.currentUser()?.roles.includes('Admin') || this.auth.currentUser()?.roles.includes('Receptionist') || false
    );

    openMore(): void {
        this.bottomSheet.open(BottomNavMoreSheetComponent, {
            panelClass: this.themeService.isDark() ? ['bottom-sheet-dark'] : [],
        });
    }
}

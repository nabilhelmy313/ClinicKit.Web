import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
    selector: 'app-bottom-nav-more-sheet',
    standalone: true,
    imports: [RouterLink, TranslatePipe],
    template: `
        <div class="more-sheet" [class.dark]="themeService.isDark()">
            <div class="sheet-handle"></div>

            <!-- Profile header -->
            <div class="sheet-profile">
                <i class="material-symbols-outlined sheet-avatar">account_circle</i>
                <span class="sheet-email">{{ userEmail() }}</span>
            </div>

            <div class="sheet-divider"></div>

            <div class="sheet-menu">
                <!-- Dark / Light mode -->
                <button class="sheet-item" (click)="toggleTheme()">
                    <i class="material-symbols-outlined sheet-item__icon">
                        {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
                    </i>
                    <span class="sheet-item__label">
                        {{ (themeService.isDark() ? 'TOPBAR.LIGHT_MODE' : 'TOPBAR.DARK_MODE') | translate }}
                    </span>
                </button>

                <!-- Language switch -->
                <button class="sheet-item" (click)="toggleLang()">
                    <i class="material-symbols-outlined sheet-item__icon">translate</i>
                    <span class="sheet-item__label">{{ langSwitchLabel() }}</span>
                </button>

                @if (isAdminOrReceptionist()) {
                    <a class="sheet-item" routerLink="/billing" (click)="close()">
                        <i class="material-symbols-outlined sheet-item__icon">receipt_long</i>
                        <span class="sheet-item__label">{{ 'SIDEBAR.BILLING' | translate }}</span>
                    </a>
                }
                @if (isAdmin()) {
                    <a class="sheet-item" routerLink="/reports" (click)="close()">
                        <i class="material-symbols-outlined sheet-item__icon">bar_chart</i>
                        <span class="sheet-item__label">{{ 'SIDEBAR.REPORTS' | translate }}</span>
                    </a>
                    <a class="sheet-item" routerLink="/settings" (click)="close()">
                        <i class="material-symbols-outlined sheet-item__icon">settings</i>
                        <span class="sheet-item__label">{{ 'SIDEBAR.SETTINGS' | translate }}</span>
                    </a>
                }

                <div class="sheet-divider"></div>

                <!-- Logout -->
                <button class="sheet-item sheet-item--danger" (click)="logout()">
                    <i class="material-symbols-outlined sheet-item__icon">logout</i>
                    <span class="sheet-item__label">{{ 'AUTH.LOGOUT' | translate }}</span>
                </button>
            </div>

            <div style="height: env(safe-area-inset-bottom, 8px)"></div>
        </div>
    `,
    styles: [`
        .more-sheet {
            padding: 8px 0 0;
            background: #fff;
            min-width: 100%;
        }
        .more-sheet.dark {
            background: #1a1a2e;
            color: #e5e7eb;
            .sheet-email { color: #9ca3af; }
            .sheet-divider { background: rgba(255,255,255,0.08); }
            .sheet-item {
                color: #e5e7eb;
                &:hover { background: rgba(255,255,255,0.06); }
                .sheet-item__icon { color: #4ade80; }
            }
            .sheet-item--danger {
                color: #f87171;
                .sheet-item__icon { color: #f87171; }
            }
        }
        .sheet-handle {
            width: 40px;
            height: 4px;
            background: #d1d5db;
            border-radius: 2px;
            margin: 0 auto 12px;
        }
        .sheet-profile {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 4px 20px 12px;
        }
        .sheet-avatar {
            font-size: 36px;
            color: #0D5238;
            flex-shrink: 0;
        }
        .sheet-email {
            font-size: 13px;
            color: #6b7280;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .sheet-divider {
            height: 1px;
            background: #f3f4f6;
            margin: 4px 0;
        }
        .sheet-menu {
            display: flex;
            flex-direction: column;
        }
        .sheet-item {
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            padding: 14px 20px;
            border: none;
            background: transparent;
            text-align: start;
            text-decoration: none;
            color: #111827;
            font-size: 15px;
            font-family: inherit;
            cursor: pointer;
            transition: background 0.15s;

            &:hover { background: #f9fafb; }

            &--danger {
                color: #dc2626;
                .sheet-item__icon { color: #dc2626 !important; }
            }
        }
        .sheet-item__icon {
            font-size: 22px;
            color: #0D5238;
            flex-shrink: 0;
        }
        .sheet-item__label {
            flex: 1;
            font-weight: 500;
        }
    `],
})
export class BottomNavMoreSheetComponent {
    readonly themeService = inject(CustomizerSettingsService);
    readonly langService  = inject(LanguageService);
    private readonly sheetRef = inject(MatBottomSheetRef<BottomNavMoreSheetComponent>);
    private readonly auth = inject(AuthService);

    readonly langSwitchLabel = computed(() =>
        this.langService.lang() === 'ar' ? 'EN — English' : 'عر — العربية'
    );

    readonly isAdmin = computed(() => this.auth.currentUser()?.roles.includes('Admin') ?? false);
    readonly isAdminOrReceptionist = computed(
        () => this.auth.currentUser()?.roles.includes('Admin') || this.auth.currentUser()?.roles.includes('Receptionist') || false
    );
    readonly userEmail = computed(() => this.auth.currentUser()?.email ?? '');

    toggleTheme(): void { this.themeService.toggleTheme(); }

    toggleLang(): void {
        this.langService.switchLanguage(this.langService.lang() === 'ar' ? 'en' : 'ar');
    }

    logout(): void {
        this.sheetRef.dismiss();
        this.auth.logout();
    }

    close(): void { this.sheetRef.dismiss(); }
}

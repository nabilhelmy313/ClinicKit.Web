import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToggleService } from '../../core/services/toggle.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'ck-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatExpansionModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  protected readonly toggleService = inject(ToggleService);
  protected readonly themeService = inject(ThemeService);

  protected readonly isOpen = this.toggleService.sidebarOpen;
  protected readonly isDark = computed(() => this.themeService.isDark());

  toggle(): void {
    this.toggleService.toggle();
  }
}

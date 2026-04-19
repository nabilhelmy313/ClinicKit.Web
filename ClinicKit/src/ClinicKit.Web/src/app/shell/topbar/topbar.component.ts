import { Component, inject, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToggleService } from '../../core/services/toggle.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'ck-topbar',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatMenuModule, MatBadgeModule,
    MatIconModule, MatTooltipModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  protected readonly toggleService = inject(ToggleService);
  protected readonly themeService = inject(ThemeService);

  protected readonly isSidebarOpen = this.toggleService.sidebarOpen;
  protected readonly isDark = computed(() => this.themeService.isDark());
  protected isSticky = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.isSticky = window.scrollY > 0;
  }

  toggleSidebar(): void {
    this.toggleService.toggle();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  // Notifications placeholder
  protected notifications = [
    { icon: 'ri-calendar-check-line', text: 'New appointment booked — Ahmed Ali', time: '5 min ago', color: '#C41E3A' },
    { icon: 'ri-user-add-line',       text: 'New patient registered — Sara Kamal', time: '22 min ago', color: '#2563eb' },
    { icon: 'ri-bill-line',           text: 'Invoice #1042 is overdue',            time: '1 hr ago',  color: '#d97706' },
  ];
}

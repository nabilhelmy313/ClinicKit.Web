import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'ck-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="ck-404">
      <h1>404</h1>
      <p>Page not found.</p>
      <a routerLink="/dashboard">← Back to Dashboard</a>
    </div>
  `,
  styles: [`
    .ck-404 {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      h1 { font-size: 5rem; font-weight: 800; color: #C41E3A; margin: 0; }
      p { font-size: 1.1rem; color: #666; margin: 0; }
      a { color: #C41E3A; text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } }
    }
  `]
})
export class NotFoundComponent {}

import { Injectable, signal, effect, inject, DOCUMENT } from '@angular/core';

export type ColorTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private _theme = signal<ColorTheme>(this.loadSaved());

  readonly theme = this._theme.asReadonly();

  constructor() {
    // Apply theme class to <body> whenever signal changes
    effect(() => {
      const body = this.doc.body;
      body.classList.remove('light-theme', 'dark-theme');
      body.classList.add(`${this._theme()}-theme`);
      localStorage.setItem('ck-theme', this._theme());
    });
  }

  isDark(): boolean {
    return this._theme() === 'dark';
  }

  toggleTheme(): void {
    this._theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: ColorTheme): void {
    this._theme.set(theme);
  }

  private loadSaved(): ColorTheme {
    const saved = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('ck-theme') as ColorTheme | null)
      : null;
    return saved ?? 'light';
  }
}

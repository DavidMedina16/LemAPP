import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

const DARK_KEY = 'lemapp_dark';

/**
 * Tema global de la app. Aplica/quita la clase `.app-dark` en <html>
 * (el darkModeSelector de PrimeNG) y persiste la preferencia en localStorage.
 * Se inicializa al arranque para que funcione en cualquier ruta (login incluido).
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** True si el modo oscuro está activo. */
  readonly isDark = signal(localStorage.getItem(DARK_KEY) === 'true');

  constructor() {
    this.apply(this.isDark());
  }

  /** Alterna el modo oscuro y persiste la preferencia. */
  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    this.apply(next);
    localStorage.setItem(DARK_KEY, String(next));
  }

  private apply(dark: boolean): void {
    this.document.documentElement.classList.toggle('app-dark', dark);
  }
}

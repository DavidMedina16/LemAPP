import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Inicializa el tema (modo claro/oscuro) al arranque, en cualquier ruta.
  private readonly theme = inject(ThemeService);
  protected readonly title = signal('lemapp-frontend');
}

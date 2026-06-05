import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Auth } from '../../core/services/auth';
import { ThemeService } from '../../core/services/theme';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Button, ConfirmDialogModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

  /** Usuario autenticado (signal del AuthService). */
  readonly user = this.auth.currentUser;

  /** Estado del modo oscuro (gestionado por ThemeService). */
  readonly isDark = this.theme.isDark;

  /** Drawer del menú lateral en móvil (cerrado por defecto). */
  readonly isMobileMenuOpen = signal(false);

  /** Alterna el modo oscuro. */
  toggleDarkMode(): void {
    this.theme.toggle();
  }

  /** Abre/cierra el menú lateral en móvil. */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  /** Cierra el menú lateral (overlay o al navegar). */
  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

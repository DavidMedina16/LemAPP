import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Button],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  /** Usuario autenticado (signal del AuthService). */
  readonly user = this.auth.currentUser;

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

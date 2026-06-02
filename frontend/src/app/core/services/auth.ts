import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

/** Usuario autenticado tal como lo devuelve el backend. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

/** Respuesta del endpoint POST /auth/login. */
export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

const API_URL = 'http://localhost:3000';
const TOKEN_KEY = 'lemapp_access_token';
const USER_KEY = 'lemapp_user';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);

  // Estado reactivo basado en signals; se inicializa desde localStorage para
  // sobrevivir a un refresh del navegador.
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _currentUser = signal<AuthUser | null>(this.readStoredUser());

  /** Token JWT actual (o null). Útil para el interceptor más adelante. */
  readonly token = this._token.asReadonly();
  /** Usuario autenticado actual (o null). */
  readonly currentUser = this._currentUser.asReadonly();
  /** True si hay sesión activa. */
  readonly isAuthenticated = computed(() => this._token() !== null);

  /**
   * Autentica contra el backend. En éxito persiste el token + usuario y
   * actualiza las signals. Devuelve el Observable para que el componente
   * reaccione (navegar, mostrar error, etc.).
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  /** Cierra sesión: limpia storage y estado. */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
  }

  private setSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.access_token);
    this._currentUser.set(res.user);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}

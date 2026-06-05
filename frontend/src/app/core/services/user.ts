import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Usuario/personal tal como lo devuelve el backend (sin password). */
export interface User {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  roleId: number;
}

const API_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  // El jwtInterceptor inyecta el Bearer token automáticamente.
  private readonly baseUrl = `${API_URL}/users`;

  /** GET /users — lista del personal (lectura para cualquier autenticado). */
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }
}

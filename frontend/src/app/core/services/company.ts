import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Empresa tal como la devuelve el backend (espejo del modelo Prisma). */
export interface Company {
  id: number;
  name: string;
  taxId: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos que acepta el backend al crear/actualizar una empresa.
 * Espeja CreateCompanyDto: `name` y `taxId` requeridos; el resto opcional.
 */
export interface CompanyPayload {
  name: string;
  taxId: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

const API_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private readonly http = inject(HttpClient);

  // El jwtInterceptor inyecta el Bearer token automáticamente; aquí no
  // tocamos cabeceras de autenticación.
  private readonly baseUrl = `${API_URL}/companies`;

  /** GET /companies — lo lee cualquier usuario autenticado. */
  getAll(): Observable<Company[]> {
    return this.http.get<Company[]>(this.baseUrl);
  }

  /** POST /companies — requiere rol administradora. */
  create(payload: CompanyPayload): Observable<Company> {
    return this.http.post<Company>(this.baseUrl, payload);
  }

  /** PATCH /companies/:id — requiere rol administradora. */
  update(id: number, payload: Partial<CompanyPayload>): Observable<Company> {
    return this.http.patch<Company>(`${this.baseUrl}/${id}`, payload);
  }

  /** DELETE /companies/:id — requiere rol administradora. */
  delete(id: number): Observable<Company> {
    return this.http.delete<Company>(`${this.baseUrl}/${id}`);
  }
}

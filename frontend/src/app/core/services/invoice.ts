import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Company } from './company';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

/**
 * Factura / cuenta de cobro tal como la devuelve el backend.
 * Los montos son Decimal en Prisma → llegan como string en el JSON.
 */
export interface Invoice {
  id: number;
  invoiceNumber: string;
  concept: string;
  status: InvoiceStatus;
  subtotal: string;
  tax: string;
  total: string;
  issueDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
  shareToken: string;
  companyId: number;
  // Presente cuando el backend popula la relación (p.ej. en /invoices/share/:token).
  company?: Company | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/actualizar una factura. Espeja CreateInvoiceDto:
 * `invoiceNumber`, `subtotal`, `total` y `companyId` requeridos; el resto
 * opcional. `shareToken` lo genera el backend (no se envía).
 */
export interface InvoicePayload {
  concept: string;
  companyId: number;
  subtotal: number;
  total: number;
  tax?: number;
  status?: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  paidAt?: string;
}

const API_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private readonly http = inject(HttpClient);

  // El jwtInterceptor inyecta el Bearer token automáticamente.
  private readonly baseUrl = `${API_URL}/invoices`;

  /** GET /invoices */
  getAll(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.baseUrl);
  }

  /**
   * GET /invoices/share/:token — endpoint público para el cliente final.
   * Devuelve `null` si el token no existe (el backend no lanza 404).
   */
  getSharedInvoice(token: string): Observable<Invoice | null> {
    return this.http.get<Invoice | null>(`${this.baseUrl}/share/${token}`);
  }

  /** POST /invoices */
  create(payload: InvoicePayload): Observable<Invoice> {
    return this.http.post<Invoice>(this.baseUrl, payload);
  }

  /** PATCH /invoices/:id */
  update(id: number, payload: Partial<InvoicePayload>): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.baseUrl}/${id}`, payload);
  }

  /** DELETE /invoices/:id */
  delete(id: number): Observable<Invoice> {
    return this.http.delete<Invoice>(`${this.baseUrl}/${id}`);
  }
}

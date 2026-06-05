import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

import { Invoice, InvoiceStatus } from './invoice';

/** Datos mínimos de la empresa para el encabezado del PDF. */
export interface PdfCompany {
  name: string;
  taxId?: string | null;
}

// Paleta extraída del logo de LEMA Consultorías.
const PURPLE: [number, number, number] = [123, 31, 162];
const BLUE: [number, number, number] = [28, 167, 236];
const DARK: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [229, 231, 235];

const BRAND = 'LEMA Consultorías';
const TAGLINE = 'Tributarias · Laborales · Contables';
const LOGO_URL = 'iconoLemapp.png';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
};

/**
 * Genera un PDF minimalista de la cuenta de cobro, con el branding (logo +
 * paleta morado/azul) de LEMA Consultorías. Generación 100% en el cliente.
 */
@Injectable({
  providedIn: 'root',
})
export class InvoicePdfService {
  async generate(invoice: Invoice, company: PdfCompany): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginX = 18;
    const logo = await this.loadImage(LOGO_URL);

    // ===== Encabezado =====
    let y = 18;
    if (logo) {
      doc.addImage(logo, 'PNG', marginX, y - 4, 18, 18);
    }
    const textX = logo ? marginX + 23 : marginX;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...PURPLE);
    doc.text(BRAND, textX, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(TAGLINE, textX, y + 7.5);

    // Bloque derecho: título + número + estado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    doc.text('CUENTA DE COBRO', pageW - marginX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`N.º ${invoice.invoiceNumber}`, pageW - marginX, y + 6, { align: 'right' });
    doc.text(`Estado: ${STATUS_LABEL[invoice.status]}`, pageW - marginX, y + 11, {
      align: 'right',
    });

    // Línea de acento
    y += 18;
    doc.setDrawColor(...PURPLE);
    doc.setLineWidth(0.8);
    doc.line(marginX, y, pageW - marginX, y);

    // ===== Datos: empresa (izq) + fechas (der) =====
    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('FACTURAR A', marginX, y);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(company.name, marginX, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`NIT: ${company.taxId ?? '—'}`, marginX, y + 11.5);

    doc.setFontSize(8);
    doc.text('EMISIÓN', pageW - marginX, y, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(this.formatDate(invoice.issueDate), pageW - marginX, y + 5.5, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('VENCIMIENTO', pageW - marginX, y + 11, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(this.formatDate(invoice.dueDate), pageW - marginX, y + 16.5, { align: 'right' });

    // ===== Concepto =====
    y += 30;
    doc.setFillColor(...PURPLE);
    doc.rect(marginX, y, pageW - marginX * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CONCEPTO', marginX + 3, y + 5.3);

    y += 13;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(invoice.concept || '—', marginX + 3, y);

    y += 4;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageW - marginX, y);

    // ===== Totales (bloque derecho) =====
    y += 10;
    const labelX = pageW - marginX - 60;
    const valueX = pageW - marginX;
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text('Subtotal', labelX, y);
    doc.setTextColor(...DARK);
    doc.text(this.money(invoice.subtotal), valueX, y, { align: 'right' });

    y += 7;
    doc.setTextColor(...MUTED);
    doc.text('IVA', labelX, y);
    doc.setTextColor(...DARK);
    doc.text(this.money(invoice.tax), valueX, y, { align: 'right' });

    // Caja del total con acento
    y += 5;
    doc.setFillColor(...BLUE);
    doc.rect(labelX - 4, y, 64, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL A PAGAR', labelX, y + 7.5);
    doc.setFontSize(12);
    doc.text(this.money(invoice.total), valueX, y + 7.7, { align: 'right' });

    // ===== Pie =====
    const footY = doc.internal.pageSize.getHeight() - 16;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(marginX, footY, pageW - marginX, footY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${BRAND} · ${TAGLINE}`, pageW / 2, footY + 6, { align: 'center' });

    doc.save(`Cuenta-de-cobro-${invoice.invoiceNumber}.pdf`);
  }

  /** Formatea un monto (string Decimal o number) como pesos colombianos. */
  private money(value: string | number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value));
  }

  /** Formatea una fecha ISO como dd/MM/yyyy (o '—' si no hay). */
  private formatDate(iso?: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-CO').format(new Date(iso));
  }

  /** Carga una imagen del sitio y la convierte a dataURL; null si falla. */
  private async loadImage(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Button } from 'primeng/button';

import { Invoice, InvoiceService } from '../../../core/services/invoice';
import { InvoicePdfService } from '../../../core/services/invoice-pdf';

@Component({
  selector: 'app-public-invoice',
  imports: [CurrencyPipe, DatePipe, Button],
  templateUrl: './public-invoice.html',
  styleUrl: './public-invoice.css',
})
export class PublicInvoice implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);
  private readonly invoicePdf = inject(InvoicePdfService);

  /** Factura pública (o null mientras carga / si no existe). */
  readonly invoice = signal<Invoice | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }

    this.invoiceService.getSharedInvoice(token).subscribe({
      next: (invoice) => {
        // El backend devuelve null (no 404) si el token no existe.
        if (invoice) {
          this.invoice.set(invoice);
        } else {
          this.notFound.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Descarga la cuenta de cobro en PDF con el branding de LEMA Consultorías. */
  downloadPdf(): void {
    const inv = this.invoice();
    if (!inv) return;
    void this.invoicePdf.generate(inv, {
      name: inv.company?.name ?? `#${inv.companyId}`,
      taxId: inv.company?.taxId,
    });
  }
}

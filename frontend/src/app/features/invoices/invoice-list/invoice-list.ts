import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { merge } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Button } from 'primeng/button';

import { Company, CompanyService } from '../../../core/services/company';
import {
  Invoice,
  InvoicePayload,
  InvoiceService,
  InvoiceStatus,
} from '../../../core/services/invoice';
import { InvoicePdfService } from '../../../core/services/invoice-pdf';

type TagSeverity = 'success' | 'info' | 'secondary';

@Component({
  selector: 'app-invoice-list',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    TableModule,
    DialogModule,
    ToolbarModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    ToastModule,
    TooltipModule,
    Button,
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.css',
})
export class InvoiceList implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly companyService = inject(CompanyService);
  private readonly messageService = inject(MessageService);
  private readonly invoicePdf = inject(InvoicePdfService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  /** Estado reactivo de la pantalla. */
  readonly invoices = signal<Invoice[]>([]);
  readonly companies = signal<Company[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly saving = signal(false);

  /** Mapa derivado companyId -> razón social, para la columna Empresa. */
  private readonly companyNameById = computed(
    () => new Map(this.companies().map((c) => [c.id, c.name])),
  );

  /** Formulario reactivo de creación de cuenta de cobro. */
  readonly form = this.fb.group({
    companyId: [null as number | null, [Validators.required]],
    concept: ['', [Validators.required]],
    issueDate: [null as Date | null],
    dueDate: [null as Date | null],
    subtotal: [0, [Validators.required]],
    taxAmount: [0],
    totalAmount: [{ value: 0, disabled: true }],
  });

  constructor() {
    // Auto-cálculo: total = subtotal + IVA. Solo escuchamos subtotal/taxAmount
    // y escribimos totalAmount con emitEvent:false para no entrar en bucle.
    merge(this.form.controls.subtotal.valueChanges, this.form.controls.taxAmount.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const subtotal = this.form.controls.subtotal.value ?? 0;
        const tax = this.form.controls.taxAmount.value ?? 0;
        this.form.controls.totalAmount.setValue(subtotal + tax, { emitEvent: false });
      });
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadCompanies();
  }

  /** GET /invoices */
  loadInvoices(): void {
    this.loading.set(true);
    this.invoiceService.getAll().subscribe({
      next: (invoices) => {
        this.invoices.set(invoices);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** GET /companies — alimenta el dropdown de empresa. */
  loadCompanies(): void {
    this.companyService.getAll().subscribe({
      next: (companies) => this.companies.set(companies),
    });
  }

  /** Razón social de la empresa, con fallback al id si no está cargada. */
  companyName(companyId: number): string {
    return this.companyNameById().get(companyId) ?? `#${companyId}`;
  }

  /** Severidad de color del p-tag según el estado. */
  statusSeverity(status: InvoiceStatus): TagSeverity {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      default:
        return 'secondary';
    }
  }

  /** Abre el modal de creación con el formulario limpio. */
  openNew(): void {
    this.form.reset({ subtotal: 0, taxAmount: 0, totalAmount: 0 });
    this.dialogVisible.set(true);
  }

  /** Crea la cuenta de cobro: POST /invoices. */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    // Payload limpio: mapeo taxAmount->tax y totalAmount->total (nombres del DTO).
    const payload: InvoicePayload = {
      concept: raw.concept!,
      companyId: raw.companyId!,
      subtotal: raw.subtotal ?? 0,
      total: raw.totalAmount ?? 0,
      ...(raw.taxAmount != null ? { tax: raw.taxAmount } : {}),
      ...(raw.issueDate ? { issueDate: raw.issueDate.toISOString() } : {}),
      ...(raw.dueDate ? { dueDate: raw.dueDate.toISOString() } : {}),
    };

    this.saving.set(true);
    this.invoiceService.create(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Factura creada',
        });
        this.loadInvoices();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Error',
          detail: 'No se pudo crear la factura.',
        });
      },
    });
  }

  /** Marca una factura como pagada: PATCH /invoices/:id. */
  markAsPaid(invoice: Invoice): void {
    this.invoiceService
      .update(invoice.id, { status: 'paid', paidAt: new Date().toISOString() })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Factura marcada como pagada',
          });
          this.loadInvoices();
        },
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Error',
            detail: 'No se pudo actualizar la factura.',
          });
        },
      });
  }

  /** Descarga la cuenta de cobro en PDF (con branding y NIT de la empresa). */
  downloadPdf(invoice: Invoice): void {
    const company = this.companies().find((c) => c.id === invoice.companyId);
    void this.invoicePdf.generate(invoice, {
      name: company?.name ?? `#${invoice.companyId}`,
      taxId: company?.taxId,
    });
  }

  /**
   * Comparte la factura por WhatsApp: copia el enlace público al portapapeles
   * y abre WhatsApp con un mensaje prearmado para la empresa.
   */
  shareViaWhatsApp(invoice: Invoice): void {
    const url = `http://localhost:4200/share/invoice/${invoice.shareToken}`;
    const company = this.companyName(invoice.companyId);
    const message = `Hola ${company}, te compartimos tu cuenta de cobro ${invoice.invoiceNumber}. Puedes verla aquí: ${url}`;

    try {
      void navigator.clipboard.writeText(url);
      this.messageService.add({
        severity: 'info',
        summary: 'Enlace copiado',
        detail: 'El enlace de la factura se copió al portapapeles.',
      });
    } catch {
      // Si el portapapeles no está disponible, igual abrimos WhatsApp.
    }

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  }
}

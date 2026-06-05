import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Button } from 'primeng/button';

import { Company, CompanyPayload, CompanyService } from '../../../core/services/company';

const ACCESS_DENIED = 'Acceso denegado: Solo el rol Administradora puede modificar empresas';

@Component({
  selector: 'app-company-list',
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ToolbarModule,
    InputTextModule,
    ToastModule,
    Button,
  ],
  templateUrl: './company-list.html',
  styleUrl: './company-list.css',
})
export class CompanyList implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  /** Estado reactivo de la pantalla. */
  readonly companies = signal<Company[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly saving = signal(false);

  /** Id de la empresa en edición; null cuando estamos creando. */
  readonly editingId = signal<number | null>(null);

  /** Título del modal según el modo (crear vs editar). */
  readonly dialogHeader = computed(() =>
    this.editingId() === null ? 'Nueva Empresa' : 'Editar Empresa',
  );

  /** Formulario reactivo: espeja CreateCompanyDto del backend. */
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    taxId: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: [''],
    address: [''],
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  /** Carga la lista real desde GET /companies. */
  loadCompanies(): void {
    this.loading.set(true);
    this.companyService.getAll().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Abre el modal en modo creación con el formulario limpio. */
  openNew(): void {
    this.editingId.set(null);
    this.form.reset();
    this.dialogVisible.set(true);
  }

  /** Abre el modal en modo edición y precarga los datos de la fila. */
  openEdit(company: Company): void {
    this.editingId.set(company.id);
    this.form.reset();
    this.form.patchValue(company);
    this.dialogVisible.set(true);
  }

  /**
   * Crea o actualiza según el modo: POST /companies o PATCH /companies/:id.
   * Toast de éxito + refresco, o toast de advertencia ante error (p.ej. 403).
   */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: CompanyPayload = {
      name: raw.name!,
      taxId: raw.taxId!,
      // Campos opcionales: solo se envían si tienen valor.
      ...(raw.email ? { email: raw.email } : {}),
      ...(raw.phone ? { phone: raw.phone } : {}),
      ...(raw.address ? { address: raw.address } : {}),
    };

    const id = this.editingId();
    const request$ =
      id === null ? this.companyService.create(payload) : this.companyService.update(id, payload);
    const successDetail = id === null ? 'Empresa creada' : 'Empresa actualizada';

    this.saving.set(true);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: successDetail,
        });
        this.loadCompanies();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Operación no permitida',
          detail: ACCESS_DENIED,
        });
      },
    });
  }

  /** Elimina la empresa tras confirmación; DELETE /companies/:id. */
  remove(company: Company): void {
    this.confirmationService.confirm({
      header: 'Eliminar empresa',
      message: `¿Eliminar la empresa "${company.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.companyService.delete(company.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Empresa eliminada',
            });
            this.loadCompanies();
          },
          error: () => {
            this.messageService.add({
              severity: 'warn',
              summary: 'Operación no permitida',
              detail: ACCESS_DENIED,
            });
          },
        });
      },
    });
  }
}

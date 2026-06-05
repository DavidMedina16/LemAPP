import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Button } from 'primeng/button';

import { Auth } from '../../../core/services/auth';
import { Company, CompanyService } from '../../../core/services/company';
import { User, UserService } from '../../../core/services/user';
import {
  PriorityLevel,
  Task,
  TaskPayload,
  TaskService,
  TaskStatus,
} from '../../../core/services/task';

type TagSeverity = 'success' | 'warn' | 'danger';
type TaskFilter = 'all' | TaskStatus;

@Component({
  selector: 'app-task-dashboard',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    TableModule,
    DialogModule,
    ToolbarModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    TagModule,
    ToastModule,
    Button,
  ],
  templateUrl: './task-dashboard.html',
  styleUrl: './task-dashboard.css',
})
export class TaskDashboard implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly companyService = inject(CompanyService);
  private readonly userService = inject(UserService);
  private readonly auth = inject(Auth);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  /** Estado reactivo de la pantalla. */
  readonly tasks = signal<Task[]>([]);
  readonly companies = signal<Company[]>([]);
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly saving = signal(false);

  /** Id de la tarea en edición; null cuando estamos creando. */
  readonly editingId = signal<number | null>(null);

  /** Título del modal según el modo (crear vs editar). */
  readonly dialogHeader = computed(() =>
    this.editingId() === null ? 'Crear Tarea' : 'Editar Tarea',
  );

  /** Filtro de vista activo. */
  readonly currentFilter = signal<TaskFilter>('all');

  /** Tareas visibles según el filtro activo. */
  readonly filteredTasks = computed(() => {
    const filter = this.currentFilter();
    const tasks = this.tasks();
    return filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  });

  /** Mapa derivado companyId -> razón social, para la columna Empresa. */
  private readonly companyNameById = computed(
    () => new Map(this.companies().map((c) => [c.id, c.name])),
  );

  /** Opciones del selectbutton de filtro. */
  readonly filterOptions: { label: string; value: TaskFilter }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendientes', value: 'pending' },
    { label: 'Completadas', value: 'completed' },
  ];

  /** Opciones estáticas del dropdown de prioridad. */
  readonly priorityOptions: { label: string; value: PriorityLevel }[] = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' },
  ];

  /** Opciones del select de estado (inline en la tabla). */
  readonly statusOptions: { label: string; value: TaskStatus }[] = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'En progreso', value: 'in_progress' },
    { label: 'Completada', value: 'completed' },
  ];

  /** Formulario reactivo: espeja los campos editables de CreateTaskDto. */
  readonly form = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    companyId: [null as number | null, [Validators.required]],
    dueDate: [null as Date | null],
    priority: ['medium' as PriorityLevel],
    assignedToId: [null as number | null],
  });

  ngOnInit(): void {
    this.loadTasks();
    this.loadCompanies();
    this.loadUsers();
  }

  /** GET /tasks */
  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getAll().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
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

  /** GET /users — alimenta el dropdown "Asignar a". */
  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => this.users.set(users),
    });
  }

  /** Razón social de la empresa, con fallback al id si no está cargada. */
  companyName(companyId: number): string {
    return this.companyNameById().get(companyId) ?? `#${companyId}`;
  }

  /** Severidad de color del p-tag según la prioridad. */
  prioritySeverity(priority: PriorityLevel): TagSeverity {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'low':
        return 'success';
      default:
        return 'warn';
    }
  }

  /** Abre el modal en modo creación con el formulario limpio. */
  openNew(): void {
    this.editingId.set(null);
    this.form.reset({ priority: 'medium' });
    this.dialogVisible.set(true);
  }

  /** Abre el modal en modo edición y precarga los datos de la fila. */
  openEdit(task: Task): void {
    this.editingId.set(task.id);
    this.form.reset({ priority: 'medium' });
    this.form.patchValue({
      title: task.title,
      description: task.description ?? '',
      companyId: task.companyId,
      // El backend devuelve dueDate como string ISO; el p-datepicker espera Date.
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      priority: task.priority,
      assignedToId: task.assignedToId ?? null,
    });
    this.dialogVisible.set(true);
  }

  /**
   * Crea o actualiza según el modo. En creación resuelve createdById/assignedToId
   * desde el usuario autenticado; en edición solo envía los campos editables.
   */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    // Campos comunes (limpios: solo los del DTO, por forbidNonWhitelisted).
    const base = {
      title: raw.title!,
      companyId: raw.companyId!,
      priority: raw.priority ?? 'medium',
      ...(raw.description ? { description: raw.description } : {}),
      ...(raw.dueDate ? { dueDate: raw.dueDate.toISOString() } : {}),
      // assignedToId sale del dropdown "Asignar a"; opcional.
      ...(raw.assignedToId ? { assignedToId: raw.assignedToId } : {}),
    };

    const id = this.editingId();

    if (id === null) {
      const userId = Number(this.auth.currentUser()?.id);
      if (!userId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sesión',
          detail: 'No se pudo identificar al usuario actual.',
        });
        return;
      }
      const payload: TaskPayload = {
        ...base,
        createdById: userId,
      };
      this.submit(this.taskService.create(payload), 'Tarea creada');
    } else {
      this.submit(this.taskService.update(id, base), 'Tarea actualizada');
    }
  }

  /** Suscripción compartida para crear/actualizar con feedback por toast. */
  private submit(request$: ReturnType<TaskService['create']>, successDetail: string): void {
    this.saving.set(true);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: successDetail });
        this.loadTasks();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Error',
          detail: 'No se pudo guardar la tarea.',
        });
      },
    });
  }

  /** Cambia el estado de una tarea de inmediato (PATCH /tasks/:id). */
  updateStatus(taskId: number, status: TaskStatus): void {
    this.taskService.update(taskId, { status }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: 'El estado de la tarea se actualizó.',
        });
        this.loadTasks();
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado.',
        });
      },
    });
  }

  /** Elimina la tarea tras confirmación; DELETE /tasks/:id. */
  remove(task: Task): void {
    this.confirmationService.confirm({
      header: 'Eliminar tarea',
      message: `¿Eliminar la tarea "${task.title}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.taskService.delete(task.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Tarea eliminada',
            });
            this.loadTasks();
          },
          error: () => {
            this.messageService.add({
              severity: 'warn',
              summary: 'Error',
              detail: 'No se pudo eliminar la tarea.',
            });
          },
        });
      },
    });
  }
}

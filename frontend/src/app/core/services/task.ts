import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type PriorityLevel = 'low' | 'medium' | 'high';

/** Tarea tal como la devuelve el backend (espejo del modelo Prisma). */
export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: PriorityLevel;
  dueDate?: string | null;
  companyId: number;
  createdById: number;
  assignedToId?: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos que acepta el backend al crear/actualizar una tarea.
 * Espeja CreateTaskDto: `title`, `companyId` y `createdById` requeridos.
 */
export interface TaskPayload {
  title: string;
  companyId: number;
  createdById: number;
  description?: string;
  status?: TaskStatus;
  priority?: PriorityLevel;
  dueDate?: string;
  assignedToId?: number;
}

const API_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);

  // El jwtInterceptor inyecta el Bearer token automáticamente; aquí no
  // tocamos cabeceras de autenticación.
  private readonly baseUrl = `${API_URL}/tasks`;

  /** GET /tasks */
  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  /** POST /tasks */
  create(payload: TaskPayload): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, payload);
  }

  /** PATCH /tasks/:id */
  update(id: number, payload: Partial<TaskPayload>): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, payload);
  }

  /** DELETE /tasks/:id */
  delete(id: number): Observable<Task> {
    return this.http.delete<Task>(`${this.baseUrl}/${id}`);
  }
}

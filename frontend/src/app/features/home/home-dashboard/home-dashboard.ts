import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { Button } from 'primeng/button';

import { Company, CompanyService } from '../../../core/services/company';
import { PriorityLevel, Task, TaskService } from '../../../core/services/task';

/** Celda del calendario: un día del mes con sus tareas. */
interface DayCell {
  day: number;
  isToday: boolean;
  tasks: Task[];
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

@Component({
  selector: 'app-home-dashboard',
  imports: [RouterLink, ChartModule, Button],
  templateUrl: './home-dashboard.html',
  styleUrl: './home-dashboard.css',
})
export class HomeDashboard implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly taskService = inject(TaskService);

  readonly weekdays = WEEKDAYS;

  /** Recursos crudos. */
  private readonly companies = signal<Company[]>([]);
  private readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);

  /** Mes visible (year + month 0-11). Inicia en el mes actual. */
  private readonly today = new Date();
  readonly currentMonth = signal({
    year: this.today.getFullYear(),
    month: this.today.getMonth(),
  });

  private readonly companyNameById = computed(
    () => new Map(this.companies().map((c) => [c.id, c.name])),
  );

  /** Etiqueta "Junio 2026" del mes visible. */
  readonly monthLabel = computed(() => {
    const { year, month } = this.currentMonth();
    const label = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  /** Tareas con vencimiento dentro del mes visible. */
  private readonly monthTasks = computed(() => {
    const { year, month } = this.currentMonth();
    return this.tasks().filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  });

  /** Matriz de semanas (Lun→Dom) con las tareas de cada día. */
  readonly weeks = computed<(DayCell | null)[][]>(() => {
    const { year, month } = this.currentMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Lun = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const isCurrentMonth = this.today.getFullYear() === year && this.today.getMonth() === month;

    const cells: (DayCell | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        isToday: isCurrentMonth && this.today.getDate() === day,
        tasks: this.monthTasks().filter((t) => new Date(t.dueDate!).getDate() === day),
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (DayCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  });

  /** Datos de la gráfica: tareas por empresa en el mes visible. */
  readonly chartData = computed(() => {
    const counts = new Map<number, number>();
    for (const t of this.monthTasks()) {
      counts.set(t.companyId, (counts.get(t.companyId) ?? 0) + 1);
    }
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([id]) => this.companyName(id)),
      datasets: [
        {
          label: 'Tareas',
          data: entries.map(([, n]) => n),
          backgroundColor: entries.map((_, i) => (i % 2 ? '#1CA7EC' : '#7B1FA2')),
          borderRadius: 6,
        },
      ],
    };
  });

  /** Opciones de la gráfica (legibles en claro y oscuro). */
  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { color: '#9ca3af', precision: 0 },
        grid: { color: 'rgba(148,163,184,0.2)' },
      },
    },
  };

  ngOnInit(): void {
    forkJoin({
      companies: this.companyService.getAll(),
      tasks: this.taskService.getAll(),
    }).subscribe({
      next: ({ companies, tasks }) => {
        this.companies.set(companies);
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Mes anterior. */
  prevMonth(): void {
    this.currentMonth.update(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  }

  /** Mes siguiente. */
  nextMonth(): void {
    this.currentMonth.update(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  }

  /** Vuelve al mes actual. */
  goToday(): void {
    this.currentMonth.set({ year: this.today.getFullYear(), month: this.today.getMonth() });
  }

  /** Razón social de la empresa (fallback al id). */
  companyName(companyId: number): string {
    return this.companyNameById().get(companyId) ?? `#${companyId}`;
  }

  /** Clase del punto de color según la prioridad de la tarea. */
  priorityDot(priority: PriorityLevel): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'low':
        return 'bg-emerald-500';
      default:
        return 'bg-amber-500';
    }
  }
}

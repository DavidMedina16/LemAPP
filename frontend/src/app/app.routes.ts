import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Dashboard } from './layout/dashboard/dashboard';
import { authGuard, guestGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  {
    // Vista pública del cliente final: sin authGuard.
    path: 'share/invoice/:token',
    loadComponent: () =>
      import('./features/invoices/public-invoice/public-invoice').then((m) => m.PublicInvoice),
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home-dashboard/home-dashboard').then((m) => m.HomeDashboard),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/company-list/company-list').then((m) => m.CompanyList),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-dashboard/task-dashboard').then((m) => m.TaskDashboard),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoice-list/invoice-list').then((m) => m.InvoiceList),
      },
    ],
  },
];

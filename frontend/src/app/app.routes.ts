import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Dashboard } from './layout/dashboard/dashboard';
import { authGuard, guestGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [],
  },
];

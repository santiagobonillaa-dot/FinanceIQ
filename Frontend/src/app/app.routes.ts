import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing-page.component').then((m) => m.LandingPageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/signup-page.component').then((m) => m.SignupPageComponent)
  },
  {
    path: 'recovery',
    loadComponent: () => import('./features/auth/password-recovery-page.component').then((m) => m.PasswordRecoveryPageComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent)
  },
  {
    path: 'ingresos',
    loadComponent: () => import('./features/ingresos/ingresos-page.component').then((m) => m.IngresosPageComponent)
  },
  {
    path: 'gastos',
    loadComponent: () => import('./features/gastos/gastos-page.component').then((m) => m.GastosPageComponent)
  },
  {
    path: 'deudas',
    loadComponent: () => import('./features/deudas/deudas-page.component').then((m) => m.DeudasPageComponent)
  },
  {
    path: 'ahorros',
    loadComponent: () => import('./features/ahorros/ahorros-page.component').then((m) => m.AhorrosPageComponent)
  },
  {
    path: 'presupuesto',
    loadComponent: () => import('./features/presupuesto/presupuesto-page.component').then((m) => m.PresupuestoPageComponent)
  },
  {
    path: 'portafolio',
    loadComponent: () => import('./features/portafolio/portafolio-page.component').then((m) => m.PortafolioPageComponent)
  },
  {
    path: 'mercado',
    loadComponent: () => import('./features/mercado/mercado-page.component').then((m) => m.MercadoPageComponent)
  },
  {
    path: 'alertas',
    loadComponent: () => import('./features/alertas/alertas-page.component').then((m) => m.AlertasPageComponent)
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./features/configuracion/configuracion-page.component').then((m) => m.ConfiguracionPageComponent)
  },
  { path: '**', redirectTo: '' }
];

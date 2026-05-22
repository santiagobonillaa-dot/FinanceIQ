import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { SectionPillComponent } from '../../shared/atoms/section-pill/section-pill.component';
import { AuthService, LoginRequest } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule, SectionPillComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-surface-200 via-surface-100 to-surface-200 text-white flex relative">
      <div
        *ngIf="showResetToast"
        class="fixed top-6 right-6 z-50 bg-white/10 border border-brand-secondary/40 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-xl shadow-brand-secondary/20 animate-fade-in"
      >
        <div class="w-10 h-10 rounded-2xl bg-brand-secondary/20 flex items-center justify-center">
          <lucide-icon name="check-circle-2" class="w-5 h-5 text-brand-secondary"></lucide-icon>
        </div>
        <div>
          <p class="font-semibold">Contraseña restablecida</p>
          <p class="text-xs text-white/70">Puedes ingresar con tu nueva clave.</p>
        </div>
      </div>
      <section class="hidden lg:flex flex-col justify-between bg-white/5 border-r border-white/10 w-[45%] p-14">
        <div>
          <app-section-pill label="FinanceIQ" icon="activity"></app-section-pill>
          <h1 class="text-4xl font-bold leading-tight mt-8 mb-4">
            Plataforma de gestión financiera con estándares empresariales
          </h1>
          <p class="text-lg text-white/70">
            Conecta tus cuentas, centraliza portafolios y ejecuta decisiones basadas en datos en una sola vista segura.
          </p>
        </div>
        <div class="space-y-6">
          <div class="glass-panel p-6 rounded-3xl border border-white/10">
            <p class="text-sm text-white/60">Clientes profesionales registrados</p>
            <p class="text-4xl font-semibold mt-2">+120</p>
            <p class="text-xs text-brand-secondary mt-2 flex items-center gap-2">
              <lucide-icon name="trending-up" class="w-4 h-4"></lucide-icon>
              Crecimiento 18% QoQ
            </p>
          </div>
          <ul class="space-y-4 text-sm text-white/70">
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-brand-secondary"></span>
              Protección Zero-Trust y encriptación end-to-end
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-brand-secondary"></span>
              Análisis predictivo de liquidez y alertas en tiempo real
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-brand-secondary"></span>
              Soporte multidivisa (COP / USD) y multi-asset
            </li>
          </ul>
        </div>
      </section>

      <section class="flex-1 flex items-center justify-center px-6 py-12">
        <div class="w-full max-w-md">
          <div class="mb-10">
            <app-section-pill label="Ingreso seguro" tone="secondary" icon="shield"></app-section-pill>
            <h2 class="text-3xl font-semibold mt-6">Inicia sesión en tu Command Center</h2>
            <p class="text-white/60 mt-3">Autentícate con tus credenciales corporativas para acceder al panel.</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="handleSubmit()" class="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
            <div>
              <label class="text-sm text-white/60 block mb-2" for="email">Correo corporativo</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <lucide-icon name="mail" class="w-4 h-4"></lucide-icon>
                </span>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                  placeholder="tu@empresa.com"
                />
              </div>
              <p *ngIf="email.invalid && email.touched" class="text-xs text-red-400 mt-2">Ingresa un correo válido.</p>
            </div>

            <div>
              <label class="text-sm text-white/60 block mb-2" for="password">Contraseña</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <lucide-icon name="lock" class="w-4 h-4"></lucide-icon>
                </span>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                  placeholder="********"
                />
              </div>
              <p *ngIf="password.invalid && password.touched" class="text-xs text-red-400 mt-2">
                La contraseña debe tener al menos 8 caracteres.
              </p>
            </div>

            <!-- Mensaje de error -->
            <div *ngIf="errorMessage" class="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
              <p class="text-red-400 text-sm">{{ errorMessage }}</p>
            </div>

            <div class="flex items-center justify-between text-sm text-white/70">
              <label class="flex items-center gap-2">
                <input type="checkbox" formControlName="remember" class="accent-brand-primary" />
                Mantener sesión
              </label>
              <button type="button" class="text-brand-secondary hover:text-brand-primary transition" (click)="goToRecovery()">
                Olvidé mi contraseña
              </button>
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary/80 transition font-semibold shadow-lg shadow-brand-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ng-container>
                <span *ngIf="!isLoading">Acceder</span>
                <span *ngIf="isLoading" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accediendo...
                </span>
              </ng-container>
            </button>

            <p class="text-xs text-white/60 text-center">
              ¿No tienes acceso aún? <a class="text-brand-secondary" routerLink="/register">Solicitar registro</a>
            </p>
          </form>

          <div class="text-center text-xs text-white/40 mt-8">
            © 2026 FinanceIQ · Cumplimos estándares SOC2 & ISO 27001
          </div>
        </div>
      </section>
    </div>
  `,
})
export class LoginPageComponent {
  readonly loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder, 
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [true]
    });

    this.checkToastState();
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  handleSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = {
      email: this.email.value,
      password: this.password.value
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/dashboard']);
        } else {
          // Mensaje específico del backend
          this.errorMessage = response.message || 'Error en el login';
        }
        this.isLoading = false;
      },
      error: (error) => {
        // Intentar obtener el mensaje de error específico
        let errorMessage = 'Error de conexión con el servidor';
        
        if (error.status === 400) {
          errorMessage = 'Por favor, verifica que todos los campos estén completos';
        } else if (error.status === 401) {
          errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña';
        } else if (error.status === 429) {
          errorMessage = 'Demasiados intentos. Por favor, espera unos minutos';
        } else if (error.error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.errorMessage = errorMessage;
        this.isLoading = false;
        console.error('Login error:', error);
      }
    });
  }

  goToRecovery(): void {
    this.router.navigate(['/recovery']);
  }

  showResetToast = false;

  private checkToastState(): void {
    const navToast = this.router.getCurrentNavigation()?.extras?.state?.['toast'];
    const historyToast = typeof window !== 'undefined' ? window.history.state?.toast : undefined;
    const toast = navToast ?? historyToast;

    if (toast === 'password-reset') {
      this.showResetToast = true;
      if (typeof window !== 'undefined') {
        window.history.replaceState({ ...window.history.state, toast: null }, '');
      }
      setTimeout(() => (this.showResetToast = false), 3000);
    }
  }
}

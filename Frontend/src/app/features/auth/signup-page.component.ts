import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { SectionPillComponent } from '../../shared/atoms/section-pill/section-pill.component';
import { AuthService, RegisterRequest } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule, SectionPillComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-surface-200 via-surface-100 to-surface-200 text-white flex relative">
      <section class="hidden lg:flex flex-col justify-between bg-white/5 border-r border-white/10 w-[45%] p-14">
        <div>
          <app-section-pill label="Registro" icon="user-plus"></app-section-pill>
          <h1 class="text-4xl font-bold leading-tight mt-8 mb-4">
            Únete a FinanceIQ
          </h1>
          <p class="text-lg text-white/70">
            Crea tu cuenta y comienza a gestionar tus finanzas con inteligencia artificial y análisis avanzado.
          </p>
        </div>
        <div class="space-y-6">
          <div class="glass-panel p-6 rounded-3xl border border-white/10">
            <p class="text-sm text-white/60">Usuarios registrados</p>
            <p class="text-4xl font-semibold mt-2">+500</p>
            <p class="text-xs text-brand-secondary mt-2 flex items-center gap-2">
              <lucide-icon name="trending-up" class="w-4 h-4"></lucide-icon>
              Crecimiento 25% mensual
            </p>
          </div>
          <ul class="space-y-4 text-sm text-white/70">
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-brand-secondary"></span>
              Registro gratuito y sin compromisos
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-brand-secondary"></span>
              Acceso a todas las herramientas financieras
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-brand-secondary"></span>
              Soporte 24/7 y comunidad activa
            </li>
          </ul>
        </div>
      </section>

      <section class="flex-1 flex items-center justify-center px-6 py-12">
        <div class="w-full max-w-md">
          <div class="mb-10">
            <app-section-pill label="Crear cuenta" tone="secondary" icon="user-plus"></app-section-pill>
            <h2 class="text-3xl font-semibold mt-6">Regístrate en FinanceIQ</h2>
            <p class="text-white/60 mt-3">Crea tu cuenta para acceder al dashboard financiero.</p>
          </div>

          <form [formGroup]="signupForm" (ngSubmit)="handleSubmit()" class="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
            <!-- Nombre -->
            <div>
              <label class="text-sm text-white/60 block mb-2" for="name">Nombre</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <lucide-icon name="user" class="w-4 h-4"></lucide-icon>
                </span>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                  placeholder="Tu nombre"
                />
              </div>
              <p *ngIf="name.invalid && name.touched" class="text-xs text-red-400 mt-2">El nombre es requerido.</p>
            </div>

            <!-- Apellido -->
            <div>
              <label class="text-sm text-white/60 block mb-2" for="lastName">Apellido</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <lucide-icon name="user" class="w-4 h-4"></lucide-icon>
                </span>
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                  placeholder="Tu apellido"
                />
              </div>
              <p *ngIf="lastName.invalid && lastName.touched" class="text-xs text-red-400 mt-2">El apellido es requerido.</p>
            </div>

            <!-- Email -->
            <div>
              <label class="text-sm text-white/60 block mb-2" for="email">Correo electrónico</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <lucide-icon name="mail" class="w-4 h-4"></lucide-icon>
                </span>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                  placeholder="tu@correo.com"
                />
              </div>
              <p *ngIf="email.invalid && email.touched" class="text-xs text-red-400 mt-2">Ingresa un correo válido.</p>
            </div>

            <!-- Contraseña -->
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
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <p *ngIf="password.invalid && password.touched" class="text-xs text-red-400 mt-2">
                La contraseña debe tener al menos 8 caracteres.
              </p>
            </div>

            <!-- Confirmar Contraseña -->
            <div>
              <label class="text-sm text-white/60 block mb-2" for="confirmPassword">Confirmar contraseña</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <lucide-icon name="lock" class="w-4 h-4"></lucide-icon>
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                  placeholder="Repite tu contraseña"
                />
              </div>
              <p *ngIf="confirmPassword.invalid && confirmPassword.touched" class="text-xs text-red-400 mt-2">
                Las contraseñas no coinciden.
              </p>
            </div>

            <!-- Mensaje de error -->
            <div *ngIf="errorMessage" class="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
              <p class="text-red-400 text-sm">{{ errorMessage }}</p>
            </div>

            <!-- Términos y condiciones -->
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                formControlName="terms"
                class="mt-1 accent-brand-primary"
              />
              <label for="terms" class="text-sm text-white/60">
                Acepto los <a href="#" class="text-brand-secondary hover:text-brand-primary">términos y condiciones</a> 
                y la <a href="#" class="text-brand-secondary hover:text-brand-primary">política de privacidad</a>
              </label>
            </div>
            <p *ngIf="terms.invalid && terms.touched" class="text-xs text-red-400 mt-2">
              Debes aceptar los términos y condiciones.
            </p>

            <button
              type="submit"
              [disabled]="isLoading || signupForm.invalid"
              class="w-full py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary/80 transition font-semibold shadow-lg shadow-brand-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ng-container>
                <span *ngIf="!isLoading">Crear cuenta</span>
                <span *ngIf="isLoading" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                </span>
              </ng-container>
            </button>

            <p class="text-xs text-white/60 text-center">
              ¿Ya tienes una cuenta? <a class="text-brand-secondary" routerLink="/login">Inicia sesión</a>
            </p>
          </form>

          <div class="text-center text-xs text-white/40 mt-8">
            © 2026 FinanceIQ · Registro seguro y protegido
          </div>
        </div>
      </section>
    </div>
  `,
})
export class SignupPageComponent {
  readonly signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder, 
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  get name() {
    return this.signupForm.get('name')!;
  }

  get lastName() {
    return this.signupForm.get('lastName')!;
  }

  get email() {
    return this.signupForm.get('email')!;
  }

  get password() {
    return this.signupForm.get('password')!;
  }

  get confirmPassword() {
    return this.signupForm.get('confirmPassword')!;
  }

  get terms() {
    return this.signupForm.get('terms')!;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  handleSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const userData: RegisterRequest = {
      name: this.name.value,
      lastName: this.lastName.value,
      email: this.email.value,
      password: this.password.value
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Error en el registro';
        }
        this.isLoading = false;
      },
      error: (error) => {
        let errorMessage = 'Error de conexión con el servidor';
        
        if (error.status === 400) {
          errorMessage = 'Por favor, verifica que todos los campos estén completos';
        } else if (error.status === 409) {
          errorMessage = 'El correo ya está registrado. Intenta con otro o inicia sesión';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.errorMessage = errorMessage;
        this.isLoading = false;
        console.error('Registration error:', error);
      }
    });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { SectionPillComponent } from '../../shared/atoms/section-pill/section-pill.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-password-recovery-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule, SectionPillComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-surface-100 via-surface-200 to-surface-100 text-white flex">
      <section class="flex-1 flex items-center justify-center px-6 py-10">
        <div class="w-full max-w-md">
          <app-section-pill label="Soporte FinanceIQ" icon="life-buoy" tone="primary"></app-section-pill>
          <h1 class="text-3xl font-semibold mt-6">Recupera tu acceso</h1>
          <p class="text-white/70 text-sm mt-3">
            Ingresa el correo corporativo asociado a tu cuenta. Te enviaremos un enlace seguro para restablecer tu contraseña.
          </p>

          <form [formGroup]="recoveryForm" (ngSubmit)="handleSubmit()" class="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 mt-10">
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
                  placeholder="tu@empresa.com"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
              <p *ngIf="email.invalid && email.touched" class="text-xs text-red-400 mt-2">Ingresa un correo válido.</p>
            </div>

            <div>
              <label class="text-sm text-white/60 block mb-2" for="code">Código de verificación</label>
              <div class="flex gap-3">
                <input
                  id="code"
                  type="text"
                  formControlName="code"
                  maxlength="6"
                  placeholder="000000"
                  class="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-center tracking-[0.4em] text-lg focus:outline-none focus:border-brand-primary"
                />
                <button type="button" class="px-4 rounded-2xl border border-white/10 text-sm text-white/70" (click)="requestCode()">
                  Reenviar
                </button>
              </div>
              <p *ngIf="code.invalid && code.touched" class="text-xs text-red-400 mt-2">Ingresa un código de 6 dígitos.</p>
            </div>

            <!-- Nueva Contraseña -->
            <div *ngIf="codeRequested">
              <label class="text-sm text-white/60 block mb-2" for="newPassword">Nueva contraseña</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <lucide-icon name="lock" class="w-4 h-4"></lucide-icon>
                </span>
                <input
                  id="newPassword"
                  type="password"
                  formControlName="newPassword"
                  class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <p *ngIf="newPassword.invalid && newPassword.touched" class="text-xs text-red-400 mt-2">
                La contraseña debe tener al menos 8 caracteres.
              </p>
            </div>

            <!-- Confirmar Contraseña -->
            <div *ngIf="codeRequested">
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
                  placeholder="Repite tu nueva contraseña"
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

            <!-- Mensaje de éxito -->
            <div *ngIf="successMessage" class="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
              <p class="text-green-400 text-sm">{{ successMessage }}</p>
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary/80 transition font-semibold shadow-lg shadow-brand-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ng-container>
                <span *ngIf="!isLoading && !codeRequested">Solicitar código</span>
                <span *ngIf="!isLoading && codeRequested">Verificar código</span>
                <span *ngIf="isLoading" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span *ngIf="!codeRequested">Enviando código...</span>
                  <span *ngIf="codeRequested">Verificando...</span>
                </span>
              </ng-container>
            </button>

            <div class="text-xs text-white/60 text-center">
              ¿Recordaste tu contraseña? <a routerLink="/login" class="text-brand-primary">Volver a iniciar sesión</a>
            </div>
          </form>

          <div class="mt-8 text-xs text-white/50 text-center">
            Centro de soporte 24/7 · Cumplimiento SOC2
          </div>
        </div>
      </section>

      <section class="hidden lg:flex w-[45%] flex-col justify-between border-l border-white/10 bg-white/5 p-12">
        <div>
          <h2 class="text-xl font-semibold mb-4">Protocolo de recuperación</h2>
          <ol class="space-y-4 text-sm text-white/70 list-decimal list-inside">
            <li>Validamos tu identidad con MFA y biometría.</li>
            <li>Enviamos un enlace cifrado con expiración de 15 min.</li>
            <li>Te guiamos en el reseteo de credenciales y auditoría.</li>
          </ol>
        </div>
        <div class="glass-panel rounded-3xl border border-white/10 p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
              <lucide-icon name="shield" class="w-5 h-5 text-brand-primary"></lucide-icon>
            </div>
            <div>
              <p class="text-sm text-white/60">Nivel de seguridad</p>
              <p class="text-2xl font-semibold">Enterprise</p>
            </div>
          </div>
          <p class="text-sm text-white/60">
            Auditamos cada solicitud de recuperación y notificamos a los socios de confianza para mantener trazabilidad.
          </p>
          <div class="flex items-center justify-between text-xs text-white/40">
            <span>Último incidente: N/A</span>
            <span>Tiempo de respuesta: 4m</span>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class PasswordRecoveryPageComponent {
  readonly recoveryForm: FormGroup;
  codeRequested = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly fb: FormBuilder, 
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  get email() {
    return this.recoveryForm.get('email')!;
  }

  get code() {
    return this.recoveryForm.get('code')!;
  }

  get newPassword() {
    return this.recoveryForm.get('newPassword')!;
  }

  get confirmPassword() {
    return this.recoveryForm.get('confirmPassword')!;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  handleSubmit(): void {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    if (!this.codeRequested) {
      this.requestCode();
      return;
    }

    // Verificar código y restablecer contraseña
    this.verifyCodeAndReset();
  }

  requestCode(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simular envío de código (en producción, esto llamaría al backend)
    setTimeout(() => {
      this.codeRequested = true;
      this.successMessage = `Código enviado a ${this.email.value}. El código de prueba es: 123456`;
      this.isLoading = false;
    }, 1000);
  }

  private verifyCodeAndReset(): void {
    if (this.code.invalid || this.newPassword.invalid || this.confirmPassword.invalid) {
      this.code.markAsTouched();
      this.newPassword.markAsTouched();
      this.confirmPassword.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.email.value;
    const code = this.code.value;
    const newPassword = this.newPassword.value;

    // Simular verificación (en producción, esto llamaría al backend)
    setTimeout(() => {
      if (code === '123456') {
        this.successMessage = 'Contraseña restablecida correctamente. Redirigiendo al login...';
        setTimeout(() => {
          this.router.navigate(['/login'], { state: { toast: 'password-reset' } });
        }, 1500);
      } else {
        this.errorMessage = 'Código incorrecto. Intenta de nuevo.';
      }
      this.isLoading = false;
    }, 1000);
  }
}

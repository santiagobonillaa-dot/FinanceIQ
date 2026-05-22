import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { SectionPillComponent } from '../../shared/atoms/section-pill/section-pill.component';
import { AuthService, RegisterRequest } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule, SectionPillComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-surface-200 via-surface-100 to-surface-200 text-white flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-6xl grid lg:grid-cols-2 rounded-[32px] border border-white/10 bg-white/5 shadow-2xl shadow-black/20 overflow-hidden">
        <section class="p-8 md:p-14 flex flex-col justify-center gap-10">
          <div>
            <div class="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl w-fit">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <lucide-icon name="activity" class="w-5 h-5"></lucide-icon>
              </div>
              <span class="text-lg font-semibold tracking-wide">FinanceIQ</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-bold leading-tight mt-6">
              Solicita acceso al Command Center Financiero
            </h1>
            <p class="text-white/70 text-base md:text-lg mt-4">
              Registro exclusivo para equipos financieros, consultores y académicos con necesidad de monitoreo patrimonial avanzado.
            </p>
          </div>

          <div class="glass-panel rounded-3xl border border-white/10 p-8 space-y-6">
            <div class="flex items-center justify-between pb-6 border-b border-white/10">
              <div>
                <p class="text-sm text-white/60">Tiempo promedio de aprobación</p>
                <p class="text-3xl font-semibold">12 horas</p>
              </div>
              <div class="text-xs text-right text-white/60">
                <p>SLA prioritario</p>
                <p class="text-brand-secondary font-semibold">24/7</p>
              </div>
            </div>
            <div class="grid sm:grid-cols-3 gap-4 text-sm text-white/70">
              <div class="space-y-2">
                <p class="text-xs uppercase tracking-widest text-white/40">Cartera promedio</p>
                <p class="text-lg font-semibold text-white">$2.5M</p>
              </div>
              <div class="space-y-2 border-l border-white/10 pl-4">
                <p class="text-xs uppercase tracking-widest text-white/40">Países</p>
                <p class="text-lg font-semibold text-white">+8</p>
              </div>
              <div class="space-y-2 border-l border-white/10 pl-4">
                <p class="text-xs uppercase tracking-widest text-white/40">Conectores</p>
                <p class="text-lg font-semibold text-white">42 APIs</p>
              </div>
            </div>
          </div>
        </section>

        <section class="bg-white/5 border-t border-l border-white/10 lg:border-t-0 p-6 md:p-12 flex items-center">
          <div class="w-full max-w-md mx-auto">
            <app-section-pill label="Registro" tone="secondary" icon="user-plus"></app-section-pill>
            <h2 class="text-2xl font-semibold mt-6">Completa la solicitud</h2>
            <p class="text-sm text-white/60 mt-2">En menos de 5 minutos podrás enviar la información inicial.</p>

            <form [formGroup]="registerForm" (ngSubmit)="submit()" class="space-y-5 mt-8">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm text-white/60 mb-2 block" for="name">Nombre</label>
                  <input
                    id="name"
                    formControlName="name"
                    class="input-field"
                    placeholder="Camila"
                  />
                </div>
                <div>
                  <label class="text-sm text-white/60 mb-2 block" for="lastname">Apellido</label>
                  <input
                    id="lastname"
                    formControlName="lastname"
                    class="input-field"
                    placeholder="García"
                  />
                </div>
              </div>

              <div>
                <label class="text-sm text-white/60 mb-2 block" for="email">Correo corporativo</label>
                <input id="email" type="email" formControlName="email" class="input-field" placeholder="tu@empresa.com" />
              </div>

              <div>
                <label class="text-sm text-white/60 mb-2 block" for="company">Empresa / Institución</label>
                <input id="company" formControlName="company" class="input-field" placeholder="Finanzas LATAM" />
              </div>

              <div>
                <label class="text-sm text-white/60 mb-2 block" for="country">País</label>
                <select id="country" formControlName="country" class="input-field">
                  <option value="">Selecciona</option>
                  <option value="CO">Colombia</option>
                  <option value="MX">México</option>
                  <option value="PE">Perú</option>
                  <option value="CL">Chile</option>
                  <option value="US">Estados Unidos</option>
                </select>
              </div>

              <div>
                <label class="text-sm text-white/60 mb-2 block" for="assets">Activos bajo gestión</label>
                <select id="assets" formControlName="assets" class="input-field">
                  <option value="">Selecciona</option>
                  <option value="lt1m">Hasta 1M USD</option>
                  <option value="1-5m">1M - 5M USD</option>
                  <option value="5-20m">5M - 20M USD</option>
                  <option value="gt20m">Más de 20M USD</option>
                </select>
              </div>

              <div>
                <label class="text-sm text-white/60 mb-2 block" for="message">Contexto del requerimiento</label>
                <textarea id="message" formControlName="message" class="input-field min-h-[110px]" placeholder="Comparte los objetivos del proyecto"></textarea>
              </div>

              <label class="flex items-start gap-3 text-xs text-white/70 cursor-pointer">
                <input type="checkbox" formControlName="terms" class="mt-1 accent-brand-primary w-4 h-4" />
                Acepto el proceso de debida diligencia y autorizo el contacto por parte del equipo FinanceIQ.
              </label>

              <button type="submit" class="w-full py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary/80 transition font-semibold">
                Enviar solicitud
              </button>
              <p class="text-xs text-center text-white/60">
                ¿Ya tienes acceso? <a routerLink="/login" class="text-brand-secondary">Inicia sesión</a>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .input-field {
        @apply w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary transition;
      }
      select.input-field {
        cursor: pointer;
        background-color: rgba(255, 255, 255, 0.08);
      }
      select.input-field:focus,
      select.input-field:hover {
        background-color: rgba(255, 255, 255, 0.14);
      }
      select.input-field option {
        color: #0f172a;
        background-color: #f8fafc;
      }
      select.input-field option:checked,
      select.input-field option:hover {
        background-color: rgba(99, 102, 241, 0.18);
        color: #0f172a;
      }
      @media (max-width: 1024px) {
        section:first-child {
          order: 2;
        }
        section:last-child {
          order: 1;
        }
      }
    `
  ]
})
export class RegisterPageComponent {
  readonly registerForm: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly router: Router) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      company: ['', Validators.required],
      country: ['', Validators.required],
      assets: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(20)]],
      terms: [false, Validators.requiredTrue]
    });
  }

  submit(): void {
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 600);
  }
}

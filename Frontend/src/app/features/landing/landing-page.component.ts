import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { SectionPillComponent } from '../../shared/atoms/section-pill/section-pill.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, SectionPillComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  barHeights = [60, 80, 45, 90, 70, 85, 55, 75];
  
  painPoints = [
    "Falta de visibilidad integral del estado financiero personal",
    "Dificultad para proyectar flujo de caja futuro con precisión",
    "Desconocimiento del rendimiento real de inversiones",
    "Ausencia de alertas proactivas sobre riesgos financieros"
  ];

  solutions = [
    "Dashboard consolidado con métricas clave en tiempo real",
    "Análisis predictivo basado en histórico de transacciones",
    "Sincronización con APIs de mercado para valoración actualizada",
    "Sistema inteligente de alertas y recomendaciones personalizadas"
  ];

  constructor(private router: Router) {}

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}

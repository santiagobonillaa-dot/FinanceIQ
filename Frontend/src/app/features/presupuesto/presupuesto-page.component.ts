import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../shared';

@Component({
  selector: 'app-presupuesto-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  templateUrl: './presupuesto-page.component.html',
  styleUrl: './presupuesto-page.component.scss'
})
export class PresupuestoPageComponent {
  selectedPeriod = 'daily';

  selectPeriod(period: string) {
    this.selectedPeriod = period;
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss'
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() changeLabel = '';
  @Input() icon?: string;
  @Input() trend: 'up' | 'down' | 'neutral' = 'neutral';

  getIconPath(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'wallet': 'dashboard1.svg',
      'credit-card': 'gastos1.svg',
      'line-chart': 'mercado1.svg',
      'alert-triangle': 'deudas1.svg'
    };
    return `icons/${iconMap[iconName] || 'dashboard1.svg'}`;
  }
}

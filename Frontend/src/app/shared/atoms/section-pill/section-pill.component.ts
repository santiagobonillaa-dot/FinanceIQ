import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-pill.component.html',
  styleUrl: './section-pill.component.scss'
})
export class SectionPillComponent {
  @Input() label = '';
  @Input() tone: 'primary' | 'secondary' = 'primary';

  get accentClass(): string {
    const base = 'section-pill';
    if (this.tone === 'secondary') {
      return `${base} section-pill--secondary`;
    }
    return `${base} section-pill--primary`;
  }
}

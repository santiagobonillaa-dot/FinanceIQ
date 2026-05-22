import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeudasPageLayoutComponent } from './deudas-page-layout.component';

@Component({
  selector: 'app-deudas-page',
  standalone: true,
  imports: [CommonModule, DeudasPageLayoutComponent],
  template: `<app-deudas-page-layout />`,
})
export class DeudasPageComponent {}

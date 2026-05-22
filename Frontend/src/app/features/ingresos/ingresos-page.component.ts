import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IngresosPageLayoutComponent } from './ingresos-page-layout.component';

@Component({
  selector: 'app-ingresos-page',
  standalone: true,
  imports: [CommonModule, IngresosPageLayoutComponent],
  template: `<app-ingresos-page-layout />`,
})
export class IngresosPageComponent {}

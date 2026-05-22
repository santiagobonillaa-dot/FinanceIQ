import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GastosPageLayoutComponent } from './gastos-page-layout.component';

@Component({
  selector: 'app-gastos-page',
  standalone: true,
  imports: [CommonModule, GastosPageLayoutComponent],
  template: `<app-gastos-page-layout />`,
})
export class GastosPageComponent {}

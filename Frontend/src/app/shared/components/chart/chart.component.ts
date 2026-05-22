import { Component, AfterViewInit, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { LineController } from 'chart.js';
import { DoughnutController } from 'chart.js';
import { BarController } from 'chart.js';

// Registrar los componentes de Chart.js necesarios
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  DoughnutController,
  BarController
);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements AfterViewInit {
  @Input() type!: 'line' | 'bar' | 'doughnut';
  @Input() data!: any;
  @Input() options?: any;

  private chart: Chart | null = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.initChart();
  }

  private initChart(): void {
    const canvas = this.el.nativeElement.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Establecer tamaños ANTES de crear el chart
    if (this.type === 'doughnut') {
      canvas.width = 400;
      canvas.height = 350;
      canvas.style.cssText = 'height: 350px !important; width: 400px !important; display: block; box-sizing: border-box; max-width: 100% !important;';
    } else if (this.type === 'bar') {
      canvas.width = 1600;
      canvas.height = 400;
      canvas.style.cssText = 'height: 400px !important; width: 1600px !important; display: block; box-sizing: border-box; max-width: 100% !important;';
    } else {
      canvas.width = 800;
      canvas.height = 400;
      canvas.style.cssText = 'height: 400px !important; width: 800px !important; display: block; box-sizing: border-box; max-width: 100% !important;';
    }

    const defaultOptions = this.getDefaultOptions();
    const mergedOptions = { 
      ...defaultOptions, 
      ...this.options,
      responsive: false,  // Forzar false
      maintainAspectRatio: false
    };

    this.chart = new Chart(ctx, {
      type: this.type,
      data: this.data,
      options: mergedOptions,
    });

    // Forzar nuevamente después de crear
    requestAnimationFrame(() => {
      if (this.type === 'doughnut') {
        canvas.width = 400;
        canvas.height = 350;
        canvas.style.cssText = 'height: 350px !important; width: 400px !important; display: block; box-sizing: border-box; max-width: 100% !important;';
      } else if (this.type === 'bar') {
        canvas.width = 1600;
        canvas.height = 400;
        canvas.style.cssText = 'height: 400px !important; width: 1600px !important; display: block; box-sizing: border-box; max-width: 100% !important;';
      } else {
        canvas.width = 800;
        canvas.height = 400;
        canvas.style.cssText = 'height: 400px !important; width: 800px !important; display: block; box-sizing: border-box; max-width: 100% !important;';
      }
      if (this.chart) {
        this.chart.options.responsive = false;
        this.chart.options.maintainAspectRatio = false;
        this.chart.resize();
      }
    });
  }

  // Método para actualizar los datos del gráfico dinámicamente
  updateData(newData: any): void {
    if (this.chart) {
      this.chart.data = newData;
      this.chart.update('active'); // Animación suave
    }
  }

  // Método para actualizar solo los valores (mantener estructura)
  updateValues(newValues: number[]): void {
    if (this.chart && this.chart.data.datasets[0]) {
      this.chart.data.datasets[0].data = newValues;
      this.chart.update('active');
    }
  }

  private getDefaultOptions(): any {
    const baseOptions = {
      responsive: false,  // Siempre false para mantener tamaños fijos
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        },
      },
    };

    if (this.type === 'line') {
      return {
        ...baseOptions,
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
            },
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              }
            },
          },
        },
        elements: {
          line: {
            tension: 0.4,
          },
        },
      };
    }

    if (this.type === 'doughnut') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#fff',
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: function(context: any) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  label += percentage + '%';
                }
                return label;
              },
            },
          },
        },
      };
    }

    return baseOptions;
  }
}

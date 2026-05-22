import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { IngresosFormComponent } from './ingresos-form.component';
import { IncomeService } from '../../core/services/income.service';
import { ConfirmationModalComponent, ConfirmationData } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-ingresos-page-layout',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, ChartComponent, IngresosFormComponent, ConfirmationModalComponent],
  templateUrl: './ingresos-page-layout.component.html',
  styleUrls: ['./ingresos-page-layout.component.scss']
})
export class IngresosPageLayoutComponent implements OnInit, AfterViewInit {
  showIncomeModal = false;
  editingIncome: any = null;
  incomes: any[] = [];
  loading = false;
  error: string | null = null;
  
  // Propiedades para las tarjetas de estadísticas
  totalMonthlyIncome = 0;
  recurrentIncome = 0;
  recurrentPercentage = 0;
  monthlyGrowth = 15.3;
  recurrentSources = 0;
  
  // Modal de confirmación
  showConfirmationModal = false;
  confirmationData: ConfirmationData | null = null;
  pendingAction: 'edit' | 'delete' | 'save' | 'close' | null = null;
  pendingIncome: any = null;
  
  // Referencia al componente de gráfico
  @ViewChild('trendChart') trendChart!: ChartComponent;
  
  // Datos para el gráfico de tendencia de ingresos
  incomeTrendData = {
    labels: ['Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo', 'Abril'],
    datasets: [
      {
        label: 'Ingresos',
        data: [10500, 11200, 10800, 12100, 11800, 12450],
        backgroundColor: 'rgba(74, 222, 128, 0.8)',
        borderColor: 'rgb(74, 222, 128)',
        borderWidth: 0,
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  };

  // Opciones para el gráfico de barras
  incomeTrendOptions = {
    responsive: true,
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
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '$' + context.parsed.y.toLocaleString();
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: function(value: any) {
            return '$' + (value / 1000) + 'k';
          },
        },
      },
    },
  };

  constructor(private incomeService: IncomeService) {}

  ngOnInit(): void {
    this.loadIncomes();
  }

  ngAfterViewInit(): void {
    // El gráfico está listo, actualizamos con los datos reales
    this.updateChartWithRealData();
  }

  loadIncomes(): void {
    this.loading = true;
    this.error = null;
    
    this.incomeService.getIncomes().subscribe({
      next: (response) => {
        // El endpoint de prueba devuelve { success: true, data: [...] }
        this.incomes = response.data || response;
        this.loading = false;
        console.log('Ingresos cargados:', this.incomes);
        
        // Calcular estadísticas para las tarjetas
        this.calculateStatistics();
        
        // Actualizar el gráfico con los datos reales
        this.updateChartWithRealData();
      },
      error: (err) => {
        this.error = 'Error al cargar los ingresos';
        this.loading = false;
        console.error('Error cargando ingresos:', err);
      },
    });
  }

  calculateStatistics(): void {
    // Calcular ingresos totales del mes
    this.totalMonthlyIncome = this.incomes.reduce((total, income) => {
      return total + this.convertToMonthly(income);
    }, 0);

    // Calcular ingresos recurrentes
    const recurrentIncomes = this.incomes.filter(income => 
      income.frequency === 'mensual' || income.frequency === 'quincenal'
    );
    
    this.recurrentIncome = recurrentIncomes.reduce((total, income) => {
      return total + this.convertToMonthly(income);
    }, 0);

    // Calcular porcentaje recurrente
    this.recurrentPercentage = this.totalMonthlyIncome > 0 
      ? (this.recurrentIncome / this.totalMonthlyIncome) * 100 
      : 0;

    // Contar fuentes recurrentes
    this.recurrentSources = recurrentIncomes.length;

    // Simular crecimiento mensual (en una app real esto vendría de datos históricos)
    this.monthlyGrowth = 15.3 + (Math.random() * 10 - 5); // Variación aleatoria
  }

  // Métodos para controlar el modal
  showAddIncomeModal(): void {
    this.showIncomeModal = true;
    this.editingIncome = null;
  }

  editIncome(income: any): void {
    this.pendingAction = 'edit';
    this.pendingIncome = income;
    
    this.confirmationData = {
      title: 'Editar Ingreso',
      message: `¿Estás seguro de que deseas editar este ingreso?`,
      type: 'edit',
      details: [
        { label: 'Nombre', value: income.name },
        { label: 'Monto', value: this.formatCurrency(income.amount, income.currency) },
        { label: 'Categoría', value: this.getCategoryLabel(income.category) },
        { label: 'Frecuencia', value: this.getFrequencyLabel(income.frequency) }
      ],
      confirmText: 'Editar',
      cancelText: 'Cancelar'
    };
    
    this.showConfirmationModal = true;
  }

  closeIncomeModal(): void {
    if (this.showIncomeModal) {
      const confirmClose = confirm(
        `¿Estás seguro de que deseas cerrar el formulario?\n\n` +
        `Los cambios no guardados se perderán.`
      );

      if (confirmClose) {
        this.showIncomeModal = false;
        this.editingIncome = null;
      }
    }
  }

  saveIncome(): void {
    const action = this.editingIncome ? 'actualizar' : 'agregar';
    const incomeName = this.editingIncome ? this.editingIncome.name : 'nuevo ingreso';
    
    const confirmSave = confirm(
      `¿Estás seguro de que deseas ${action} el ingreso "${incomeName}"?\n\n` +
      `Esta acción guardará los cambios en la base de datos.`
    );

    if (confirmSave) {
      // Aquí iría la lógica real de guardar
      this.closeIncomeModal();
      // Recargar ingresos después de guardar
      setTimeout(() => this.loadIncomes(), 500);
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        alert(`✅ Ingreso "${incomeName}" ${action === 'actualizar' ? 'actualizado' : 'agregado'} exitosamente.`);
      }, 600);
    }
  }

  deleteIncome(income: any): void {
    this.pendingAction = 'delete';
    this.pendingIncome = income;
    
    this.confirmationData = {
      title: 'Eliminar Ingreso',
      message: `⚠️ ¡ADVERTENCIA! Esta acción no se puede deshacer.`,
      type: 'delete',
      details: [
        { label: 'Nombre', value: income.name },
        { label: 'Monto', value: this.formatCurrency(income.amount, income.currency) },
        { label: 'Categoría', value: this.getCategoryLabel(income.category) },
        { label: 'Frecuencia', value: this.getFrequencyLabel(income.frequency) },
        { label: 'Fecha inicio', value: this.formatDate(income.startDate) }
      ],
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      requireTextConfirmation: true,
      textConfirmationValue: 'ELIMINAR'
    };
    
    this.showConfirmationModal = true;
  }

  // Métodos auxiliares para formateo
  formatCurrency(amount: number, currency: string = 'COP'): string {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getCategoryLabel(category: string): string {
    const categories: { [key: string]: string } = {
      'salary': 'Salario',
      'freelance': 'Freelance',
      'investment': 'Inversión',
      'business': 'Negocio',
      'rental': 'Alquiler',
      'other': 'Otro'
    };
    return categories[category] || category;
  }

  getFrequencyLabel(frequency: string): string {
    const frequencies: { [key: string]: string } = {
      'monthly': 'Mensual',
      'weekly': 'Semanal',
      'biweekly': 'Quincenal',
      'yearly': 'Anual',
      'one-time': 'Único',
      'quarterly': 'Trimestral'
    };
    return frequencies[frequency] || frequency;
  }

  convertToMonthly(income: any): number {
    const amount = income.amount || 0;
    const frequency = income.frequency || 'monthly';
    
    switch (frequency.toLowerCase()) {
      case 'monthly':
      case 'mensual':
        return amount;
      case 'weekly':
      case 'semanal':
        return amount * 4.33; // 52 semanas / 12 meses
      case 'biweekly':
      case 'quincenal':
        return amount * 2.17; // 24 quincenas / 12 meses
      case 'yearly':
      case 'anual':
        return amount / 12;
      case 'quarterly':
      case 'trimestral':
        return amount / 3;
      case 'one-time':
      case 'único':
        return amount; // Tratar como ingreso del mes actual
      default:
        return amount;
    }
  }

  getProgressBarWidth(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  getRecurrentPercentage(): number {
    const total = this.incomes.length;
    return total > 0 ? (this.recurrentSources / total) * 100 : 0;
  }

  // Métodos de cálculo para el resumen
  calculateTotalMonthly(): number {
    return this.incomes
      .filter(income => income.isActive)
      .reduce((total, income) => {
        if (income.frequency === 'monthly') {
          return total + income.amount;
        } else if (income.frequency === 'yearly') {
          return total + (income.amount / 12);
        } else if (income.frequency === 'weekly') {
          return total + (income.amount * 4.33); // 4.33 semanas promedio al mes
        } else if (income.frequency === 'biweekly') {
          return total + (income.amount * 2.17); // 2.17 quincenas promedio al mes
        } else if (income.frequency === 'quarterly') {
          return total + (income.amount / 3); // Trimestral a mensual
        } else {
          return total + income.amount; // one-time u otros
        }
      }, 0);
  }

  calculateAnnualProjection(): number {
    return this.calculateTotalMonthly() * 12;
  }

  getActiveIncomesCount(): number {
    return this.incomes.filter(income => income.isActive).length;
  }

  getInactiveIncomesCount(): number {
    return this.incomes.filter(income => !income.isActive).length;
  }

  // Métodos para manejar el modal de confirmación
  onConfirmationConfirm(textConfirmation?: string): void {
    switch (this.pendingAction) {
      case 'edit':
        if (this.pendingIncome) {
          this.editingIncome = this.pendingIncome;
          this.showIncomeModal = true;
        }
        break;
        
      case 'delete':
        if (this.pendingIncome && textConfirmation === 'ELIMINAR') {
          this.incomeService.deleteIncome(this.pendingIncome._id).subscribe({
            next: () => {
              console.log('Ingreso eliminado:', this.pendingIncome);
              this.showSuccessMessage(`Ingreso "${this.pendingIncome.name}" eliminado exitosamente.`);
              this.loadIncomes(); // Recargar la lista
              // Actualizar el gráfico después de eliminar
              setTimeout(() => this.updateChartWithRealData(), 100);
            },
            error: (err) => {
              console.error('Error eliminando ingreso:', err);
              this.showErrorMessage('Error al eliminar el ingreso. Por favor, intenta nuevamente.');
            }
          });
        } else {
          this.showErrorMessage('Confirmación incorrecta. La eliminación fue cancelada.');
        }
        break;
        
      case 'save':
        this.saveIncomeConfirmed();
        break;
        
      case 'close':
        this.closeIncomeModalConfirmed();
        break;
    }
    
    this.closeConfirmationModal();
  }

  onConfirmationCancel(): void {
    this.closeConfirmationModal();
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
    this.confirmationData = null;
    this.pendingAction = null;
    this.pendingIncome = null;
  }

  // Métodos auxiliares para mostrar mensajes
  showSuccessMessage(message: string): void {
    // Aquí podrías implementar un toast o notificación personalizada
    console.log('✅', message);
  }

  showErrorMessage(message: string): void {
    // Aquí podrías implementar un toast o notificación personalizada
    console.error('❌', message);
  }

  saveIncomeConfirmed(): void {
    const action = this.editingIncome ? 'actualizar' : 'agregar';
    const incomeName = this.editingIncome ? this.editingIncome.name : 'nuevo ingreso';
    
    this.closeIncomeModal();
    setTimeout(() => this.loadIncomes(), 500);
    
    setTimeout(() => {
      this.showSuccessMessage(`Ingreso "${incomeName}" ${action === 'actualizar' ? 'actualizado' : 'agregado'} exitosamente.`);
      // Actualizar el gráfico después de guardar
      setTimeout(() => this.updateChartWithRealData(), 100);
    }, 600);
  }

  closeIncomeModalConfirmed(): void {
    this.showIncomeModal = false;
    this.editingIncome = null;
  }

  // Método para actualizar el gráfico con datos reales de ingresos
  updateChartWithRealData(): void {
    if (!this.trendChart || this.incomes.length === 0) {
      return;
    }

    // Procesar los ingresos para generar datos de tendencia
    const trendData = this.processIncomesForTrend();
    
    // Actualizar el gráfico
    this.trendChart.updateData(trendData);
  }

  // Procesar los ingresos para generar datos de tendencia mensual
  private processIncomesForTrend(): any {
    // Agrupar ingresos por mes y calcular totales
    const monthlyData: { [key: string]: number } = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Generar los últimos 12 meses (desde junio del año pasado hasta el mes actual)
    const months: string[] = [];
    const monthNumbers: number[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthNum = date.getMonth();
      const year = date.getFullYear();
      const monthName = this.getMonthName(monthNum);
      
      months.push(monthName);
      monthNumbers.push(monthNum);
      
      const key = `${year}-${monthNum}`;
      monthlyData[key] = 0;
    }

    // Procesar cada ingreso
    this.incomes.forEach(income => {
      if (!income.isActive) return;
      
      const startDate = new Date(income.startDate);
      const monthKey = `${startDate.getFullYear()}-${startDate.getMonth()}`;
      
      if (monthlyData.hasOwnProperty(monthKey)) {
        let amount = income.amount;
        
        // Convertir a mensual según la frecuencia
        if (income.frequency === 'yearly') {
          amount = amount / 12;
        } else if (income.frequency === 'weekly') {
          amount = amount * 4.33; // 4.33 semanas promedio al mes
        } else if (income.frequency === 'biweekly') {
          amount = amount * 2.17; // 2.17 quincenas promedio al mes
        } else if (income.frequency === 'quarterly') {
          amount = amount / 3; // Trimestral a mensual
        }
        
        monthlyData[monthKey] += amount;
      }
    });

    // Generar datos para el gráfico
    const values = months.map((month, index) => {
      const monthNum = monthNumbers[index];
      const year = monthNum > currentMonth ? currentYear - 1 : currentYear;
      const key = `${year}-${monthNum}`;
      return monthlyData[key] || 0;
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'Ingresos',
          data: values, // Usar valores numéricos para el gráfico
          backgroundColor: 'rgba(74, 222, 128, 0.8)',
          borderColor: 'rgb(74, 222, 128)',
          borderWidth: 0,
          borderRadius: 8,
          barThickness: 25,
        }
      ]
    };
  }

  // Método auxiliar para obtener el nombre del mes en español
  private getMonthName(monthNum: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNum];
  }
}

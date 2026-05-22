import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { ExpenseService, Expense } from '../../services/expense.service';

interface ConfirmationData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-gastos-page-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, ChartComponent, ConfirmationModalComponent],
  templateUrl: './gastos-page-layout.component.html',
  styleUrl: './gastos-page-layout.component.scss'
})
export class GastosPageLayoutComponent implements OnInit {
  // Propiedades para las tarjetas de estadísticas
  totalMonthlyExpenses = 0;
  fixedExpenses = 0;
  fixedExpensesPercentage = 0;
  expenseGrowth = 0;
  dailyAverage = 287000;
  daysInMonth = 24;
  
  // Propiedades para el manejo de gastos
  expenses: Expense[] = [];
  loading = false;
  error: string | null = null;
  showExpenseModal = false;
  editingExpense: Expense | null = null;
  expenseForm: Partial<Expense> = {
    name: '',
    description: '',
    amount: 0,
    category: '',
    date: '',
    type: '',
    frequency: ''
  };
  
  // Modal de confirmación
  showConfirmationModal = false;
  confirmationData: ConfirmationData | null = null;
  pendingAction: 'edit' | 'delete' | 'save' | 'close' | null = null;
  pendingExpense: Expense | null = null;

  // Datos para el gráfico de tendencia de gastos
  gastosTrendData = {
    labels: this.generateLast12Months(),
    datasets: [
      {
        label: 'Gastos Mensuales',
        data: new Array(12).fill(0), // Inicializar con ceros para 12 meses
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 0,
        borderRadius: 8,
        barThickness: 30,
      },
    ],
  };

  // Opciones para el gráfico de barras
  gastosTrendOptions = {
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
          color: '#fff',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)'
        },
        ticks: {
          color: '#fff',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  // Datos para el gráfico de distribución de gastos
  gastosDistributionData = {
    labels: ['Vivienda', 'Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Otros'],
    datasets: [{
      data: [2500, 945, 165, 25.98, 180, 794.02],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(156, 163, 175, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  // Opciones para el gráfico de dona
  gastosDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
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
              label += '$' + context.parsed.toLocaleString();
            }
            return label;
          },
        },
      },
      datalabels: {
        display: false,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 16,
        },
        formatter: function(value: any, context: any) {
          const sum = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / sum) * 100).toFixed(1) + '%';
          return percentage;
        },
      },
    },
  };

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

  getProgressBarWidth(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  private normalizeExpensePayload(expense: Partial<Expense>): Partial<Expense> {
    const payload: Partial<Expense> = { ...expense };

    console.log('🔧 🔄 normalizeExpensePayload - Input:', expense);
    console.log('🔧 🔄 normalizeExpensePayload - payload.date original:', payload.date);

    // Formatear la fecha al formato esperado por el backend (YYYY-MM-DD)
    if (payload.date) {
      const parsedDate = new Date(payload.date);
      console.log('🔧 🔄 normalizeExpensePayload - parsedDate:', parsedDate);
      console.log('🔧 🔄 normalizeExpensePayload - parsedDate válido?:', !isNaN(parsedDate.getTime()));
      
      if (!isNaN(parsedDate.getTime())) {
        payload.date = parsedDate.toISOString().split('T')[0];
        console.log('🔧 🔄 normalizeExpensePayload - payload.date formateado:', payload.date);
      } else {
        console.warn('🔧 🔄 normalizeExpensePayload - Fecha inválida, eliminando date');
        delete payload.date;
      }
    }

    // El backend calcula startDate a partir de date, así que evitamos enviar valores inconsistentes
    delete (payload as any).startDate;
    delete (payload as any)._id;
    delete (payload as any).id;
    delete (payload as any).createdAt;
    delete (payload as any).updatedAt;

    console.log('🔧 🔄 normalizeExpensePayload - Output final:', payload);
    return payload;
  }

  private generateLast12Months(): string[] {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthYear = date.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'short' 
      }).replace('.', '').replace(' ', ' ');
      
      // Formatear para que coincida con el estilo existente
      const formattedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      months.push(formattedMonth);
    }
    
    return months;
  }

  getMinDate(): string {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 11);
    minDate.setDate(1);
    return minDate.toISOString().split('T')[0];
  }

  getMaxDate(): string {
    const maxDate = new Date();
    return maxDate.toISOString().split('T')[0];
  }

  constructor(private expenseService: ExpenseService, private cdr: ChangeDetectorRef) {
    // Inicializar valores calculados
    this.calculateStatistics();
    
    // Debug: Verificar si el servicio se inyectó correctamente
    console.log('🔧 Constructor de GastosPageLayoutComponent');
    console.log('🔧 ExpenseService inyectado:', !!this.expenseService);
    console.log('🔧 Método getExpenses existe:', typeof this.expenseService.getExpenses);
  }

  ngOnInit(): void {
    console.log('🔧 ngOnInit de GastosPageLayoutComponent');
    console.log('🔧 Iniciando carga de gastos...');
    this.loadExpenses();
  }

  // Métodos para controlar el modal
  showAddExpenseModal(): void {
    this.showExpenseModal = true;
    this.editingExpense = null;
    this.resetExpenseForm();
  }

  editExpense(expense: any): void {
    console.log('🔧 Editando gasto:', expense);
    
    // Abrir directamente el formulario de edición (temporal)
    this.editingExpense = expense;
    
    // Copiar todos los campos del gasto al formulario, incluyendo el _id de MongoDB
    this.expenseForm = { 
      ...expense,
      // Asegurar que el ID esté disponible para la actualización
      id: expense._id || expense.id,
      // Formatear la fecha correctamente para el input date
      date: (expense as any).startDate ? new Date((expense as any).startDate).toISOString().split('T')[0] : 
            expense.date ? new Date(expense.date).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0]
    };
    
    console.log('🔧 Formulario de edición:', this.expenseForm);
    this.showExpenseModal = true;
  }

  deleteExpense(expense: Expense): void {
    // Eliminar con confirmación simple usando el servicio real
    if (confirm(`¿Estás seguro de que deseas eliminar el gasto "${expense.name}"?\n\nMonto: $${this.formatCurrency(expense.amount)}\n\nEsta acción no se puede deshacer.`)) {
      console.log('Eliminando gasto:', expense);
      
      // Usar el servicio real para eliminar
      if (expense.id) {
        this.expenseService.deleteExpense(expense.id).subscribe({
          next: () => {
            // Recargar después de eliminar
            this.loadExpenses();
            
            // Mostrar mensaje de éxito
            setTimeout(() => {
              alert(`✅ Gasto "${expense.name}" eliminado exitosamente.`);
            }, 600);
          },
          error: (err) => {
            console.error('Error eliminando gasto:', err);
            alert(`❌ Error al eliminar el gasto "${expense.name}". Por favor, inténtalo de nuevo.`);
          }
        });
      }
    }
  }

  closeExpenseModal(event?: Event): void {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    
    // Cerrar directamente sin confirmación
    this.showExpenseModal = false;
    this.editingExpense = null;
    this.resetExpenseForm();
  }

  saveExpense(): void {
    const action = this.editingExpense ? 'actualizar' : 'agregar';
    const expenseName = this.editingExpense ? this.editingExpense.name : this.expenseForm.name || '';
    
    if (confirm(`¿Estás seguro de que deseas ${action} el gasto "${expenseName}"?\n\nEsta acción guardará los cambios en la base de datos.`)) {
      console.log('Guardando gasto:', this.expenseForm);
      
      if (this.editingExpense && (this.editingExpense.id || (this.editingExpense as any)._id)) {
        // Actualizar existente usando el servicio real
        const expenseId = (this.editingExpense as any)._id || this.editingExpense.id;
        console.log('🔧 Actualizando gasto con ID:', expenseId);
        console.log('🔧 Enviando actualización con ID:', expenseId, 'y datos:', this.expenseForm);
        console.log('🔧 📅 Fecha en el formulario ANTES de normalizar:', this.expenseForm.date);
        console.log('🔧 📅 Tipo de fecha en formulario:', typeof this.expenseForm.date);
        const normalizedExpense = this.normalizeExpensePayload(this.expenseForm);
        this.expenseService.updateExpense(expenseId, normalizedExpense).subscribe({
          next: (updatedExpense) => {
            console.log('🔧 ✅ Respuesta de actualización:', updatedExpense);
            console.log('🔧 ✅ Fecha en respuesta actualizada:', (updatedExpense as any).startDate);
            this.closeExpenseModal();
            console.log('🔧 🔄 Llamando a loadExpenses después de actualizar...');
            this.loadExpenses();
            
            setTimeout(() => {
              console.log('🔧 📊 Verificando gastos después de actualizar:', this.expenses.length);
              if (this.expenses.length > 0) {
                const updated = this.expenses.find(e => (e as any)._id === (this.editingExpense as any)._id);
                if (updated) {
                  console.log('🔧 📊 Gasto actualizado encontrado:', {
                    name: updated.name,
                    startDate: (updated as any).startDate,
                    date: updated.date
                  });
                }
              }
              alert(`✅ Gasto "${updatedExpense.name}" actualizado exitosamente.`);
            }, 1000);
          },
          error: (err) => {
            console.error('🔧 ❌ Error actualizando gasto:', err);
            console.error('🔧 ❌ Detalles del error:', err.status, err.error);
            alert(`❌ Error al actualizar el gasto "${expenseName}". Por favor, inténtalo de nuevo.`);
          }
        });
      } else {
        // Crear nuevo usando el servicio real
        const normalizedExpense = this.normalizeExpensePayload(this.expenseForm);
        this.expenseService.createExpense(normalizedExpense as Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
          next: (newExpense) => {
            console.log('🔧 ✅ Gasto creado exitosamente en frontend:', newExpense);
            console.log('🔧 🔄 Llamando a loadExpenses() para actualizar la tabla...');
            this.closeExpenseModal();
            
            // Forzar actualización inmediata
            this.loadExpenses();
            
            // Forzar actualización de UI inmediata
            setTimeout(() => {
              this.cdr.detectChanges();
              console.log('🔧 📊 Estado final de expenses.length:', this.expenses.length);
              console.log('🔧 📋 Gastos en la tabla:', this.expenses);
              alert(`✅ Gasto "${newExpense.name}" agregado exitosamente.`);
            }, 600);
          },
          error: (err) => {
            console.error('Error creando gasto:', err);
            alert(`❌ Error al agregar el gasto "${expenseName}". Por favor, inténtalo de nuevo.`);
          }
        });
      }
    }
  }

  // Métodos del modal de confirmación
  handleConfirmation(confirmed: boolean): void {
    if (!confirmed) {
      this.closeConfirmationModal();
      return;
    }

    switch (this.pendingAction) {
      case 'edit':
        this.openEditForm();
        break;
      case 'delete':
        this.confirmDelete();
        break;
      case 'save':
        this.confirmSave();
        break;
      case 'close':
        this.confirmClose();
        break;
    }
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
    this.confirmationData = null;
    this.pendingAction = null;
    this.pendingExpense = null;
  }

  // Métodos de ejecución (obsoletos, se usan los métodos del servicio real)
  openEditForm(): void {
    if (this.pendingExpense) {
      this.editingExpense = this.pendingExpense;
      this.expenseForm = { ...this.pendingExpense };
      this.showExpenseModal = true;
    }
    this.closeConfirmationModal();
  }

  confirmDelete(): void {
    if (this.pendingExpense) {
      console.log('Eliminando gasto (método obsoleto):', this.pendingExpense);
      
      // Usar el método real de eliminación
      this.deleteExpense(this.pendingExpense);
    }
    this.closeConfirmationModal();
  }

  confirmSave(): void {
    console.log('Guardando gasto (método obsoleto):', this.expenseForm);
    
    // Usar el método real de guardado
    this.saveExpense();
  }

  confirmClose(): void {
    this.showExpenseModal = false;
    this.editingExpense = null;
    this.resetExpenseForm();
    this.closeConfirmationModal();
  }

  // Métodos auxiliares
  resetExpenseForm(): void {
    this.expenseForm = {
      name: '',
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
      type: '',
      frequency: ''
    };
  }

  loadExpenses(): void {
    console.log('🔧 loadExpenses() iniciado');
    console.log('🔧 Estado inicial - loading:', this.loading, 'error:', this.error, 'expenses.length:', this.expenses.length);
    
    this.loading = true;
    this.error = null;
    
    console.log('🔧 Llamando a expenseService.getExpenses()');
    
    // Usar el servicio real de gastos
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
            console.log('🔧 ✅ Respuesta recibida del servicio:', expenses);
            console.log('🔧 ✅ Tipo de datos recibidos:', typeof expenses);
            console.log('🔧 ✅ Es array?:', Array.isArray(expenses));
            console.log('🔧 ✅ Longitud del array:', expenses?.length);
            
            // FORZAR ACTUALIZACIÓN
            this.expenses = [...(expenses || [])]; // Crear nuevo array para forzar detección de cambios
            this.loading = false;
            
            // Log detallado de cada gasto
            this.expenses.forEach((expense, index) => {
              console.log(`🔧 📊 Gasto ${index}:`, {
                name: expense.name,
                amount: expense.amount,
                startDate: (expense as any).startDate,
                date: expense.date,
                createdAt: expense.createdAt
              });
            });
            
            this.calculateStatistics();
            
            console.log('🔧 ✅ Gastos cargados - expenses.length:', this.expenses.length);
            console.log('🔧 ✅ Primer gasto:', this.expenses[0]);
            console.log('🔧 ✅ Referencia del array expenses:', this.expenses);
            
            // Forzar detección de cambios en Angular
            setTimeout(() => {
              console.log('🔧 🔄 Forzando change detection con cdr...');
              this.cdr.detectChanges(); // Forzar actualización de la UI
              this.expenses = [...this.expenses]; // Otra forma de forzar actualización
            }, 100);
          },
      error: (err) => {
        console.log('🔧 ❌ Error del servicio:', err);
        this.error = 'Error al cargar los gastos';
        this.loading = false;
        console.error('Error cargando gastos:', err);
      }
    });
  }

  calculateStatistics(): void {
    console.log('🔧 📊 Calculando estadísticas...');
    
    // Obtener mes y año actual
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calcular gastos del mes actual
    this.totalMonthlyExpenses = this.expenses
      .filter(expense => {
        const expenseDate = new Date((expense as any).startDate || expense.createdAt || expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + expense.amount, 0);
    
    // Calcular gastos fijos del mes actual
    this.fixedExpenses = this.expenses
      .filter(expense => {
        const expenseDate = new Date((expense as any).startDate || expense.createdAt || expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear && 
               expense.type === 'fixed';
      })
      .reduce((total, expense) => total + expense.amount, 0);
    
    // Calcular días en el mes actual
    this.daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Calcular promedio diario
    this.dailyAverage = this.daysInMonth > 0 ? this.totalMonthlyExpenses / this.daysInMonth : 0;
    
    // Calcular porcentaje de gastos fijos
    this.fixedExpensesPercentage = this.totalMonthlyExpenses > 0 
      ? (this.fixedExpenses / this.totalMonthlyExpenses) * 100 
      : 0;
    
    // Calcular crecimiento vs mes anterior (simplificado)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthExpenses = this.expenses
      .filter(expense => {
        const expenseDate = new Date((expense as any).startDate || expense.createdAt || expense.date);
        return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
      })
      .reduce((total, expense) => total + expense.amount, 0);
    
    this.expenseGrowth = lastMonthExpenses > 0 
      ? ((this.totalMonthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0;
    
    console.log('🔧 📊 Resultados calculados:');
    console.log('🔧 📊 totalMonthlyExpenses:', this.totalMonthlyExpenses);
    console.log('🔧 📊 fixedExpenses:', this.fixedExpenses);
    console.log('🔧 📊 dailyAverage:', this.dailyAverage);
    console.log('🔧 📊 fixedExpensesPercentage:', this.fixedExpensesPercentage);
    console.log('🔧 📊 expenseGrowth:', this.expenseGrowth);
    
    // Actualizar datos de tendencia basados en los gastos reales
    this.calculateTrendData();
  }

  calculateTrendData(): void {
    // Agrupar gastos por mes y calcular totales
    const monthlyData: { [key: string]: number } = {};
    
    // Generar dinámicamente los últimos 12 meses
    const months = this.generateLast12Months();
    months.forEach(month => {
      monthlyData[month] = 0;
    });
    
    // Sumar gastos por mes
    console.log('🔧 📈 Procesando', this.expenses.length, 'gastos para tendencia');
    
    this.expenses.forEach((expense, index) => {
      // Usar startDate o createdAt como fecha de referencia
      const dateField = (expense as any).startDate || expense.createdAt || expense.date;
      console.log(`🔧 📈 Gasto ${index}:`, {
        name: expense.name,
        amount: expense.amount,
        dateField: dateField,
        startDate: (expense as any).startDate,
        createdAt: expense.createdAt,
        date: expense.date
      });
      
      if (dateField) {
        const date = new Date(dateField);
        const monthYear = date.toLocaleDateString('es-CO', { 
          year: 'numeric', 
          month: 'short' 
        }).replace('.', '').replace(' ', ' ');
        
        // Formatear para que coincida con los labels existentes
        const formattedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
        
        console.log(`🔧 📈 Gasto ${index} - Fecha parseada:`, date, '- Mes formateado:', formattedMonth);
        
        if (monthlyData[formattedMonth] !== undefined) {
          monthlyData[formattedMonth] += expense.amount;
          console.log(`🔧 📈 Gasto ${index} - Agregando ${expense.amount} a ${formattedMonth}, total ahora: ${monthlyData[formattedMonth]}`);
        } else {
          console.log(`🔧 📈 Gasto ${index} - Mes ${formattedMonth} no está en la lista de meses definidos`);
        }
      } else {
        console.log(`🔧 📈 Gasto ${index} - Sin fecha válida`);
      }
    });
    
    // Convertir a array para el gráfico
    const trendValues = months.map(month => monthlyData[month] || 0);
    
    // Actualizar los datos del gráfico
    this.gastosTrendData.datasets[0].data = trendValues;
    
    console.log('🔧 📈 Datos de tendencia actualizados:', trendValues);
  }

  // Métodos auxiliares para formateo
  getCategoryLabel(category: string): string {
    const categories: { [key: string]: string } = {
      'housing': 'Vivienda',
      'food': 'Alimentación',
      'transport': 'Transporte',
      'utilities': 'Servicios',
      'entertainment': 'Entretenimiento',
      'health': 'Salud',
      'education': 'Educación',
      'other': 'Otros'
    };
    return categories[category] || category;
  }

  getExpenseTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'fixed': 'Fijo',
      'variable': 'Variable',
      'occasional': 'Ocasional'
    };
    return types[type] || type;
  }

  getExpenseDate(expense: Expense): string {
    // Intentar obtener startDate (del backend) o date (del frontend)
    const dateField = (expense as any).startDate || expense.date;
    return this.formatDate(dateField);
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return 'Sin fecha';
    }
    
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida en formatDate:', dateString);
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}

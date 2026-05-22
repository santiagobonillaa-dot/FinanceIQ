import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { ExpenseService } from '../../services/expense.service';
import { IncomeService, Income } from '../../core/services/income.service';
import { PortfolioService, PortfolioPosition as SharedPortfolioPosition } from '../../core/services/portfolio.service';
import { forkJoin } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

interface PortfolioPosition {
  ticker: string;
  initials: string;
  price: number;
  variation: number;
  pnl: number;
  total: number;
  badgeBg: string;
  badgeText: string;
}

interface AlertItem {
  icon: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'info';
  time: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent, ChartComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent implements OnInit {
  // Propiedades para datos dinámicos
  expenses: any[] = [];
  incomes: Income[] = [];
  loading = false;
  
  // Métricas calculadas
  totalExpenses = 0;
  monthlyExpenses = 0;
  liquidityToday = 0;
  projectedLiquidity = 0;
  portfolioReturn = 0;
  portfolioPositions: PortfolioPosition[] = [];
  portfolioTotalValue = 0;

  liabilities = [
    {
      name: 'Tarjeta de crédito',
      monthlyPayment: 450000,
      rate: 28.5,
      balance: 2800000,
      dueDate: '2026-04-15'
    },
    {
      name: 'Préstamo personal',
      monthlyPayment: 850000,
      rate: 22.3,
      balance: 12500000,
      dueDate: '2028-06-30'
    },
    {
      name: 'Crédito vehicular',
      monthlyPayment: 1200000,
      rate: 18.9,
      balance: 35000000,
      dueDate: '2029-12-15'
    },
    {
      name: 'Hipoteca',
      monthlyPayment: 2100000,
      rate: 12.5,
      balance: 180000000,
      dueDate: '2045-03-01'
    }
  ];
  
  navItems: NavItem[] = [
    { label: 'Inicio', icon: 'activity', route: '/dashboard', badge: 'Live' },
    { label: 'Ingresos', icon: 'dollar-sign', route: '/dashboard' },
    { label: 'Gastos', icon: 'credit-card', route: '/dashboard' },
    { label: 'Deudas', icon: 'alert-triangle', route: '/dashboard' },
    { label: 'Ahorros', icon: 'piggy-bank', route: '/dashboard' },
    { label: 'Presupuesto inteligente', icon: 'brain', route: '/dashboard' },
    { label: 'Portafolio', icon: 'pie-chart', route: '/dashboard' },
    { label: 'Mercado', icon: 'trending-up', route: '/dashboard' },
    { label: 'Alertas', icon: 'bell', route: '/dashboard' }
  ];

  recentAlerts: AlertItem[] = [
    {
      icon: 'trending-up',
      title: 'Meta alcanzada',
      description: 'Has alcanzado tu meta de ahorro del mes',
      severity: 'high',
      time: 'Hace 2 horas'
    },
    {
      icon: 'alert-triangle',
      title: 'Gasto inusual',
      description: 'Gasto en entretenimiento 45% superior al promedio',
      severity: 'medium',
      time: 'Hace 4 horas'
    },
    {
      icon: 'info',
      title: 'Recomendación',
      description: 'Considera diversificar tu portafolio',
      severity: 'info',
      time: 'Hace 6 horas'
    }
  ];

  cashFlowData = {
    labels: ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'],
    datasets: [
      {
        label: 'Ingresos',
        data: [8500, 9200, 8800, 10500, 9800, 11200],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Gastos',
        data: [6200, 6800, 6500, 7200, 7000, 7500],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#fff',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  expensesData = {
    labels: ['Vivienda', 'Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Otros'],
    datasets: [{
      data: [2500, 800, 400, 300, 200, 150],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(107, 114, 128, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: '#fff',
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  constructor(
    private expenseService: ExpenseService,
    private incomeService: IncomeService,
    private portfolioService: PortfolioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPortfolioData();
    this.loadDashboardData();
  }

  private loadPortfolioData(): void {
    // Suscribirse a cambios del portafolio para sincronizar datos
    this.portfolioService.positions$.subscribe(positions => {
      this.portfolioPositions = positions.map(pos => this.mapPortfolioPosition(pos));
      this.portfolioTotalValue = this.portfolioService.getTotalValue();
      this.portfolioReturn = this.portfolioService.getAverageReturn();
    });
  }

  private mapPortfolioPosition(pos: SharedPortfolioPosition): PortfolioPosition {
    const badgeParts = pos.badgeClass.split(' ');
    return {
      ticker: pos.ticker,
      initials: pos.initials,
      price: pos.price,
      variation: pos.dailyChangePct,
      pnl: pos.dailyPnL,
      total: pos.total,
      badgeBg: badgeParts[0] || 'bg-blue-500/20',
      badgeText: badgeParts[1] || 'text-blue-400'
    };
  }

  loadDashboardData(): void {
    this.loading = true;
    console.log('🏠 Cargando datos del dashboard...');
    
    // Cargar gastos para calcular métricas
    forkJoin({
      expenses: this.expenseService.getExpenses(),
      incomes: this.incomeService.getIncomes()
    }).subscribe({
      next: ({ expenses, incomes }) => {
        console.log('🏠 ✅ Gastos cargados:', expenses?.length || 0);
        this.expenses = expenses || [];
        console.log('🏠 📊 Gastos sample:', this.expenses.slice(0, 3));

        this.incomes = this.normalizeIncomesResponse(incomes);
        console.log('🏠 ✅ Ingresos cargados:', this.incomes.length);

        this.calculateMetrics();
        this.updateChartData();
        this.loading = false;

        // Forzar actualización de UI
        setTimeout(() => {
          this.cdr.detectChanges();
          console.log('🏠 🔄 Change detection forzado');
        }, 100);

        console.log('🏠 📈 Datos finales del dashboard:');
        console.log('🏠 📈 cashFlowData:', this.cashFlowData);
        console.log('🏠 📈 expensesData:', this.expensesData);
        console.log('🏠 📈 monthlyExpenses:', this.monthlyExpenses);
        console.log('🏠 📈 ingresos cargados:', this.incomes.slice(0, 3));
      },
      error: (err) => {
        console.error('🏠 ❌ Error cargando datos del dashboard:', err);
        this.loading = false;
      }
    });
  }

  calculateMetrics(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calcular gastos del mes actual
    this.monthlyExpenses = this.expenses
      .filter(expense => {
        const expenseDate = new Date((expense as any).startDate || expense.createdAt || expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + expense.amount, 0);
    
    // Calcular total de gastos
    this.totalExpenses = this.expenses.reduce((total, expense) => total + expense.amount, 0);
    
    // Calcular ingresos del mes actual
    const monthlyIncomes = (this.incomes || [])
      .filter(income => {
        const incomeDate = new Date(income.startDate);
        return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
      })
      .reduce((total, income) => total + income.amount, 0);

    // Liquidez = ingresos del mes - gastos del mes
    this.liquidityToday = monthlyIncomes - this.monthlyExpenses;
    
    // Proyectar liquidez mensual (basada en promedio)
    const totalIncomes = (this.incomes || []).reduce((total, income) => total + income.amount, 0);
    this.projectedLiquidity = totalIncomes > 0 ? totalIncomes - this.totalExpenses : this.liquidityToday;
    
    // Rendimiento del portafolio (calculado desde el servicio compartido)
    this.portfolioReturn = this.portfolioService.getAverageReturn();
  }

  updateChartData(): void {
    // Actualizar datos del gráfico de gastos por categoría
    const categoryData: { [key: string]: number } = {};
    
    this.expenses.forEach(expense => {
      const category = expense.category || 'other';
      categoryData[category] = (categoryData[category] || 0) + expense.amount;
    });
    
    // Mapear categorías a nombres y colores
    const categoryLabels: { [key: string]: string } = {
      'housing': 'Vivienda',
      'food': 'Alimentación',
      'transport': 'Transporte',
      'utilities': 'Servicios',
      'entertainment': 'Entretenimiento',
      'health': 'Salud',
      'education': 'Educación',
      'subscriptions': 'Suscripciones',
      'other': 'Otros'
    };
    
    const categoryColors: { [key: string]: string } = {
      'housing': 'rgba(59, 130, 246, 0.8)',
      'food': 'rgba(239, 68, 68, 0.8)',
      'transport': 'rgba(245, 158, 11, 0.8)',
      'utilities': 'rgba(34, 197, 94, 0.8)',
      'entertainment': 'rgba(168, 85, 247, 0.8)',
      'health': 'rgba(239, 92, 68, 0.8)',
      'education': 'rgba(236, 72, 153, 0.8)',
      'subscriptions': 'rgba(99, 102, 241, 0.8)',
      'other': 'rgba(107, 114, 128, 0.8)'
    };
    
    // Actualizar expensesData
    const labels = Object.keys(categoryData).map(key => categoryLabels[key] || key);
    const data = Object.values(categoryData);
    const colors = Object.keys(categoryData).map(key => categoryColors[key] || 'rgba(107, 114, 128, 0.8)');
    
    this.expensesData = {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    };

    // Actualizar datos del gráfico de flujo de caja
    this.updateCashFlowData();
  }

  updateCashFlowData(): void {
    console.log('🏠 💰 Actualizando datos de flujo de caja...');
    const currentDate = new Date();
    const monthlyData: { [key: string]: { expenses: number, income: number } } = {};
    
    // Generar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'short' 
      }).replace('.', '');
      
      monthlyData[monthKey] = { expenses: 0, income: 0 };
      console.log(`🏠 📅 Mes agregado: ${monthKey}`);
    }
    
    console.log('🏠 📊 Procesando gastos para flujo de caja...');
    // Agrupar gastos por mes
    this.expenses.forEach((expense, index) => {
      const expenseDate = new Date((expense as any).startDate || expense.createdAt || expense.date);
      const monthKey = expenseDate.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'short' 
      }).replace('.', '');
      
      console.log(`🏠 💸 Gasto ${index}: ${expense.name} - ${expense.amount} - Mes: ${monthKey}`);
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += expense.amount;
        console.log(`🏠 ✅ Gasto agregado a ${monthKey}: ${monthlyData[monthKey].expenses}`);
      } else {
        console.log(`🏠 ⚠️ Mes ${monthKey} no encontrado en monthlyData`);
      }
    });
    
    // Agrupar ingresos reales por mes
    console.log('🏠 📊 Procesando ingresos reales para flujo de caja...');
    (this.incomes || []).forEach((income, index) => {
      const incomeDate = new Date(income.startDate);
      const monthKey = incomeDate.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short'
      }).replace('.', '');

      console.log(`🏠 💵 Ingreso ${index}: ${income.name} - ${income.amount} - Mes: ${monthKey}`);

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].income += income.amount;
        console.log(`🏠 ✅ Ingreso agregado a ${monthKey}: ${monthlyData[monthKey].income}`);
      } else {
        console.log(`🏠 ⚠️ Mes ${monthKey} no encontrado en monthlyData para ingreso`);
      }
    });
    
    // Actualizar cashFlowData
    const labels = Object.keys(monthlyData);
    const expensesData = labels.map(month => monthlyData[month].expenses);
    const incomeData = labels.map(month => monthlyData[month].income);
    
    console.log('🏠 📈 Datos finales para cashFlowData:');
    console.log('🏠 📈 Labels:', labels);
    console.log('🏠 📈 Expenses:', expensesData);
    console.log('🏠 📈 Income:', incomeData);
    
    this.cashFlowData = {
      labels: labels,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Gastos',
          data: expensesData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
    
    console.log('🏠 📊 cashFlowData final:', this.cashFlowData);
  }

  formatCurrency(amount: number): string {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  }

  getValueClass(value: number): string {
    if (value > 0) {
      return 'text-green-400';
    }
    if (value < 0) {
      return 'text-red-400';
    }
    return 'text-white/70';
  }

  viewLiabilitiesDetail(): void {
    alert('Próximamente verás el detalle completo de tus pasivos con calendario de pagos.');
  }

  get latestIncomes(): Income[] {
    return (this.incomes || [])
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 4);
  }

  get latestExpenses(): any[] {
    return (this.expenses || [])
      .sort((a, b) => new Date((b as any).startDate || b.date || b.createdAt).getTime() - new Date((a as any).startDate || a.date || a.createdAt).getTime())
      .slice(0, 4);
  }

  private normalizeIncomesResponse(response: any): Income[] {
    if (Array.isArray(response)) {
      return response as Income[];
    }

    if (Array.isArray(response?.data)) {
      return response.data as Income[];
    }

    if (Array.isArray(response?.incomes)) {
      return response.incomes as Income[];
    }

    console.warn('🏠 ⚠️ Respuesta de ingresos desconocida, usando arreglo vacío:', response);
    return [];
  }

  getIncomeFrequencyLabel(frequency?: string): string {
    const map: Record<string, string> = {
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      yearly: 'Anual',
      unica: 'Única vez',
      quincenal: 'Quincenal',
      mensual: 'Mensual'
    };
    return map[frequency || ''] || 'Personalizado';
  }

  getExpenseCategoryLabel(category?: string): string {
    const map: Record<string, string> = {
      housing: 'Vivienda',
      food: 'Alimentación',
      transport: 'Transporte',
      entertainment: 'Entretenimiento',
      health: 'Salud',
      education: 'Educación',
      utilities: 'Servicios',
      subscriptions: 'Suscripciones',
      other: 'Otros'
    };
    return map[category || ''] || 'Otros';
  }

  getExpenseTypeLabel(type?: string): string {
    const map: Record<string, string> = {
      fixed: 'Fijo',
      variable: 'Variable'
    };
    return map[type || ''] || 'General';
  }

  formatDate(value?: string | Date): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getExpenseDate(expense: any): string {
    const date = (expense as any).startDate || expense.date || expense.createdAt;
    return this.formatDate(date);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';

@Component({
  selector: 'app-ahorros-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, ChartComponent, ReactiveFormsModule],
  templateUrl: './ahorros-page.component.html',
  styleUrl: './ahorros-page.component.scss'
})
export class AhorrosPageComponent implements OnInit {
  private static readonly STORAGE_KEY = 'app_savings_goals';

  chartReady = false;
  savingsChart: SavingsChartConfig = this.getEmptyChartConfig();
  savingsGoals: SavingsGoal[] = [];
  savingsHistory: SavingsHistoryEntry[] = [];
  summary: SavingsSummary = this.getEmptySummary();

  goalForm: FormGroup;
  modalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingGoalId: string | null = null;

  constructor(private fb: FormBuilder) {
    this.goalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      targetAmount: [0, [Validators.required, Validators.min(1000)]],
      savedAmount: [0, [Validators.min(0)]],
      deadline: ['', Validators.required],
      priority: ['medium', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadSavedGoals();
    this.refreshDerivedData();
  }

  get simulateDisabled(): boolean {
    return this.savingsGoals.length === 0;
  }

  simulateSavings(): void {
    if (this.savingsGoals.length === 0) {
      alert('Registra al menos una meta de ahorro para simular.');
      return;
    }

    const chartData = this.buildSimulationChartData();
    this.savingsChart = {
      ...this.savingsChart,
      data: chartData
    };
    this.chartReady = true;
  }

  openGoalModal(mode: 'create' | 'edit', goalId?: string): void {
    this.modalMode = mode;
    this.modalOpen = true;

    if (mode === 'edit' && goalId) {
      const goal = this.savingsGoals.find(g => g.id === goalId);
      if (!goal) {
        return;
      }

      this.editingGoalId = goal.id;
      this.goalForm.patchValue({
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        deadline: goal.deadline,
        priority: goal.priority
      });
    } else {
      this.editingGoalId = null;
      this.goalForm.reset({
        name: '',
        targetAmount: 0,
        savedAmount: 0,
        deadline: '',
        priority: 'medium'
      });
    }
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  saveGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const formValue = { ...this.goalForm.value } as GoalFormValue;
    formValue.savedAmount = Math.min(formValue.savedAmount ?? 0, formValue.targetAmount);
    formValue.savedAmount = Math.max(formValue.savedAmount, 0);

    if (this.modalMode === 'edit' && this.editingGoalId) {
      this.savingsGoals = this.savingsGoals.map(goal =>
        goal.id === this.editingGoalId
          ? {
              ...goal,
              ...formValue
            }
          : goal
      );
    } else {
      this.savingsGoals = [
        ...this.savingsGoals,
        {
          id: this.generateGoalId(),
          ...formValue
        }
      ];
    }

    this.refreshDerivedData();
    this.persistSavingsState();
    this.closeModal();
  }

  deleteGoal(goalId: string): void {
    const goal = this.savingsGoals.find(g => g.id === goalId);
    if (!goal) {
      return;
    }

    const confirmation = confirm(`¿Eliminar la meta "${goal.name}"? Esta acción no se puede deshacer.`);
    if (!confirmation) {
      return;
    }

    this.savingsGoals = this.savingsGoals.filter(g => g.id !== goalId);
    this.refreshDerivedData();
    this.persistSavingsState();
  }

  getGoalProgress(goal: SavingsGoal): number {
    if (!goal.targetAmount) {
      return 0;
    }
    return Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
  }

  getPriorityLabel(priority: GoalPriority): string {
    const map: Record<GoalPriority, string> = {
      high: 'Alta prioridad',
      medium: 'Mediana prioridad',
      low: 'Baja prioridad'
    };
    return map[priority];
  }

  getPriorityClass(priority: GoalPriority): string {
    const map: Record<GoalPriority, string> = {
      high: 'text-red-400',
      medium: 'text-yellow-400',
      low: 'text-green-400'
    };
    return map[priority];
  }

  getGoalBadgeClass(priority: GoalPriority): string {
    const map: Record<GoalPriority, string> = {
      high: 'bg-red-900/50',
      medium: 'bg-yellow-900/50',
      low: 'bg-green-900/50'
    };
    return map[priority];
  }

  private refreshDerivedData(): void {
    this.summary = this.calculateSummary();
    this.savingsHistory = this.buildSavingsHistory(this.summary.totalSaved);
    this.chartReady = false;
  }

  private loadSavedGoals(): void {
    if (!this.canUseStorage()) {
      this.savingsGoals = this.getDefaultGoals();
      return;
    }

    try {
      const stored = localStorage.getItem(AhorrosPageComponent.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavingsGoal[];
        if (Array.isArray(parsed) && parsed.length) {
          this.savingsGoals = parsed.map(goal => ({ ...goal }));
          return;
        }
      }
    } catch (error) {
      console.warn('No se pudieron cargar las metas guardadas:', error);
    }

    this.savingsGoals = this.getDefaultGoals();
    this.persistSavingsState();
  }

  private persistSavingsState(): void {
    if (!this.canUseStorage()) {
      return;
    }

    try {
      localStorage.setItem(
        AhorrosPageComponent.STORAGE_KEY,
        JSON.stringify(this.savingsGoals)
      );
    } catch (error) {
      console.warn('No se pudieron guardar las metas de ahorro:', error);
    }
  }

  private canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private calculateSummary(): SavingsSummary {
    if (!this.savingsGoals.length) {
      return this.getEmptySummary();
    }

    const now = new Date();

    const accumulator = this.savingsGoals.reduce(
      (acc, goal) => {
        const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
        const monthsDiff = this.calculateMonthsDifference(now, new Date(goal.deadline));
        const monthlyNeeded = monthsDiff > 0 ? remaining / monthsDiff : remaining;

        acc.totalSaved += goal.savedAmount;
        acc.totalTarget += goal.targetAmount;
        acc.remainingToGoal += remaining;
        acc.monthlyNeeded += monthlyNeeded;
        acc.goalsCount += 1;
        return acc;
      },
      {
        totalSaved: 0,
        totalTarget: 0,
        remainingToGoal: 0,
        monthlyNeeded: 0,
        goalsCount: 0
      }
    );

    return {
      totalSaved: accumulator.totalSaved,
      totalTarget: accumulator.totalTarget,
      remainingToGoal: accumulator.remainingToGoal,
      monthlyNeeded: accumulator.monthlyNeeded,
      goalsCount: accumulator.goalsCount
    };
  }

  private buildSavingsHistory(totalSaved: number): SavingsHistoryEntry[] {
    const months = 12;
    if (months <= 0) {
      return [];
    }

    const now = new Date();
    const avgIncrement = months > 0 ? totalSaved / months : 0;
    const history: SavingsHistoryEntry[] = [];

    let runningValue = Math.max(totalSaved - avgIncrement * (months - 1), 0);

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = this.formatMonthLabel(date);
      const amount = Math.max(Math.round(runningValue), 0);
      const previousAmount = history.length ? history[history.length - 1].amount : 0;
      const variation = previousAmount > 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;

      history.push({
        monthLabel: label,
        amount,
        variation
      });

      runningValue += avgIncrement;
    }

    return history;
  }

  private buildSimulationChartData(): SavingsChartData {
    const historyLabels = this.savingsHistory.map(entry => entry.monthLabel);
    const historyData = this.savingsHistory.map(entry => entry.amount);
    const projection = this.buildProjectionSeries(historyData[historyData.length - 1] ?? 0);

    const labels = [...historyLabels, ...projection.map(entry => entry.label)];

    return {
      labels,
      datasets: [
        {
          label: 'Ahorro real (últimos 12 meses)',
          data: historyData.concat(Array(projection.length).fill(null)),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          spanGaps: true
        },
        {
          label: 'Proyección (próximos 6 meses)',
          data: Array(historyData.length).fill(null).concat(projection.map(entry => entry.amount)),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderDash: [8, 6],
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          spanGaps: true
        }
      ]
    };
  }

  private buildProjectionSeries(startingAmount: number): ProjectionEntry[] {
    const months = 6;
    const projection: ProjectionEntry[] = [];
    const now = new Date();
    const monthlyIncrease = this.summary.monthlyNeeded || (startingAmount > 0 ? startingAmount * 0.05 : 500000);

    let lastAmount = startingAmount;

    for (let i = 1; i <= months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      lastAmount = Math.max(lastAmount + monthlyIncrease, 0);
      projection.push({
        label: this.formatMonthLabel(date),
        amount: Math.round(lastAmount)
      });
    }

    return projection;
  }

  private getDefaultGoals(): SavingsGoal[] {
    return [
      {
        id: this.generateGoalId(),
        name: 'Fondo de Emergencia',
        targetAmount: 50000000,
        savedAmount: 32500000,
        deadline: this.formatDateForInput(new Date(new Date().getFullYear(), 11, 1)),
        priority: 'high'
      },
      {
        id: this.generateGoalId(),
        name: 'Fondo de Jubilación',
        targetAmount: 500000000,
        savedAmount: 28500000,
        deadline: this.formatDateForInput(new Date(new Date().getFullYear() + 20, 5, 1)),
        priority: 'medium'
      },
      {
        id: this.generateGoalId(),
        name: 'Fondo de Educación',
        targetAmount: 30000000,
        savedAmount: 7450000,
        deadline: this.formatDateForInput(new Date(new Date().getFullYear() + 2, 7, 1)),
        priority: 'low'
      }
    ];
  }

  private getEmptyChartConfig(): SavingsChartConfig {
    return {
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#fff'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            titleColor: '#fff',
            bodyColor: '#fff'
          }
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              callback: (value: any) => this.formatCurrency(Number(value))
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    };
  }

  private getEmptySummary(): SavingsSummary {
    return {
      totalSaved: 0,
      totalTarget: 0,
      remainingToGoal: 0,
      monthlyNeeded: 0,
      goalsCount: 0
    };
  }

  private formatMonthLabel(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(date);
  }

  private calculateMonthsDifference(from: Date, to: Date): number {
    const years = to.getFullYear() - from.getFullYear();
    const months = to.getMonth() - from.getMonth();
    return Math.max(years * 12 + months, 1);
  }

  private formatCurrency(value: number): string {
    if (Number.isNaN(value)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private generateGoalId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

type GoalPriority = 'low' | 'medium' | 'high';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  priority: GoalPriority;
}

interface GoalFormValue {
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  priority: GoalPriority;
}

interface SavingsHistoryEntry {
  monthLabel: string;
  amount: number;
  variation: number;
}

interface ProjectionEntry {
  label: string;
  amount: number;
}

interface SavingsChartData {
  labels: string[];
  datasets: any[];
}

interface SavingsChartConfig {
  data: SavingsChartData;
  options: any;
}

interface SavingsSummary {
  totalSaved: number;
  totalTarget: number;
  remainingToGoal: number;
  monthlyNeeded: number;
  goalsCount: number;
}

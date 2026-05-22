import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MainLayoutComponent, ChartComponent } from '../../shared';
import { DebtService, Debt } from '../../core/services/debt.service';

@Component({
  selector: 'app-deudas-page-layout',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, ChartComponent, ReactiveFormsModule],
  templateUrl: './deudas-page-layout.component.html',
  styleUrl: './deudas-page-layout.component.scss'
})
export class DeudasPageLayoutComponent implements OnInit {
  chartReady = false;
  private readonly simulationConfig = {
    months: 12,
    extraPaymentFactor: 0.25
  };
  estrategiasChart: StrategyChartConfig = {
    data: {
      labels: [] as string[],
      datasets: [] as StrategyDataset[],
    },
    options: {
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
            },
            padding: 20,
            boxWidth: 10,
            boxHeight: 10,
            borderRadius: 5
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
              if (value >= 1000) {
                return '$' + (value / 1000) + 'k';
              }
              return value;
            }
          }
        }
      }
    }
  };

  debts: DebtCard[] = [];
  rawDebts: Debt[] = [];
  summaryMetrics: DebtSummaryMetrics = this.getEmptySummaryMetrics();

  debtForm: FormGroup;
  modalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingDebtId: string | null = null;
  loadingDebts = false;
  savingDebt = false;
  errorMessage = '';
  readonly priorityOptions: PriorityOption[] = [
    { value: 'high', label: 'Alta prioridad', color: 'text-red-400', iconBg: 'bg-red-900/50' },
    { value: 'medium', label: 'Media prioridad', color: 'text-yellow-400', iconBg: 'bg-yellow-900/50' },
    { value: 'low', label: 'Baja prioridad', color: 'text-green-400', iconBg: 'bg-blue-900/50' }
  ];
  readonly minDueDateISO = this.formatDateForInput(new Date());

  constructor(private fb: FormBuilder, private debtService: DebtService) {
    this.debtForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      balance: [0, [Validators.required, Validators.min(0.01)]],
      monthlyPayment: [0, [Validators.required, Validators.min(0.01)]],
      amountPaid: [0, [Validators.min(0)]],
      rate: [{ value: 0, disabled: true }],
      priority: ['medium', Validators.required],
      dueDate: ['', [Validators.required, this.futureDateValidator]]
    });

    this.setupRateWatcher();
    this.setupAmountPaidWatcher();
  }

  ngOnInit(): void {
    this.loadDebts();
  }

  get simulateDisabled(): boolean {
    return this.loadingDebts || this.savingDebt;
  }

  simulateStrategies(): void {
    if (!this.rawDebts.length) {
      alert('Registra al menos una deuda para simular las estrategias.');
      return;
    }

    const chartData = this.buildStrategyChartData();
    this.estrategiasChart = {
      ...this.estrategiasChart,
      data: chartData
    };
    this.chartReady = true;
  }

  openDebtModal(mode: 'create' | 'edit', debtId?: string): void {
    this.modalMode = mode;
    this.modalOpen = true;

    if (mode === 'edit' && debtId) {
      const debt = this.rawDebts.find(d => d._id === debtId);
      if (debt) {
        this.editingDebtId = debt._id;
        this.debtForm.patchValue({
          name: debt.name,
          balance: this.getOriginalAmount(debt as DebtWithMetadata),
          monthlyPayment: debt.paymentSchedule?.paymentAmount ?? 0,
          amountPaid: this.getAmountPaidFromDebt(debt as DebtWithMetadata),
          rate: debt.interestRate?.annual ?? 0,
          priority: (debt.priority as PriorityValue) ?? 'medium',
          dueDate: this.formatDateForInput(new Date(debt.paymentSchedule?.nextPaymentDate || debt.paymentSchedule?.endDate || debt.paymentSchedule?.startDate || new Date()))
        });
      }
    } else {
      this.editingDebtId = null;
      this.debtForm.reset({
        name: '',
        balance: 0,
        monthlyPayment: 0,
        amountPaid: 0,
        rate: 0,
        priority: 'medium',
        dueDate: ''
      });
      this.updateComputedRate();
    }
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  saveDebt(): void {
    if (this.debtForm.invalid) {
      this.debtForm.markAllAsTouched();
      return;
    }

    this.savingDebt = true;
    const payload = this.normalizeDebtPayload(this.debtForm.getRawValue());

    if (this.modalMode === 'create') {
      this.debtService.createDebt(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadDebts();
        },
        error: (err) => {
          console.error('Error creando deuda', err);
          alert('❌ No se logró guardar la deuda. Inténtalo nuevamente.');
          this.savingDebt = false;
        }
      });
    } else if (this.modalMode === 'edit' && this.editingDebtId) {
      this.debtService.updateDebt(this.editingDebtId, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadDebts();
        },
        error: (err) => {
          console.error('Error actualizando deuda', err);
          alert('❌ No se logró actualizar la deuda. Inténtalo nuevamente.');
          this.savingDebt = false;
        }
      });
    }
  }

  deleteDebt(debtId: string): void {
    const debt = this.rawDebts.find(d => d._id === debtId);
    if (!debt) {
      return;
    }

    const confirmation = confirm(`¿Eliminar la deuda "${debt.name}"? Esta acción no se puede deshacer.`);
    if (!confirmation) {
      return;
    }

    this.debtService.deleteDebt(debtId).subscribe({
      next: () => {
        this.loadDebts();
      },
      error: (err) => {
        console.error('Error eliminando deuda', err);
        alert('❌ No se logró eliminar la deuda. Inténtalo nuevamente.');
      }
    });
  }

  loadDebts(): void {
    this.loadingDebts = true;
    this.errorMessage = '';
    this.debtService.getDebts().subscribe({
      next: (response) => {
        const debtsData = this.extractDebtsFromResponse(response);
        this.rawDebts = debtsData;
        this.debts = debtsData.map(debt => this.mapDebtToCard(debt));
        this.updateSummaryMetrics();
        this.chartReady = false;
        this.loadingDebts = false;
        this.savingDebt = false;
      },
      error: (err) => {
        console.error('Error cargando deudas', err);
        this.errorMessage = 'No pudimos cargar tus deudas. Intenta actualizar.';
        this.loadingDebts = false;
        this.savingDebt = false;
        this.summaryMetrics = this.getEmptySummaryMetrics();
      }
    });
  }

  private extractDebtsFromResponse(response: any): Debt[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response as Debt[];
    }

    if (Array.isArray(response?.data?.debts)) {
      return response.data.debts as Debt[];
    }

    if (Array.isArray(response?.data)) {
      return response.data as Debt[];
    }

    return [];
  }

  private mapDebtToCard(debt: Debt): DebtCard {
    const debtWithMeta = debt as DebtWithMetadata;
    const priorityValue = (debt.priority as PriorityValue) || 'medium';
    const priorityMeta = this.getPriorityMeta(priorityValue);
    const originalAmount = this.getOriginalAmount(debtWithMeta);
    const amountPaid = this.getAmountPaidFromDebt(debtWithMeta);
    const balance = Math.max(originalAmount - amountPaid, 0);
    const progress = originalAmount > 0 ? Math.round((amountPaid / originalAmount) * 100) : 0;
    const dueDate = debt.paymentSchedule?.nextPaymentDate || debt.paymentSchedule?.endDate || debt.paymentSchedule?.startDate || new Date();

    return {
      id: debt._id,
      name: debt.name,
      priorityLabel: priorityMeta.label,
      priorityColor: priorityMeta.color,
      iconBg: priorityMeta.iconBg,
      balance,
      monthlyPayment: debt.paymentSchedule?.paymentAmount ?? 0,
      rate: debt.interestRate?.annual ?? 0,
      dueDate: dueDate,
      amountPaid,
      progress: Math.min(Math.max(progress, 0), 100)
    };
  }

  private getOriginalAmount(debt: DebtWithMetadata): number {
    if (typeof debt.originalAmount === 'number') {
      return debt.originalAmount;
    }

    if (typeof debt.metadata?.originalAmount === 'number') {
      return debt.metadata.originalAmount;
    }

    return debt.currentBalance ?? 0;
  }

  private getAmountPaidFromDebt(debt: DebtWithMetadata): number {
    if (typeof debt.metadata?.amountPaidManual === 'number') {
      return Math.max(debt.metadata.amountPaidManual, 0);
    }

    if (typeof (debt as any).amountPaid === 'number') {
      return Math.max((debt as any).amountPaid, 0);
    }

    const originalAmount = this.getOriginalAmount(debt);
    const balance = debt.currentBalance ?? originalAmount;
    return Math.max(originalAmount - balance, 0);
  }

  private updateSummaryMetrics(): void {
    if (!this.rawDebts.length) {
      this.summaryMetrics = this.getEmptySummaryMetrics();
      return;
    }

    const accumulator = this.rawDebts.reduce((acc, debt) => {
      const debtWithMeta = debt as DebtWithMetadata;
      const originalAmount = this.getOriginalAmount(debtWithMeta);
      const amountPaid = this.getAmountPaidFromDebt(debtWithMeta);
      const balance = Math.max(originalAmount - amountPaid, 0);
      const monthlyPayment = debt.paymentSchedule?.paymentAmount ?? 0;
      const rate = debt.interestRate?.annual ?? 0;
      const weight = balance > 0 ? balance : originalAmount;

      acc.totalBalance += balance;
      acc.totalMonthlyPayment += monthlyPayment;
      acc.totalPaid += amountPaid;
      acc.weightedRate += rate * weight;
      acc.weight += weight;
      acc.activeDebts += 1;
      return acc;
    }, {
      totalBalance: 0,
      totalMonthlyPayment: 0,
      totalPaid: 0,
      weightedRate: 0,
      weight: 0,
      activeDebts: 0
    });

    const averageRate = accumulator.weight > 0 ? accumulator.weightedRate / accumulator.weight : 0;

    this.summaryMetrics = {
      totalBalance: accumulator.totalBalance,
      totalMonthlyPayment: accumulator.totalMonthlyPayment,
      averageRate,
      totalPaid: accumulator.totalPaid,
      activeDebts: accumulator.activeDebts
    };
  }

  private getEmptySummaryMetrics(): DebtSummaryMetrics {
    return {
      totalBalance: 0,
      totalMonthlyPayment: 0,
      averageRate: 0,
      totalPaid: 0,
      activeDebts: 0
    };
  }

  private buildStrategyChartData(): StrategyChartData {
    const simulationDebts = this.getSimulationDebts();

    if (!simulationDebts.length) {
      return this.estrategiasChart.data;
    }

    const months = this.simulationConfig.months;
    const labels = this.generateMonthLabels(months);
    const totalMinimumPayment = simulationDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
    const extraBudget = totalMinimumPayment * this.simulationConfig.extraPaymentFactor;

    const strategies: StrategyDefinition[] = [
      {
        key: 'avalanche',
        label: 'Método Avalanche',
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)'
      },
      {
        key: 'snowball',
        label: 'Método Snowball',
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)'
      },
      {
        key: 'minimum',
        label: 'Pago Mínimo',
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.2)'
      }
    ];

    const datasets = strategies.map<StrategyDataset>((strategy) => ({
      label: strategy.label,
      data: this.simulateStrategy(simulationDebts, months, strategy.key, extraBudget),
      borderColor: strategy.borderColor,
      backgroundColor: strategy.backgroundColor,
      borderWidth: 3,
      tension: 0.4,
      fill: true
    }));

    return { labels, datasets };
  }

  private simulateStrategy(
    baseDebts: DebtSimulationState[],
    months: number,
    method: StrategyKey,
    extraBudget: number
  ): number[] {
    const debts = baseDebts.map((debt) => ({ ...debt }));
    const results: number[] = [];

    for (let month = 0; month < months; month++) {
      this.applyMonthlyInterest(debts);
      this.applyMinimumPayments(debts);

      if (method !== 'minimum' && extraBudget > 0) {
        this.applyExtraPayments(debts, method, extraBudget);
      }

      const remaining = this.sumBalances(debts);
      results.push(Math.max(Number(remaining.toFixed(0)), 0));

      if (remaining <= 0) {
        // Rellenar con ceros el resto de meses para mantener longitud uniforme
        while (results.length < months) {
          results.push(0);
        }
        break;
      }
    }

    return results;
  }

  private getSimulationDebts(): DebtSimulationState[] {
    return this.rawDebts
      .map((debt) => {
        const debtWithMeta = debt as DebtWithMetadata;
        const originalAmount = this.getOriginalAmount(debtWithMeta);
        const amountPaid = this.getAmountPaidFromDebt(debtWithMeta);
        const balance = Math.max(originalAmount - amountPaid, 0);
        const fallbackPayment = balance > 0 ? Math.max(balance * 0.03, 50000) : 0;
        const monthlyPayment = Math.max(debt.paymentSchedule?.paymentAmount ?? 0, fallbackPayment);

        return {
          id: debt._id,
          balance,
          rate: debt.interestRate?.annual ?? 0,
          monthlyPayment
        } as DebtSimulationState;
      })
      .filter((debt) => debt.balance > 0);
  }

  private applyMonthlyInterest(debts: DebtSimulationState[]): void {
    debts.forEach((debt) => {
      if (debt.balance <= 0) {
        return;
      }

      const monthlyRate = debt.rate / 100 / 12;
      const interest = debt.balance * monthlyRate;
      debt.balance += interest;
    });
  }

  private applyMinimumPayments(debts: DebtSimulationState[]): void {
    debts.forEach((debt) => {
      if (debt.balance <= 0) {
        return;
      }

      const payment = Math.min(debt.monthlyPayment, debt.balance);
      debt.balance -= payment;
    });
  }

  private applyExtraPayments(debts: DebtSimulationState[], method: StrategyKey, extraBudget: number): void {
    let remainingExtra = extraBudget;

    while (remainingExtra > 0.01) {
      const target = this.pickTargetDebt(debts, method);
      if (!target || target.balance <= 0) {
        break;
      }

      const payment = Math.min(remainingExtra, target.balance);
      target.balance -= payment;
      remainingExtra -= payment;
    }
  }

  private pickTargetDebt(debts: DebtSimulationState[], method: StrategyKey): DebtSimulationState | undefined {
    const activeDebts = debts.filter((debt) => debt.balance > 0);

    if (!activeDebts.length) {
      return undefined;
    }

    if (method === 'avalanche') {
      return activeDebts.sort((a, b) => b.rate - a.rate)[0];
    }

    if (method === 'snowball') {
      return activeDebts.sort((a, b) => a.balance - b.balance)[0];
    }

    return activeDebts[0];
  }

  private sumBalances(debts: DebtSimulationState[]): number {
    return debts.reduce((sum, debt) => sum + Math.max(debt.balance, 0), 0);
  }

  private generateMonthLabels(count: number): string[] {
    const formatter = new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' });
    const today = new Date();

    return Array.from({ length: count }, (_, index) => {
      const labelDate = new Date(today.getFullYear(), today.getMonth() + index, 1);
      return formatter.format(labelDate);
    });
  }

  private setupRateWatcher(): void {
    this.debtForm.get('balance')?.valueChanges.subscribe(() => this.updateComputedRate());
    this.debtForm.get('monthlyPayment')?.valueChanges.subscribe(() => this.updateComputedRate());
  }

  private setupAmountPaidWatcher(): void {
    this.debtForm.get('balance')?.valueChanges.subscribe(() => {
      this.enforceAmountPaidLimits();
    });
    this.debtForm.get('amountPaid')?.valueChanges.subscribe(() => this.enforceAmountPaidLimits());
  }

  private enforceAmountPaidLimits(): void {
    const balanceControl = this.debtForm.get('balance');
    const amountPaidControl = this.debtForm.get('amountPaid');

    if (!balanceControl || !amountPaidControl) {
      return;
    }

    const balance = Number(balanceControl.value) || 0;
    let amountPaid = Number(amountPaidControl.value) || 0;

    if (amountPaid < 0) {
      amountPaid = 0;
    }

    if (amountPaid > balance) {
      amountPaid = balance;
    }

    if (amountPaid !== amountPaidControl.value) {
      amountPaidControl.setValue(amountPaid, { emitEvent: false });
    }

    amountPaidControl.setErrors(this.getAmountPaidErrors(amountPaid, balance));
  }

  private getAmountPaidErrors(amountPaid: number, balance: number): ValidationErrors | null {
    if (amountPaid < 0) {
      return { negative: true };
    }

    if (amountPaid > balance) {
      return { exceedsBalance: true };
    }

    return null;
  }

  private updateComputedRate(): void {
    const rate = this.computeRateFromForm();
    this.debtForm.get('rate')?.setValue(rate, { emitEvent: false, onlySelf: true });
  }

  private computeRateFromForm(): number {
    const balance = Number(this.debtForm.get('balance')?.value) || 0;
    const monthlyPayment = Number(this.debtForm.get('monthlyPayment')?.value) || 0;

    if (balance <= 0 || monthlyPayment <= 0) {
      return 0;
    }

    const annualized = (monthlyPayment * 12 * 100) / balance;
    return Math.min(Math.max(Number(annualized.toFixed(2)), 0), 100);
  }

  private normalizeDebtPayload(rawForm: any): Partial<Debt> {
    const rate = this.computeRateFromForm();
    const originalAmount = Number(rawForm.balance) || 0;
    const amountPaid = Math.min(Math.max(Number(rawForm.amountPaid) || 0, 0), originalAmount);
    const currentBalance = Math.max(originalAmount - amountPaid, 0);
    const dueDate = rawForm.dueDate ? new Date(rawForm.dueDate) : new Date();
    const term = Math.max(1, this.calculateTermMonths(dueDate));
    const defaultCreditor = {
      name: 'Ingreso manual',
      type: 'bank',
      contact: {}
    };

    return {
      name: rawForm.name,
      originalAmount,
      currentBalance,
      currency: 'COP',
      interestRate: {
        annual: rate,
        type: 'fixed',
        compoundingFrequency: 'monthly'
      },
      paymentSchedule: {
        frequency: 'monthly',
        dayOfMonth: dueDate.getDate() || 1,
        paymentAmount: rawForm.monthlyPayment,
        startDate: rawForm.dueDate ? new Date(rawForm.dueDate) : new Date(),
        nextPaymentDate: dueDate
      },
      loanDetails: {
        type: 'personal',
        term
      },
      amortizationType: 'french',
      priority: rawForm.priority,
      creditor: rawForm.creditor || defaultCreditor,
      metadata: {
        ...rawForm.metadata,
        amountPaidManual: amountPaid
      },
      insurance: {
        hasInsurance: false,
        monthlyPremium: 0,
        coverageAmount: 0
      },
      fees: {
        originationFee: 0,
        prepaymentPenalty: 0,
        latePaymentFee: 0,
        annualFee: 0
      }
    } as Partial<Debt>;
  }

  private calculateTermMonths(dueDate: Date): number {
    const now = new Date();
    const years = dueDate.getFullYear() - now.getFullYear();
    const months = years * 12 + (dueDate.getMonth() - now.getMonth());
    return Math.max(months, 12);
  }

  private getPriorityMeta(value: PriorityValue): PriorityOption {
    return this.priorityOptions.find((option) => option.value === value) ?? this.priorityOptions[1];
  }

  private futureDateValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(value);
    selected.setHours(0, 0, 0, 0);

    return selected < today ? { pastDate: true } : null;
  };

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

type PriorityValue = 'low' | 'medium' | 'high';

interface PriorityOption {
  value: PriorityValue;
  label: string;
  color: string;
  iconBg: string;
}

interface DebtCard {
  id: string;
  name: string;
  priorityLabel: string;
  priorityColor: string;
  iconBg: string;
  balance: number;
  monthlyPayment: number;
  rate: number;
  dueDate: Date | string;
  amountPaid: number;
  progress: number;
}

type DebtWithMetadata = Debt & {
  metadata?: {
    amountPaidManual?: number;
    originalAmount?: number;
  };
};

interface DebtSimulationState {
  id: string;
  balance: number;
  rate: number;
  monthlyPayment: number;
}

type StrategyKey = 'avalanche' | 'snowball' | 'minimum';

interface StrategyDefinition {
  key: StrategyKey;
  label: string;
  borderColor: string;
  backgroundColor: string;
}

type StrategyDataset = {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  tension: number;
  fill: boolean;
};

type StrategyChartData = {
  labels: string[];
  datasets: StrategyDataset[];
};

type StrategyChartConfig = {
  data: StrategyChartData;
  options: any;
};

interface DebtSummaryMetrics {
  totalBalance: number;
  totalMonthlyPayment: number;
  averageRate: number;
  totalPaid: number;
  activeDebts: number;
}

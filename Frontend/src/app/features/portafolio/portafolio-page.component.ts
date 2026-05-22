import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortfolioService, PortfolioPosition } from '../../core/services/portfolio.service';

interface PortfolioSummary {
  totalValue: number;
  positionsCount: number;
  dailyGain: number;
  dailyGainPct: number;
  riskScore: number;
  riskLabel: string;
  totalReturnPct: number;
}

interface PerformanceEntry {
  amount: number;
  pct: number;
}

interface PerformanceBreakdown {
  day: PerformanceEntry;
  week: PerformanceEntry;
  month: PerformanceEntry;
}

@Component({
  selector: 'app-portafolio-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, ChartComponent, ReactiveFormsModule],
  templateUrl: './portafolio-page.component.html',
  styleUrl: './portafolio-page.component.scss'
})
export class PortafolioPageComponent implements OnInit {
  private readonly categoryColors: Record<string, string> = {
    'Acciones USA': 'rgba(59, 130, 246, 0.8)',
    'Tecnología Innovación': 'rgba(168, 85, 247, 0.8)',
    'Cripto': 'rgba(251, 191, 36, 0.8)',
    'Bonos Globales': 'rgba(34, 197, 94, 0.8)',
    'Real Estate': 'rgba(245, 158, 11, 0.8)'
  };

  categories = ['Acciones USA', 'Tecnología Innovación', 'Cripto', 'Bonos Globales', 'Real Estate'];
  positionForm!: FormGroup;
  positionModalOpen = false;

  portfolioPerformanceData = {
    labels: ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb'],
    datasets: [
      {
        label: 'Valor total (millones COP)',
        data: [48500, 52000, 50500, 54000, 59000, 64000],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)'
      }
    ]
  };

  portfolioPositions: PortfolioPosition[] = [];

  portfolioSummary!: PortfolioSummary;
  performanceBreakdown!: PerformanceBreakdown;
  expensesData!: any;

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
            return `${label}: ${value}%`;
          }
        }
      }
    }
  };

  constructor(
    private fb: FormBuilder,
    private portfolioService: PortfolioService
  ) {
    this.positionForm = this.buildPositionForm();
  }

  ngOnInit(): void {
    this.portfolioPositions = this.portfolioService.getPositions();
    this.refreshPortfolioAnalytics();
  }

  private refreshPortfolioAnalytics(): void {
    const categoryTotals = this.getCategoryTotals();
    const totalValue = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    this.portfolioSummary = this.calculatePortfolioSummary(categoryTotals, totalValue);
    this.performanceBreakdown = this.calculatePerformanceBreakdown(this.portfolioSummary.totalValue);
    this.expensesData = this.buildAllocationDataset(categoryTotals, this.portfolioSummary.totalValue);
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

  getChangeClass(value: number): string {
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  }

  getPositionWeight(position: PortfolioPosition): number {
    if (!this.portfolioSummary?.totalValue) {
      return 0;
    }
    return Number(((position.total / this.portfolioSummary.totalValue) * 100).toFixed(1));
  }

  openPositionModal(): void {
    this.positionForm.reset({
      ticker: '',
      name: '',
      category: this.categories[0],
      quantity: 1,
      averagePrice: null,
      price: null
    });
    this.positionModalOpen = true;
  }

  closePositionModal(): void {
    this.positionModalOpen = false;
  }

  savePosition(): void {
    if (this.positionForm.invalid) {
      this.positionForm.markAllAsTouched();
      return;
    }

    const { ticker, name, category, quantity, averagePrice, price } = this.positionForm.value;
    const normalizedTicker = (ticker as string).toUpperCase();
    const normalizedName = (name as string).trim();
    const numericQuantity = Number(quantity);
    const avgPrice = Number(averagePrice);
    const currentPrice = Number(price);

    const total = numericQuantity * currentPrice;
    const pnl = (currentPrice - avgPrice) * numericQuantity;
    const changePct = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

    const newPosition: PortfolioPosition = {
      ticker: normalizedTicker,
      name: normalizedName,
      initials: normalizedTicker.substring(0, 2),
      price: currentPrice,
      averagePrice: avgPrice,
      quantity: numericQuantity,
      dailyChangePct: Number(changePct.toFixed(2)),
      dailyPnL: pnl,
      weeklyPnL: pnl * 2,
      monthlyPnL: pnl * 4,
      total,
      category,
      badgeClass: this.getBadgeClassForCategory(category),
      ytdReturnPct: Number((changePct + 5).toFixed(1))
    };

    this.portfolioPositions = [newPosition, ...this.portfolioPositions];
    this.portfolioService.setPositions(this.portfolioPositions);
    this.refreshPortfolioAnalytics();
    this.closePositionModal();
  }

  private calculatePortfolioSummary(categoryTotals: Record<string, number>, totalValue: number): PortfolioSummary {
    const dailyGain = this.portfolioPositions.reduce((acc, pos) => acc + pos.dailyPnL, 0);
    const previousValue = totalValue - dailyGain;
    const dailyGainPct = previousValue > 0 ? (dailyGain / previousValue) * 100 : 0;
    const avgReturnPct = this.portfolioPositions.reduce((acc, pos) => acc + pos.ytdReturnPct, 0) / this.portfolioPositions.length;
    const riskScore = this.calculateRiskScore(categoryTotals, totalValue);

    return {
      totalValue,
      positionsCount: this.portfolioPositions.length,
      dailyGain,
      dailyGainPct,
      riskScore,
      riskLabel: this.getRiskLabel(riskScore),
      totalReturnPct: avgReturnPct
    };
  }

  private calculatePerformanceBreakdown(baseValue: number): PerformanceBreakdown {
    const daily = this.portfolioPositions.reduce((acc, pos) => acc + pos.dailyPnL, 0);
    const weekly = this.portfolioPositions.reduce((acc, pos) => acc + pos.weeklyPnL, 0);
    const monthly = this.portfolioPositions.reduce((acc, pos) => acc + pos.monthlyPnL, 0);

    return {
      day: this.buildPerformanceEntry(daily, baseValue),
      week: this.buildPerformanceEntry(weekly, baseValue),
      month: this.buildPerformanceEntry(monthly, baseValue)
    };
  }

  private buildPerformanceEntry(amount: number, baseValue: number): PerformanceEntry {
    const pct = baseValue > 0 ? (amount / baseValue) * 100 : 0;
    return { amount, pct };
  }

  private getCategoryTotals(): Record<string, number> {
    return this.portfolioPositions.reduce((acc, pos) => {
      acc[pos.category] = (acc[pos.category] ?? 0) + pos.total;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateRiskScore(categoryTotals: Record<string, number>, totalValue: number): number {
    if (totalValue === 0) {
      return 0;
    }
    const cryptoWeight = (categoryTotals['Cripto'] ?? 0) / totalValue;
    const innovationWeight = (categoryTotals['Tecnología Innovación'] ?? 0) / totalValue;
    const equitiesWeight = (categoryTotals['Acciones USA'] ?? 0) / totalValue;
    const baseScore = 4;
    const score = baseScore + cryptoWeight * 3 + innovationWeight * 2 + equitiesWeight * 1.2;
    return Number(score.toFixed(1));
  }

  private getRiskLabel(score: number): string {
    if (score < 4.5) {
      return 'Bajo';
    }
    if (score < 6.5) {
      return 'Moderado';
    }
    return 'Alto';
  }

  private buildAllocationDataset(categoryTotals: Record<string, number>, totalValue: number) {
    const labels = Object.keys(categoryTotals);
    const data = labels.map(label => {
      const percentage = totalValue > 0 ? (categoryTotals[label] / totalValue) * 100 : 0;
      return Number(percentage.toFixed(1));
    });
    const backgroundColor = labels.map(label => this.categoryColors[label] ?? 'rgba(148, 163, 184, 0.8)');

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 0
        }
      ]
    };
  }

  private buildPositionForm(): FormGroup {
    return this.fb.group({
      ticker: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: [this.categories[0], Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      averagePrice: [null, [Validators.required, Validators.min(1)]],
      price: [null, [Validators.required, Validators.min(1)]]
    });
  }

  private getBadgeClassForCategory(category: string): string {
    const map: Record<string, string> = {
      'Acciones USA': 'bg-blue-500/20 text-blue-400',
      'Tecnología Innovación': 'bg-purple-500/20 text-purple-300',
      'Cripto': 'bg-orange-500/20 text-orange-300',
      'Bonos Globales': 'bg-green-500/20 text-green-300',
      'Real Estate': 'bg-amber-500/20 text-amber-300'
    };
    return map[category] ?? 'bg-slate-500/20 text-slate-200';
  }
}

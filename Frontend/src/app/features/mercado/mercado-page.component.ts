import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';

@Component({
  selector: 'app-mercado-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, ChartComponent],
  templateUrl: './mercado-page.component.html',
  styleUrl: './mercado-page.component.scss'
})
export class MercadoPageComponent {
  isUSD = true;
  ranges = ['1H', '4H', '1D', '1W', '1M', '3M', '1Y', 'ALL'];
  selectedRange = '1D';

  toggleCurrency() {
    this.isUSD = !this.isUSD;
  }

  setRange(range: string) {
    this.selectedRange = range;
  }

  assets = [
    {
      symbol: 'AAPL',
      price: '$175.50',
      change: '+2.4%',
      pnl: '+$450,000',
      value: '$18,750,000'
    },
    {
      symbol: 'MSFT',
      price: '$380.25',
      change: '+1.8%',
      pnl: '+$270,000',
      value: '$15,000,000'
    },
    {
      symbol: 'BTC-USD',
      price: '$67,250',
      change: '-0.8%',
      pnl: '-$100,000',
      value: '$12,500,000'
    },
    {
      symbol: 'TSLA',
      price: '$238.75',
      change: '+3.2%',
      pnl: '+$400,000',
      value: '$12,500,000'
    },
    {
      symbol: 'ETH-USD',
      price: '$2,450',
      change: '+0.3%',
      pnl: '+$30,000',
      value: '$10,000,000'
    }
  ];

  watchlist: string[] = [];

  toggleWatchlist(): void {
    const allInWatchlist = this.assets.every(asset => this.watchlist.includes(asset.symbol));
    
    if (allInWatchlist) {
      // Remove all assets from watchlist
      this.assets.forEach(asset => {
        const index = this.watchlist.indexOf(asset.symbol);
        if (index > -1) {
          this.watchlist.splice(index, 1);
        }
      });
    } else {
      // Add all assets to watchlist
      this.assets.forEach(asset => {
        if (!this.watchlist.includes(asset.symbol)) {
          this.watchlist.push(asset.symbol);
        }
      });
    }
    
    console.log('Watchlist actualizada:', this.watchlist);
  }

  toggleAssetWatchlist(symbol: string): void {
    const index = this.watchlist.indexOf(symbol);
    if (index > -1) {
      this.watchlist.splice(index, 1);
      console.log(`${symbol} removido de watchlist`);
    } else {
      this.watchlist.push(symbol);
      console.log(`${symbol} agregado a watchlist`);
    }
  }

  getWatchlistButtonText(): string {
    const allInWatchlist = this.assets.every(asset => this.watchlist.includes(asset.symbol));
    return allInWatchlist ? '- Quitar todo de Watchlist' : '+ Agregar todo a Watchlist';
  }

  isInWatchlist(symbol: string): boolean {
    return this.watchlist.includes(symbol);
  }

  getWatchlistCount(): number {
    return this.watchlist.length;
  }

  btcData = {
    labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
    datasets: [
      {
        label: 'BTC-USD',
        data: [44200, 44500, 44800, 44600, 44900, 45100, 45000, 45250],
        borderColor: 'rgba(251, 191, 36, 1)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(251, 191, 36, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }
    ]
  };

  btcChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      }
    }
  };
}

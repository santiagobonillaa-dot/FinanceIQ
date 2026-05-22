import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PortfolioPosition {
  ticker: string;
  name: string;
  initials: string;
  price: number;
  averagePrice: number;
  quantity: number;
  dailyChangePct: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  total: number;
  category: string;
  badgeClass: string;
  ytdReturnPct: number;
}

const DEFAULT_POSITIONS: PortfolioPosition[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    initials: 'AP',
    price: 185000,
    averagePrice: 172000,
    quantity: 50,
    dailyChangePct: 1.2,
    dailyPnL: 220000,
    weeklyPnL: 580000,
    monthlyPnL: 1200000,
    total: 14500000,
    category: 'Acciones USA',
    badgeClass: 'bg-blue-500/20 text-blue-400',
    ytdReturnPct: 15.3
  },
  {
    ticker: 'BTC-USD',
    name: 'Bitcoin',
    initials: 'BT',
    price: 171500000,
    averagePrice: 164200000,
    quantity: 0.08,
    dailyChangePct: -0.6,
    dailyPnL: -120000,
    weeklyPnL: -80000,
    monthlyPnL: 320000,
    total: 13200000,
    category: 'Cripto',
    badgeClass: 'bg-orange-500/20 text-orange-300',
    ytdReturnPct: 28.4
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Motors',
    initials: 'TS',
    price: 923000,
    averagePrice: 888000,
    quantity: 14,
    dailyChangePct: 2.6,
    dailyPnL: 410000,
    weeklyPnL: 780000,
    monthlyPnL: 1650000,
    total: 12300000,
    category: 'Tecnología Innovación',
    badgeClass: 'bg-pink-500/20 text-pink-300',
    ytdReturnPct: 18.5
  },
  {
    ticker: 'ETH-USD',
    name: 'Ethereum',
    initials: 'ET',
    price: 9200000,
    averagePrice: 8650000,
    quantity: 1.1,
    dailyChangePct: 0.3,
    dailyPnL: 90000,
    weeklyPnL: 210000,
    monthlyPnL: 520000,
    total: 9800000,
    category: 'Cripto',
    badgeClass: 'bg-teal-500/20 text-teal-300',
    ytdReturnPct: 22.7
  },
  {
    ticker: 'BND',
    name: 'Vanguard Bonos Globales',
    initials: 'BD',
    price: 128000,
    averagePrice: 125000,
    quantity: 65,
    dailyChangePct: 0.4,
    dailyPnL: 60000,
    weeklyPnL: 125000,
    monthlyPnL: 280000,
    total: 8400000,
    category: 'Bonos Globales',
    badgeClass: 'bg-green-500/20 text-green-300',
    ytdReturnPct: 5.2
  },
  {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate',
    initials: 'RE',
    price: 382000,
    averagePrice: 371000,
    quantity: 20,
    dailyChangePct: 0.8,
    dailyPnL: 40000,
    weeklyPnL: 150000,
    monthlyPnL: 430000,
    total: 7600000,
    category: 'Real Estate',
    badgeClass: 'bg-amber-500/20 text-amber-300',
    ytdReturnPct: 8.7
  }
];

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private positionsSubject = new BehaviorSubject<PortfolioPosition[]>(DEFAULT_POSITIONS);
  positions$: Observable<PortfolioPosition[]> = this.positionsSubject.asObservable();

  getPositions(): PortfolioPosition[] {
    return this.positionsSubject.getValue();
  }

  setPositions(positions: PortfolioPosition[]): void {
    this.positionsSubject.next(positions);
  }

  addPosition(position: PortfolioPosition): void {
    const current = this.getPositions();
    this.setPositions([position, ...current]);
  }

  getTotalValue(): number {
    return this.getPositions().reduce((sum, pos) => sum + pos.total, 0);
  }

  getDailyGain(): number {
    return this.getPositions().reduce((sum, pos) => sum + pos.dailyPnL, 0);
  }

  getAverageReturn(): number {
    const positions = this.getPositions();
    if (positions.length === 0) return 0;
    return positions.reduce((sum, pos) => sum + pos.ytdReturnPct, 0) / positions.length;
  }
}

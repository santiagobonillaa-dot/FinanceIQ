import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Debt {
  _id: string;
  userId: string;
  name: string;
  creditor: {
    name: string;
    type: string;
    contact: {
      phone?: string;
      email?: string;
      website?: string;
      address?: string;
    };
  };
  originalAmount: number;
  currentBalance: number;
  currency: string;
  interestRate: {
    annual: number;
    type: string;
    compoundingFrequency: string;
  };
  paymentSchedule: {
    frequency: string;
    dayOfMonth: number;
    paymentAmount: number;
    startDate: Date;
    nextPaymentDate: Date;
    endDate?: Date;
  };
  loanDetails: {
    type: string;
    term: number;
    purpose?: string;
    collateral?: string;
    interestOnlyPeriod?: number;
    gracePeriod?: number;
  };
  amortizationType: string;
  priority: string;
  insurance: {
    hasInsurance: boolean;
    monthlyPremium: number;
    coverageAmount: number;
  };
  fees: {
    originationFee: number;
    prepaymentPenalty: number;
    latePaymentFee: number;
    annualFee: number;
  };
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    amountPaidManual?: number;
    originalAmount?: number;
    amountPaidUpdatedAt?: Date | string;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  private apiUrl = environment.apiUrl;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  createDebt(debtData: Partial<Debt>): Observable<any> {
    return this.http.post(`${this.apiUrl}/debts`, debtData, {
      headers: this.getAuthHeaders()
    });
  }

  getDebts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/debts`, {
      headers: this.getAuthHeaders()
    });
  }

  getDebt(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/debts/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  updateDebt(id: string, debtData: Partial<Debt>): Observable<any> {
    return this.http.put(`${this.apiUrl}/debts/${id}`, debtData, {
      headers: this.getAuthHeaders()
    });
  }

  deleteDebt(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/debts/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getActiveDebts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/debts/active`, {
      headers: this.getAuthHeaders()
    });
  }

  getDebtSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/debts/summary`, {
      headers: this.getAuthHeaders()
    });
  }

  makePayment(id: string, paymentData: { amount: number; method?: string; notes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/debts/${id}/payment`, paymentData, {
      headers: this.getAuthHeaders()
    });
  }

  getAmortizationSchedule(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/debts/${id}/amortization-schedule`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  calculatePrepaymentImpact(id: string, extraAmount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/debts/${id}/prepayment-impact`, { extraAmount }, {
      headers: this.getAuthHeaders()
    });
  }

  updateDebtStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/debts/${id}/status`, { status }, {
      headers: this.getAuthHeaders()
    });
  }

  getDebtAnalysis(): Observable<any> {
    return this.http.get(`${this.apiUrl}/debts/analytics/by-type`, {
      headers: this.getAuthHeaders()
    });
  }

  getOverdueDebts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/debts/overdue`, {
      headers: this.getAuthHeaders()
    });
  }

  getDebtForecast(months: number = 12): Observable<any> {
    return this.http.get(`${this.apiUrl}/debts/forecast?months=${months}`, {
      headers: this.getAuthHeaders()
    });
  }
}

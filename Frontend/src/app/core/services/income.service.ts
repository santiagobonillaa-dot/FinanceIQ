import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Income {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  type: string;
  category: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  priority: string;
  isTaxable: boolean;
  paymentMethod: string;
  tags: string[];
  isActive: boolean;
  recurringSettings: {
    autoDeposit: boolean;
    reminderDays: number;
    maxOccurrences?: number;
    occurrenceCount: number;
  };
  averageMonthlyAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
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

  createIncome(incomeData: Partial<Income>): Observable<any> {
    return this.http.post(`${this.apiUrl}/incomes`, incomeData, {
      headers: this.getAuthHeaders()
    });
  }

  getIncomes(): Observable<any> {
    // Temporalmente usar endpoint de prueba sin autenticación
    return this.http.get(`${this.apiUrl}/incomes/test`);
  }

  getIncome(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/incomes/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  updateIncome(id: string, incomeData: Partial<Income>): Observable<any> {
    return this.http.put(`${this.apiUrl}/incomes/${id}`, incomeData, {
      headers: this.getAuthHeaders()
    });
  }

  deleteIncome(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/incomes/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getActiveIncomes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/incomes/active`, {
      headers: this.getAuthHeaders()
    });
  }

  getIncomeSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/incomes/summary`, {
      headers: this.getAuthHeaders()
    });
  }

  getIncomeByType(): Observable<any> {
    return this.http.get(`${this.apiUrl}/incomes/analytics/by-type`, {
      headers: this.getAuthHeaders()
    });
  }

  getIncomeByCategory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/incomes/analytics/by-category`, {
      headers: this.getAuthHeaders()
    });
  }

  getIncomeForecast(months: number = 12): Observable<any> {
    return this.http.get(`${this.apiUrl}/incomes/forecast?months=${months}`, {
      headers: this.getAuthHeaders()
    });
  }

  getIncomeTrends(period: string = '6m'): Observable<any> {
    return this.http.get(`${this.apiUrl}/incomes/trends?period=${period}`, {
      headers: this.getAuthHeaders()
    });
  }
}

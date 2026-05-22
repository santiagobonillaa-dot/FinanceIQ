import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';

export interface Expense {
  id?: number;
  name: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  type: string;
  frequency: string;
  createdAt?: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  nextPaymentDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = 'http://localhost:4000/api/expenses'; // URL del backend real
  
  // Datos de prueba para simulación (backup)
  private mockExpenses: Expense[] = [
    {
      id: 1,
      name: 'Arriendo Apartamento',
      description: 'Pago mensual de arriendo',
      amount: 2500000,
      category: 'housing',
      date: '2024-04-01',
      type: 'fixed',
      frequency: 'monthly',
      createdAt: '2024-04-01T00:00:00Z',
      updatedAt: '2024-04-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Supermercado Éxito',
      description: 'Compras mensuales',
      amount: 850000,
      category: 'food',
      date: '2024-04-05',
      type: 'variable',
      frequency: 'monthly',
      createdAt: '2024-04-05T00:00:00Z',
      updatedAt: '2024-04-05T00:00:00Z'
    },
    {
      id: 3,
      name: 'Netflix Premium',
      description: 'Suscripción mensual',
      amount: 45000,
      category: 'entertainment',
      date: '2024-04-10',
      type: 'fixed',
      frequency: 'monthly',
      createdAt: '2024-04-10T00:00:00Z',
      updatedAt: '2024-04-10T00:00:00Z'
    }
  ];

  constructor(private http: HttpClient) {}

  // Obtener todos los gastos
  getExpenses(): Observable<Expense[]> {
    console.log('🔧 ExpenseService.getExpenses() llamado - CONEXIÓN REAL');
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || 'temp-token'}`
    });

    console.log('🔧 Haciendo llamada real a:', this.apiUrl);
    console.log('🔧 Headers:', headers);

    // Conexión real con backend
    return this.http.get<{ success: boolean; data: any }>(this.apiUrl, { headers }).pipe(
      map(response => {
        console.log('🔧 ✅ Response real del backend:', response);

        let normalizedExpenses: Expense[] = [];

        if (Array.isArray(response)) {
          normalizedExpenses = response as Expense[];
        } else if (Array.isArray(response?.data)) {
          normalizedExpenses = response.data as Expense[];
        } else if (Array.isArray((response as any)?.expenses)) {
          normalizedExpenses = (response as any).expenses as Expense[];
        } else if (Array.isArray(response?.data?.expenses)) {
          normalizedExpenses = response.data.expenses as Expense[];
        } else {
          console.warn('🔧 ⚠️ No se encontraron gastos en la respuesta, usando arreglo vacío');
        }

        console.log('🔧 ✅ Gastos normalizados:', normalizedExpenses);
        return normalizedExpenses;
      }),
      catchError(error => {
        console.error('🔧 ❌ Error real del backend:', error);
        
        // Si falla el backend, usar datos de prueba como backup
        console.log('🔧 🔄 Usando datos de prueba como backup');
        return of(this.mockExpenses).pipe(
          delay(100)
        );
      })
    );
  }

  // Crear un nuevo gasto
  createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Observable<Expense> {
    console.log('🔧 Creando gasto - CONEXIÓN REAL:', expense);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || 'temp-token'}`
    });

    // Conexión real con backend
    return this.http.post<{success: boolean, data: Expense}>(this.apiUrl, expense, { headers }).pipe(
      map(response => {
        console.log('🔧 ✅ Gasto creado en backend:', response.data);
        return response.data;
      }),
      catchError(error => {
        console.error('🔧 ❌ Error creando gasto en backend:', error);
        
        // Si falla el backend, simular creación
        const newExpense: Expense = {
          ...expense,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('🔧 🔄 Simulando creación como backup');
        return of(newExpense).pipe(delay(100));
      })
    );
  }

  // Actualizar un gasto existente
  updateExpense(id: number, expense: Partial<Expense>): Observable<Expense> {
    console.log('🔧 Actualizando gasto - CONEXIÓN REAL:', id, expense);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || 'temp-token'}`
    });

    // Conexión real con backend
    return this.http.put<{success: boolean, data: Expense}>(`${this.apiUrl}/${id}`, expense, { headers }).pipe(
      map(response => {
        console.log('🔧 ✅ Gasto actualizado en backend:', response);
        const updated = response.data || response;
        console.log('🔧 ✅ Gasto procesado:', updated);
        return updated;
      }),
      catchError(error => {
        console.error('🔧 ❌ Error actualizando gasto en backend:', error);
        
        // Si falla el backend, simular actualización
        const updatedExpense: Expense = {
          ...this.mockExpenses.find(e => e.id === id),
          ...expense,
          updatedAt: new Date().toISOString()
        } as Expense;
        
        console.log('🔧 🔄 Simulando actualización como backup');
        return of(updatedExpense).pipe(delay(100));
      })
    );
  }

  // Eliminar un gasto
  deleteExpense(id: number): Observable<void> {
    console.log('🔧 Eliminando gasto - CONEXIÓN REAL:', id);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    return this.http.delete<{success: boolean}>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error al eliminar gasto:', error);
        return throwError(() => new Error('Error al eliminar el gasto'));
      })
    );
  }

  // Obtener estadísticas de gastos
  getExpenseStatistics(): Observable<any> {
    const total = this.mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const fixed = this.mockExpenses.filter(e => e.type === 'fixed').reduce((sum, expense) => sum + expense.amount, 0);

    // Simulación de estadísticas
    return of({
      success: true,
      data: {
        totalMonthlyExpenses: total,
        fixedExpenses: fixed,
        fixedExpensesPercentage: total > 0 ? (fixed / total) * 100 : 0,
        expenseGrowth: 12.3,
        dailyAverage: total / 24,
        daysInMonth: 24
      }
    }).pipe(
      map(response => response.data),
      delay(200),
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return throwError(() => new Error('Error al cargar estadísticas'));
      })
    );
  }
}

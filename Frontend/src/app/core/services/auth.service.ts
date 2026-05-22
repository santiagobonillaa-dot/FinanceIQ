import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // Registro de usuario
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  // Login de usuario
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  // Verificación de token
  verifyToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return new Observable(observer => {
        observer.error({ success: false, message: 'No hay token' });
        observer.complete();
      });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/verify`, { headers }).pipe(
      tap((response: any) => {
        if (response && response.success && response.data) {
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Obtener token actual
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Obtener headers de autenticación
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Métodos privados
  private setSession(authData: { user: User; token: string }): void {
    localStorage.setItem(this.tokenKey, authData.token);
    this.currentUserSubject.next(authData.user);
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    if (token) {
      // Opcional: verificar token con el backend
      this.verifyToken().subscribe({
        next: () => {},
        error: () => {
          // Si el token es inválido, limpiar storage
          this.logout();
        }
      });
    }
  }

  // Obtener usuario actual
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
}

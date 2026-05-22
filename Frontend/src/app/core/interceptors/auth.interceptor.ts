import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next, authService?: AuthService) => {
  // Solo agregar headers a requests a nuestra API
  if (req.url.startsWith(environment.apiUrl)) {
    const token = localStorage.getItem('auth_token');
    const authHeaders = req.headers.set('Authorization', token ? `Bearer ${token}` : '');
    
    // Clonar el request con los headers de autenticación
    const authReq = req.clone({
      headers: authHeaders
    });

    return next(authReq);
  }

  // Para otros requests, dejarlos pasar sin modificar
  return next(req);
};

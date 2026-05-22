import { Injectable, NgZone } from '@angular/core';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private ngZone: NgZone) {}

  showSuccess(message: string, duration: number = 3000): void {
    this.ngZone.run(() => {
      this.showNotification(message, 'success', duration);
    });
  }

  showError(message: string, duration: number = 5000): void {
    this.ngZone.run(() => {
      this.showNotification(message, 'error', duration);
    });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.ngZone.run(() => {
      this.showNotification(message, 'warning', duration);
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.ngZone.run(() => {
      this.showNotification(message, 'info', duration);
    });
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info', duration: number): void {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          ${this.getIcon(type)}
        </div>
        <div class="notification-message">
          ${message}
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
      </div>
    `;

    // Añadir estilos
    const style = document.createElement('style');
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 400px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
        background: white;
        border-left: 4px solid;
      }

      .notification-success {
        border-left-color: #28a745;
        background: linear-gradient(135deg, #d4edda 0%, #ffffff 100%);
      }

      .notification-error {
        border-left-color: #dc3545;
        background: linear-gradient(135deg, #f8d7da 0%, #ffffff 100%);
      }

      .notification-warning {
        border-left-color: #ffc107;
        background: linear-gradient(135deg, #fff3cd 0%, #ffffff 100%);
      }

      .notification-info {
        border-left-color: #17a2b8;
        background: linear-gradient(135deg, #d1ecf1 0%, #ffffff 100%);
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .notification-icon {
        font-size: 20px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: white;
      }

      .notification-success .notification-icon {
        background-color: #28a745;
      }

      .notification-error .notification-icon {
        background-color: #dc3545;
      }

      .notification-warning .notification-icon {
        background-color: #ffc107;
        color: #212529;
      }

      .notification-info .notification-icon {
        background-color: #17a2b8;
      }

      .notification-message {
        flex: 1;
        font-size: 14px;
        color: #333;
        line-height: 1.4;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .notification-close:hover {
        background-color: #f8f9fa;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .notification.removing {
        animation: slideOut 0.3s ease-in forwards;
      }
    `;

    document.head.appendChild(style);

    // Añadir al DOM
    document.body.appendChild(notification);

    // Auto-eliminar después del tiempo especificado
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('removing');
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, duration);

    // Eliminar manualmente
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        notification.classList.add('removing');
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      });
    }
  }

  private getIcon(type: 'success' | 'error' | 'warning' | 'info'): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }
}

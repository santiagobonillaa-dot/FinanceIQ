import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';

export interface DateTimeInfo {
  currentDate: Date;
  currentTime: string;
  currentDateFormatted: string;
  sessionStartTime: Date;
  sessionDuration: string;
  dayOfWeek: string;
  month: string;
  year: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class RealTimeService {
  private sessionStartTime: Date = new Date();
  private currentDateTime = new BehaviorSubject<DateTimeInfo>(this.getDateTimeInfo());
  
  constructor() {
    // Actualizar cada segundo
    interval(1000)
      .pipe(startWith(0))
      .subscribe(() => {
        this.currentDateTime.next(this.getDateTimeInfo());
      });
  }

  private getDateTimeInfo(): DateTimeInfo {
    const now = new Date();
    const sessionDuration = now.getTime() - this.sessionStartTime.getTime();
    
    return {
      currentDate: now,
      currentTime: this.formatTime(now),
      currentDateFormatted: this.formatDate(now),
      sessionStartTime: this.sessionStartTime,
      sessionDuration: this.formatDuration(sessionDuration),
      dayOfWeek: this.getDayOfWeek(now),
      month: this.getMonth(now),
      year: now.getFullYear(),
      day: now.getDate(),
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds()
    };
  }

  getDateTime(): Observable<DateTimeInfo> {
    return this.currentDateTime.asObservable();
  }

  getCurrentDateTime(): DateTimeInfo {
    return this.currentDateTime.value;
  }

  resetSession(): void {
    this.sessionStartTime = new Date();
    this.currentDateTime.next(this.getDateTimeInfo());
  }

  getSessionStartTime(): Date {
    return this.sessionStartTime;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-CO', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private getDayOfWeek(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  private getMonth(date: Date): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[date.getMonth()];
  }

  // Métodos adicionales para formateo específico
  getShortDate(): string {
    const now = this.currentDateTime.value.currentDate;
    return now.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getGreeting(): string {
    const hour = this.currentDateTime.value.hours;
    if (hour < 12) {
      return 'Buenos días ☀️';
    } else if (hour < 18) {
      return 'Buenas tardes 🌅';
    } else {
      return 'Buenas noches 🌙';
    }
  }

  getTimeUntil(targetHour: number, targetMinute: number = 0): string {
    const now = this.currentDateTime.value.currentDate;
    const target = new Date(now);
    target.setHours(targetHour, targetMinute, 0, 0);
    
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    const diff = target.getTime() - now.getTime();
    return this.formatDuration(diff);
  }
}

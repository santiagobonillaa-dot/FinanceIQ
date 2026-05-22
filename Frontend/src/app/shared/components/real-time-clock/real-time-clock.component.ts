import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RealTimeService, DateTimeInfo } from '../../../core/services/real-time.service';

@Component({
  selector: 'app-real-time-clock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './real-time-clock.component.html',
  styleUrls: ['./real-time-clock.component.scss']
})
export class RealTimeClockComponent implements OnInit, OnDestroy {
  dateTimeInfo: DateTimeInfo | null = null;
  greeting = '';
  private subscription: Subscription | null = null;

  constructor(private realTimeService: RealTimeService) {}

  ngOnInit(): void {
    this.subscription = this.realTimeService.getDateTime().subscribe((dateTimeInfo: DateTimeInfo) => {
      this.dateTimeInfo = dateTimeInfo;
      this.greeting = this.realTimeService.getGreeting();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Métodos para formateo específico
  getAnimatedSeconds(): number[] {
    if (!this.dateTimeInfo) return [];
    return Array.from({ length: this.dateTimeInfo.seconds + 1 }, (_, i) => i);
  }

  getProgressPercentage(): number {
    if (!this.dateTimeInfo) return 0;
    return (this.dateTimeInfo.seconds / 60) * 100;
  }

  getDayProgress(): number {
    if (!this.dateTimeInfo) return 0;
    const totalMinutesInDay = 24 * 60;
    const currentMinutes = this.dateTimeInfo.hours * 60 + this.dateTimeInfo.minutes;
    return (currentMinutes / totalMinutesInDay) * 100;
  }
}

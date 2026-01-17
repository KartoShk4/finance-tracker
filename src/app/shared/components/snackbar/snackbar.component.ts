import { Component, Input, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackbarService } from './snackbar.service';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

/**
 * Компонент Snackbar для базовых уведомлений
 * Используется для показа кратких сообщений пользователю
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.scss',
})
export class SnackbarComponent implements OnInit, OnDestroy {
  private snackbarService = inject(SnackbarService);

  @Input() message = signal<string>('');
  @Input() type = signal<SnackbarType>('info');
  @Input() duration = signal<number>(3000);
  @Input() showClose = signal<boolean>(true);

  isVisible = signal<boolean>(false);
  private timeoutId: number | null = null;

  ngOnInit(): void {
    // Регистрируем компонент в сервисе
    this.snackbarService.register({
      show: (msg: string, type: SnackbarType, duration?: number) => {
        this.show(msg, type, duration);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
  }

  getIcon(): string {
    switch (this.type()) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }

  show(msg: string, type: SnackbarType = 'info', duration?: number): void {
    this.message.set(msg);
    this.type.set(type);
    if (duration !== undefined) {
      this.duration.set(duration);
    }
    this.isVisible.set(true);

    // Автоматически скрываем через указанное время
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    if (this.duration() > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.close();
      }, this.duration());
    }
  }

  close(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isVisible.set(false);
  }
}


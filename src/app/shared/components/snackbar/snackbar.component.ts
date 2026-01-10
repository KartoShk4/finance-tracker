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
  template: `
    <div 
      *ngIf="isVisible()" 
      class="snackbar"
      [class.success]="type() === 'success'"
      [class.error]="type() === 'error'"
      [class.info]="type() === 'info'"
      [class.warning]="type() === 'warning'">
      <span class="snackbar-icon">{{ getIcon() }}</span>
      <span class="snackbar-message">{{ message() }}</span>
      <button 
        *ngIf="showClose()"
        class="snackbar-close"
        (click)="close()"
        aria-label="Закрыть">
        ×
      </button>
    </div>
  `,
  styles: [`
    .snackbar {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-md) var(--space-lg);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      max-width: 90%;
      min-width: 300px;
      z-index: 10000;
      animation: slideUp 0.3s ease-out;
      font-size: 0.875rem;
    }

    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }

    .snackbar.success {
      border-color: rgba(16, 185, 129, 0.5);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
    }

    .snackbar.error {
      border-color: rgba(239, 68, 68, 0.5);
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
    }

    .snackbar.info {
      border-color: rgba(59, 130, 246, 0.5);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
    }

    .snackbar.warning {
      border-color: rgba(245, 158, 11, 0.5);
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
    }

    .snackbar-icon {
      font-size: 1.25rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .snackbar-message {
      flex: 1;
      color: var(--color-text-primary);
      line-height: 1.5;
    }

    .snackbar-close {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
      flex-shrink: 0;
      
      &:hover {
        background-color: var(--color-bg-secondary);
        color: var(--color-text-primary);
      }
    }

    @media (max-width: 480px) {
      .snackbar {
        bottom: 16px;
        left: 16px;
        right: 16px;
        transform: none;
        max-width: none;
        min-width: auto;
        padding: var(--space-sm) var(--space-md);
        font-size: 0.8125rem;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    }
  `]
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


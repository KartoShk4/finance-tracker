import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Страница обработки callback после OAuth авторизации
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-callback-page">
      <div class="auth-callback-content">
        <div *ngIf="!error" class="spinner"></div>
        <p *ngIf="!error">Завершение авторизации...</p>
        <div *ngIf="error" class="error-message">
          <p>Ошибка авторизации: {{ error }}</p>
          <button (click)="goHome()" class="error-button">Вернуться на главную</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-callback-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: var(--color-bg-primary, #f5f5f5);
    }

    .auth-callback-content {
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(99, 102, 241, 0.1);
      border-top-color: var(--color-primary, #6366f1);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    p {
      color: var(--color-text-secondary, #666);
      font-size: 0.9375rem;
    }

    .error-message {
      color: var(--color-expense, #ef4444);
    }

    .error-button {
      margin-top: var(--space-md);
      padding: var(--space-sm) var(--space-lg);
      background-color: var(--color-primary, #6366f1);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 0.875rem;
    }
  `]
})
export class AuthCallbackPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  error: string | null = null;

  async ngOnInit(): Promise<void> {
    try {
      // Получаем параметры из URL
      const code = this.route.snapshot.queryParams['code'];
      const state = this.route.snapshot.queryParams['state'];
      const errorParam = this.route.snapshot.queryParams['error'];
      const errorDescription = this.route.snapshot.queryParams['error_description'];

      if (errorParam) {
        this.error = errorDescription || errorParam;
        return;
      }

      if (!code || !state) {
        this.error = 'Отсутствуют необходимые параметры авторизации';
        return;
      }

      await this.authService.handleAuthCallback(code, state);
      
      // Перенаправляем на главную страницу после успешной авторизации
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    } catch (error: any) {
      console.error('Error in auth callback:', error);
      this.error = error.message || 'Произошла ошибка при авторизации';
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}


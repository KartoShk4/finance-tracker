import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Компонент футера приложения
 * Содержит информацию о приложении, ссылки и копирайт
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">Finance Tracker</h3>
          <p class="footer-description">
            Удобное приложение для отслеживания личных финансов. 
            Контролируйте доходы и расходы, анализируйте статистику.
          </p>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-section-title">Навигация</h4>
          <nav class="footer-nav">
            <a routerLink="/" routerLinkActive="active" (click)="scrollToTop()">Главная</a>
            <a routerLink="/history" routerLinkActive="active" (click)="scrollToTop()">История</a>
          </nav>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-section-title">Информация</h4>
          <div class="footer-info">
            <p>Версия: 1.0.0</p>
            <p>Авторизация через VK ID</p>
          </div>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-section-title">Технологии</h4>
          <div class="footer-tech">
            <span>Angular</span>
            <span>Supabase</span>
            <span>TypeScript</span>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p class="footer-copyright">
          © {{ currentYear }} Finance Tracker. Все права защищены.
        </p>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: var(--color-bg-card);
      border-top: 1px solid var(--color-border);
      padding: var(--space-2xl) var(--space-md);
      margin-top: auto;
    }

    .footer-content {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-xl);
      margin-bottom: var(--space-xl);
    }

    .footer-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .footer-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .footer-description {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    .footer-section-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      margin-bottom: var(--space-xs);
    }

    .footer-nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .footer-nav a {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: color var(--transition-fast);
      padding: var(--space-xs) 0;
      
      &:hover {
        color: var(--color-primary);
      }
      
      &.active {
        color: var(--color-primary);
        font-weight: 500;
      }
    }

    .footer-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      
      p {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin: 0;
      }
    }

    .footer-tech {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
      
      span {
        padding: var(--space-xs) var(--space-sm);
        background-color: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        color: var(--color-text-secondary);
        font-weight: 500;
      }
    }

    .footer-bottom {
      max-width: 1400px;
      margin: 0 auto;
      padding-top: var(--space-xl);
      border-top: 1px solid var(--color-border);
      text-align: center;
    }

    .footer-copyright {
      font-size: 0.875rem;
      color: var(--color-text-tertiary);
      margin: 0;
    }

    /* Адаптивность */
    @media (max-width: 768px) {
      .app-footer {
        padding: var(--space-xl) var(--space-md);
      }

      .footer-content {
        grid-template-columns: 1fr;
        gap: var(--space-lg);
        margin-bottom: var(--space-lg);
      }

      .footer-nav {
        flex-direction: row;
        flex-wrap: wrap;
      }
    }

    @media (min-width: 2560px) {
      .footer-content {
        max-width: 2000px;
      }
    }

    @media (min-width: 3840px) {
      .footer-content {
        max-width: 2800px;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


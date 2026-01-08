import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HistoryStore } from '../../features/history/history.store';
import { HistoryEntry } from '../../features/history/history.model';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';

/**
 * Компонент страницы истории изменений
 * Отображает все действия пользователя (создание, удаление)
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, LocalDatePipe],
  template: `
    <div class="history-page">
      <div class="history-header">
        <a routerLink="/" class="back-button">← Назад</a>
        <h2>История изменений</h2>
        <button class="clear-button" (click)="clearHistory()">Очистить</button>
      </div>

      <div class="history-list">
        <div 
          *ngFor="let entry of history()"
          class="history-item"
          [class.created]="entry.action === 'created'"
          [class.deleted]="entry.action === 'deleted'">
          <div class="history-item-icon">
            <span *ngIf="entry.action === 'created'">+</span>
            <span *ngIf="entry.action === 'deleted'">×</span>
          </div>
          <div class="history-item-content">
            <div class="history-item-title">{{ entry.entityTitle }}</div>
            <div class="history-item-details">
              <span class="history-item-type">
                {{ entry.entityType === 'item' ? 'Категория' : 'Транзакция' }}
              </span>
              <span class="history-item-action">
                {{ entry.action === 'created' ? 'создана' : 'удалена' }}
              </span>
            </div>
            <div class="history-item-time">
              {{ entry.timestamp | localDate:'short' }}
            </div>
          </div>
        </div>

        <div *ngIf="history().length === 0" class="history-empty">
          <p>История пуста</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-page {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-md);
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      transition: color var(--transition-fast);
    }

    .back-button:hover {
      color: var(--color-text-primary);
    }

    .clear-button {
      padding: var(--space-sm) var(--space-md);
      background-color: var(--color-expense);
      color: white;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      transition: all var(--transition-fast);
    }

    .clear-button:hover {
      background-color: #dc2626;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .history-item {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-md);
      display: flex;
      gap: var(--space-md);
      align-items: flex-start;
      transition: all var(--transition-fast);
    }

    .history-item:hover {
      border-color: var(--color-border-hover);
      box-shadow: var(--shadow-sm);
    }

    .history-item.created {
      border-left: 3px solid var(--color-income);
    }

    .history-item.deleted {
      border-left: 3px solid var(--color-expense);
    }

    .history-item-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .history-item.created .history-item-icon {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--color-income);
    }

    .history-item.deleted .history-item-icon {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--color-expense);
    }

    .history-item-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .history-item-title {
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .history-item-details {
      display: flex;
      gap: var(--space-sm);
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .history-item-time {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
    }

    .history-empty {
      text-align: center;
      padding: var(--space-2xl);
      color: var(--color-text-tertiary);
    }

    @media (max-width: 768px) {
      .history-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class HistoryPage {
  private historyStore = inject(HistoryStore);

  /** История изменений */
  history = this.historyStore.history;

  /**
   * Очистка истории
   */
  clearHistory(): void {
    if (confirm('Вы уверены, что хотите очистить всю историю?')) {
      this.historyStore.clear();
    }
  }
}


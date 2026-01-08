import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HistoryStore } from '../../features/history/history.store';
import { HistoryEntry } from '../../features/history/history.model';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { ModalComponent } from '../../shared/components/modal/modal.component';

/**
 * Компонент страницы истории изменений
 * Отображает все действия пользователя (создание, удаление)
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, LocalDatePipe, ModalComponent],
  template: `
    <div class="history-page">
      <div class="history-header">
        <a routerLink="/" class="back-button">← Назад</a>
        <h2>История изменений</h2>
        <button class="clear-button" (click)="openClearHistoryModal()">Очистить</button>
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
            <div class="history-item-main">
              <span class="history-item-title">{{ entry.entityTitle }}</span>
              <span class="history-item-meta">
                {{ entry.entityType === 'item' ? 'Категория' : 'Транзакция' }} • 
                {{ entry.action === 'created' ? 'создана' : 'удалена' }} • 
                {{ entry.timestamp | localDate:'short' }}
              </span>
            </div>
          </div>
        </div>

        <div *ngIf="history().length === 0" class="history-empty">
          <p>История пуста</p>
        </div>
      </div>

      <!-- Модальное окно очистки истории -->
      <app-modal
        [isOpen]="showClearHistoryModal()"
        title="Очистка истории"
        [confirmDanger]="true"
        confirmText="Очистить"
        (confirm)="confirmClearHistory()"
        (closeEvent)="showClearHistoryModal.set(false)">
        <p>Вы уверены, что хотите очистить всю историю изменений?</p>
        <p style="color: var(--color-expense); margin-top: var(--space-md);">Это действие нельзя отменить.</p>
      </app-modal>
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
      padding: var(--space-sm) var(--space-md);
      display: flex;
      gap: var(--space-sm);
      align-items: center;
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
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
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
      min-width: 0;
    }

    .history-item-main {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      flex-wrap: wrap;
    }

    .history-item-title {
      font-weight: 500;
      color: var(--color-text-primary);
      font-size: 0.875rem;
    }

    .history-item-meta {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      white-space: nowrap;
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

  /** Состояние модального окна очистки истории */
  showClearHistoryModal = signal(false);

  /**
   * Открытие модального окна очистки истории
   */
  openClearHistoryModal(): void {
    this.showClearHistoryModal.set(true);
  }

  /**
   * Очистка истории
   */
  confirmClearHistory(): void {
    this.historyStore.clear();
    this.showClearHistoryModal.set(false);
  }
}


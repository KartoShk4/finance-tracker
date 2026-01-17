import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HistoryStore } from '../../features/history/history.store';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { ModalComponent } from '../../shared/components/modal/modal.component';

/**
 * Компонент страницы истории изменений
 * Отображает все действия пользователя (создание, удаление)
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, LocalDatePipe, ModalComponent],
  templateUrl: './history.page.html',
  styleUrl: './history.page.scss'
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


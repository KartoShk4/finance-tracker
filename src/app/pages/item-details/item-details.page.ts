import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ItemStore } from '../../features/items/item.store';
import { TransactionStore } from '../../features/transactions/transaction.store';
import { DateTimePickerComponent } from '../../shared/components/date-time-picker/date-time-picker.component';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { aggregateByPeriod, PeriodType } from '../../shared/utils/chart.utils';

/**
 * Компонент страницы деталей item
 * Отображает транзакции для конкретной категории и график
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DateTimePickerComponent, LocalDatePipe, ChartComponent],
  templateUrl: './item-details.page.html',
  styleUrls: ['./item-details.page.scss']
})
export class ItemDetailsPage {
  private route = inject(ActivatedRoute);
  private txStore = inject(TransactionStore);
  private itemStore = inject(ItemStore);

  /** ID текущего item из параметров маршрута */
  itemId = this.route.snapshot.paramMap.get('id')!;

  /** Сумма для новой транзакции */
  amount = 0;

  /** Дата и время транзакции */
  transactionDate: string = new Date().toISOString();

  /** Примечание к транзакции */
  notes = '';

  /** Выбранный период для графика */
  selectedPeriod = signal<PeriodType>('day');

  /** Текущая категория */
  currentItem = computed(() => {
    return this.itemStore.items().find(item => item.id === this.itemId);
  });

  /** Тип транзакции берется из категории */
  get transactionType(): 'income' | 'expense' {
    return this.currentItem()?.category || 'income';
  }

  /** Транзакции для текущего item */
  transactions = this.txStore.byItem(this.itemId);

  /** Данные для графика, агрегированные по выбранному периоду */
  chartData = computed(() => {
    const transactions = this.transactions();
    if (transactions.length === 0) {
      return { labels: [], data: [] };
    }
    return aggregateByPeriod(transactions, this.selectedPeriod());
  });

  /**
   * Добавление новой транзакции
   * Тип транзакции автоматически берется из категории
   */
  async addTransaction(): Promise<void> {
    if (this.amount <= 0) return;
    
    const item = this.currentItem();
    if (!item) return;

    // Тип транзакции соответствует типу категории
    const type = item.category;

    // Добавляем транзакцию с выбранной датой и примечанием, получаем дельту (изменение суммы)
    const delta = await this.txStore.add(this.itemId, type, this.amount, this.transactionDate, this.notes);
    
    // Обновляем общую сумму item
    await this.itemStore.applyDelta(this.itemId, delta);
    
    // Сбрасываем форму
    this.amount = 0;
    this.transactionDate = new Date().toISOString();
    this.notes = '';
  }

  /**
   * Удаление транзакции
   * @param id - ID транзакции
   */
  async deleteTransaction(id: string): Promise<void> {
    // Удаляем транзакцию и получаем дельту для отката изменений
    const delta = await this.txStore.delete(id);
    
    // Обновляем общую сумму item (откатываем изменения)
    await this.itemStore.applyDelta(this.itemId, delta);
  }
}

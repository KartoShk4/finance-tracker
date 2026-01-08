import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemStore } from '../../features/items/item.store';
import { TransactionStore } from '../../features/transactions/transaction.store';
import { PieChartComponent } from '../../shared/components/pie-chart/pie-chart.component';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { PeriodType } from '../../shared/utils/chart.utils';

/**
 * Компонент главной страницы
 * Отображает список всех категорий (items) и форму для создания новых
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, PieChartComponent, LocalDatePipe],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  private itemStore = inject(ItemStore);
  private txStore = inject(TransactionStore);
  private router = inject(Router);

  /** Название новой категории */
  title = '';
  
  /** Тип категории (доход/расход) */
  category: 'income' | 'expense' = 'income';

  /** Список всех категорий */
  items = this.itemStore.items;

  /** Все транзакции */
  allTransactions = this.txStore.all;

  /** Общая статистика доходов и расходов */
  statistics = computed(() => {
    const transactions = this.filterByPeriod(this.allTransactions(), this.selectedPeriod());
    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });

    return { income, expense };
  });

  /** Выбранный период для общей статистики */
  selectedPeriod = signal<PeriodType>('month');

  /** Доступные периоды для переключения */
  readonly periods: { value: PeriodType; label: string }[] = [
    { value: 'day', label: 'День' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'year', label: 'Год' }
  ];

  /** Состояние мобильного аккордеона для графика */
  showMobileChart = false;

  toggleMobileChart(): void {
    this.showMobileChart = !this.showMobileChart;
  }

  /**
   * Создание новой категории
   */
  add(): void {
    if (!this.title.trim()) return;
    
    this.itemStore.create(this.title.trim(), this.category);
    this.title = '';
  }

  /**
   * Переход на страницу деталей категории
   * @param id - ID категории
   */
  open(id: string): void {
    this.router.navigate(['/item', id]);
  }

  /**
   * Удаление категории
   * @param id - ID категории
   * @param event - событие клика (для предотвращения всплытия)
   */
  async delete(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    if (confirm('Вы уверены, что хотите удалить эту категорию? Все транзакции также будут удалены.')) {
      await this.itemStore.delete(id);
    }
  }

  /**
   * Фильтрация транзакций по выбранному периоду (от начала периода до текущего момента)
   */
  private filterByPeriod(transactions: ReturnType<typeof this.allTransactions>, period: PeriodType) {
    const now = new Date();
    const start = this.getPeriodStart(now, period);

    return transactions.filter(tx => {
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return false;
      return d >= start && d <= now;
    });
  }

  /**
   * Получить начало периода (день, неделя, месяц, год)
   */
  private getPeriodStart(now: Date, period: PeriodType): Date {
    const d = new Date(now);

    switch (period) {
      case 'day': {
        d.setHours(0, 0, 0, 0);
        return d;
      }
      case 'week': {
        const day = d.getDay() || 7; // 1-7, где 1 — понедельник
        if (day !== 1) {
          d.setDate(d.getDate() - (day - 1));
        }
        d.setHours(0, 0, 0, 0);
        return d;
      }
      case 'month': {
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      }
      case 'year': {
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        return d;
      }
      default:
        return d;
    }
  }
}

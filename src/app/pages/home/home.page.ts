import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ItemStore } from '../../features/items/item.store';
import { TransactionStore } from '../../features/transactions/transaction.store';
import { VkAuthService } from '../../core/auth/auth.service';
import { PieChartComponent } from '../../shared/components/pie-chart/pie-chart.component';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { PeriodType } from '../../shared/utils/chart.utils';
import { ModalComponent } from '../../shared/components/modal/modal.component';

/**
 * Компонент главной страницы
 * Отображает список всех категорий (items) и форму для создания новых
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, PieChartComponent, LocalDatePipe, ModalComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  private itemStore = inject(ItemStore);
  private txStore = inject(TransactionStore);
  private router = inject(Router);
  private authService = inject(VkAuthService);

  /** Название новой категории */
  title = '';
  
  /** Тип категории (доход/расход) */
  category: 'income' | 'expense' = 'income';

  /** Флаг демо-режима */
  isDemoMode = this.itemStore.isDemoMode;

  /** Фильтр по типу категории (все/доходы/расходы) */
  categoryFilter = signal<'all' | 'income' | 'expense'>('all');

  /** Отфильтрованный и отсортированный список категорий */
  items = computed(() => {
    let filtered = this.itemStore.items();
    
    // Фильтрация по типу
    if (this.categoryFilter() !== 'all') {
      filtered = filtered.filter(item => item.category === this.categoryFilter());
    }
    
    // Сортировка: сначала избранные, затем по sortOrder, затем по дате обновления
    return filtered.sort((a, b) => {
      // Избранные всегда сверху
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      // Если обе избранные или обе не избранные, сортируем внутри группы
      // Сначала по sortOrder (если есть)
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      if (a.sortOrder !== undefined) return -1;
      if (b.sortOrder !== undefined) return 1;
      
      // Затем по дате обновления (новые/измененные сверху)
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });
  });

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

  /** Состояние модального окна для сообщения об избранном */
  showFavoriteModal = signal(false);

  toggleMobileChart(): void {
    this.showMobileChart = !this.showMobileChart;
  }

  /**
   * Создание новой категории
   */
  async add(): Promise<void> {
    if (!this.title.trim()) return;
    
    try {
      await this.itemStore.create(this.title.trim(), this.category);
      this.title = '';
    } catch (error: any) {
      alert(error.message || 'Ошибка при создании категории. Войдите в систему, чтобы создавать категории.');
    }
  }

  /**
   * Переход на страницу деталей категории
   * @param id - ID категории
   */
  open(id: string): void {
    this.router.navigate(['/item', id]);
  }


  /**
   * Переключение избранного статуса категории
   * @param id - ID категории
   * @param event - событие клика (для предотвращения всплытия)
   */
  async toggleFavorite(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    
    // В демо-режиме показываем модальное окно
    if (this.isDemoMode()) {
      this.showFavoriteModal.set(true);
      return;
    }
    
    await this.itemStore.toggleFavorite(id);
  }

  /**
   * Прокрутка к верху страницы (для демо-баннера)
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Функция отслеживания для ngFor (улучшает производительность)
   * @param index - индекс элемента
   * @param item - элемент списка
   * @returns уникальный идентификатор
   */
  trackByItemId(index: number, item: { id: string }): string {
    return item.id;
  }

  /**
   * Обработчик события перетаскивания категорий
   * @param event - событие drag-and-drop
   */
  async onDrop(event: CdkDragDrop<any[]>): Promise<void> {
    const currentItems = [...this.items()];
    moveItemInArray(currentItems, event.previousIndex, event.currentIndex);
    await this.itemStore.updateSortOrder(currentItems);
  }

  /**
   * Фильтрация транзакций по выбранному периоду
   * Для периода "год" показываем все транзакции за все время
   */
  private filterByPeriod(transactions: ReturnType<typeof this.allTransactions>, period: PeriodType) {
    // Для периода "год" показываем все транзакции
    if (period === 'year') {
      return transactions.filter(tx => {
        const d = new Date(tx.date);
        return !isNaN(d.getTime());
      });
    }

    // Для остальных периодов фильтруем от начала периода до текущего момента
    const now = new Date();
    const start = this.getPeriodStart(now, period);

    return transactions.filter(tx => {
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return false;
      return d >= start && d <= now;
    });
  }

  /**
   * Получить начало периода (день, неделя, месяц)
   * Для периода "год" не используется, так как показываем все транзакции
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
      default:
        return d;
    }
  }
}

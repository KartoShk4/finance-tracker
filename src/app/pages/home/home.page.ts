import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemStore } from '../../features/items/item.store';
import { TransactionStore } from '../../features/transactions/transaction.store';
import { VkAuthService } from '../../core/auth/auth.service';
import { PieChartComponent } from '../../shared/components/pie-chart/pie-chart.component';
import { CategoriesChartComponent, CategoryChartData } from '../../shared/components/categories-chart/categories-chart.component';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { PeriodType } from '../../shared/utils/chart.utils';
import { ModalComponent } from '../../shared/components/modal/modal.component';

/**
 * Компонент главной страницы
 * Отображает список всех категорий (items) и форму для создания новых
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, PieChartComponent, CategoriesChartComponent, LocalDatePipe, ModalComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  private itemStore = inject(ItemStore);
  private txStore = inject(TransactionStore);
  private router = inject(Router);
  private authService = inject(VkAuthService);


  /** Проверка мобильного устройства (используем функцию вместо computed для лучшей производительности) */
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  }

  /** Название новой категории */
  title = '';

  /** Флаг демо-режима */
  isDemoMode = this.itemStore.isDemoMode;

  /** Отсортированный список категорий */
  items = computed(() => {
    const filtered = this.itemStore.items();

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

  /** Данные для графика категорий */
  categoriesChartData = computed(() => {
    const items = this.itemStore.items();
    const transactions = this.filterByPeriod(this.allTransactions(), this.selectedPeriod());

    // Группируем транзакции по категориям
    const categoryMap = new Map<string, { income: number; expense: number }>();

    // Инициализируем все категории
    items.forEach(item => {
      categoryMap.set(item.id, { income: 0, expense: 0 });
    });

    // Собираем суммы по категориям
    transactions.forEach(tx => {
      const categoryData = categoryMap.get(tx.item_id);
      if (categoryData) {
        if (tx.type === 'income') {
          categoryData.income += tx.amount;
        } else {
          categoryData.expense += tx.amount;
        }
      }
    });

    // Формируем массив данных для графика
    const chartData: CategoryChartData[] = items.map(item => {
      const data = categoryMap.get(item.id) || { income: 0, expense: 0 };
      return {
        id: item.id,
        title: item.title,
        income: data.income,
        expense: data.expense,
        total: data.income - data.expense // Доходы минус расходы
      };
    }).filter(cat => cat.income > 0 || cat.expense > 0); // Показываем только категории с транзакциями

    return chartData;
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

  /** Состояние модального окна для сообщения о лимите в демо-режиме */
  showDemoLimitModal = signal(false);

  /** Количество созданных пользовательских категорий */
  userItemsCount = computed(() => {
    if (!this.isDemoMode()) return 0;
    return this.itemStore.items().filter(item => !item.id.startsWith('demo-')).length;
  });

  /** Максимальное количество категорий в демо-режиме */
  readonly DEMO_LIMIT = 2;

  /** Можно ли создавать категории в демо-режиме */
  canCreateInDemo = computed(() => {
    if (!this.isDemoMode()) return true;
    return this.userItemsCount() < this.DEMO_LIMIT;
  });

  toggleMobileChart(): void {
    this.showMobileChart = !this.showMobileChart;
  }

  /**
   * Создание новой категории
   * Категория создается без типа - тип определяется при создании транзакций внутри категории
   * @param event - событие submit формы
   */
  async add(event?: Event): Promise<void> {
    // Предотвращаем стандартное поведение формы
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.title.trim()) {
      return;
    }

    // В демо-режиме проверяем лимит перед попыткой создания
    if (this.isDemoMode() && !this.canCreateInDemo()) {
      this.showDemoLimitModal.set(true);
      return;
    }

    try {
      // Создаем категорию без типа (type будет опциональным или будет устанавливаться при первой транзакции)
      await this.itemStore.create(this.title.trim());
      this.title = '';

      // Если после создания достигнут лимит, показываем модальное окно
      if (this.isDemoMode() && !this.canCreateInDemo()) {
        this.showDemoLimitModal.set(true);
      }
    } catch (error: any) {
      if (error.message === 'DEMO_LIMIT_REACHED') {
        this.showDemoLimitModal.set(true);
      } else {
        alert(error.message || 'Ошибка при создании категории. Войдите в систему, чтобы создавать категории.');
      }
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

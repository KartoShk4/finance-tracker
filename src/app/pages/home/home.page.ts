import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ItemStore } from '../../features/items/item.store';
import { TransactionStore } from '../../features/transactions/transaction.store';
import { VkAuthService } from '../../core/auth/auth.service';
import { PieChartComponent } from '../../shared/components/pie-chart/pie-chart.component';
import { CategoriesChartComponent, CategoryChartData } from '../../shared/components/categories-chart/categories-chart.component';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { PeriodType } from '../../shared/utils/chart.utils';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { VkLoginComponent } from '../../shared/components/vk-login/vk-login.components';

/**
 * Компонент главной страницы
 * Отображает список всех категорий (items) и форму для создания новых
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, PieChartComponent, CategoriesChartComponent, LocalDatePipe, ModalComponent, VkLoginComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  private itemStore = inject(ItemStore);
  private txStore = inject(TransactionStore);
  private router = inject(Router);
  authService = inject(VkAuthService);

  dragActivated = false; // Флаг активации drag на мобильных устройствах
  
  /** Проверка мобильного устройства (используем функцию вместо computed для лучшей производительности) */
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  }

  /** Название новой категории */
  title = '';

  /** Проверка авторизации */
  isAuthenticated = computed(() => this.authService.isAuthenticated());

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

  /** Демо-статистика для неавторизованных пользователей */
  demoStatistics = computed(() => {
    // Примерные данные для демонстрации
    return { income: 75000, expense: 52000 };
  });

  /** Демо-данные для графика категорий (для неавторизованных пользователей) */
  demoCategoriesChartData = computed(() => {
    const demoData: CategoryChartData[] = [
      { id: 'demo-1', title: 'Зарплата', income: 50000, expense: 0, total: 50000 },
      { id: 'demo-2', title: 'Фриланс', income: 25000, expense: 0, total: 25000 },
      { id: 'demo-3', title: 'Продукты', income: 0, expense: 23500, total: -23500 },
      { id: 'demo-4', title: 'Транспорт', income: 0, expense: 4500, total: -4500 },
      { id: 'demo-5', title: 'Развлечения', income: 0, expense: 12000, total: -12000 },
      { id: 'demo-6', title: 'Коммунальные услуги', income: 0, expense: 8000, total: -8000 },
    ];
    return demoData;
  });

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
    
    if (!this.authService.isAuthenticated()) {
      alert('Необходима авторизация для создания категорий. Войдите в систему.');
      return;
    }
    
    try {
      // Создаем категорию без типа (type будет опциональным или будет устанавливаться при первой транзакции)
      await this.itemStore.create(this.title.trim());
      this.title = '';
    } catch (error: any) {
      alert(error.message || 'Ошибка при создании категории.');
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
    
    if (!this.authService.isAuthenticated()) {
      alert('Необходима авторизация для изменения избранного.');
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

  /** Таймер для удержания на мобильных устройствах */
  private longPressTimer: number | null = null;
  isDragging = false; // Публичный для использования в шаблоне
  private touchStartTime = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchMoved = false;

  /**
   * Обработчик начала касания для мобильных устройств
   * @param event - событие touch
   * @param item - элемент, который нужно перетаскивать
   */
  onTouchStart(event: TouchEvent, item: any): void {
    // Проверяем, что это мобильное устройство
    if (window.innerWidth <= 768) {
      // Если уже активирован drag для другого элемента, игнорируем
      if (this.dragActivated) {
        return;
      }
      
      const touch = event.touches[0];
      if (!touch) return;
      
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();
      this.isDragging = false;
      this.touchMoved = false;
      
      const target = event.target as HTMLElement;
      const dragElement = target.closest('.items-item');
      
      // Не запускаем drag для кнопки избранного
      if (target.closest('.favorite-button')) {
        return;
      }
      
      // Устанавливаем таймер на 1200мс для активации drag-and-drop (увеличен для предотвращения случайной активации)
      // Это достаточно долго, чтобы пользователь мог начать скроллить до активации
      this.longPressTimer = window.setTimeout(() => {
        // Проверяем, что палец не двигался значительно и drag еще не активирован
        // Только если было минимальное движение (меньше 10px), активируем drag
        if (!this.touchMoved && !this.dragActivated && dragElement) {
          this.dragActivated = true;
          this.isDragging = true;
          // Визуальная обратная связь
          dragElement.classList.add('drag-active');
        }
      }, 1200);
    }
  }

  /**
   * Обработчик окончания касания для мобильных устройств
   * @param event - событие touch
   */
  onTouchEnd(event: TouchEvent): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    const target = event.target as HTMLElement;
    const itemElement = target.closest('.items-item');
    
    if (itemElement) {
      itemElement.classList.remove('drag-active');
    }
    
    // Если не было активации drag и не было значительного движения - открываем категорию
    if (window.innerWidth <= 768 && !this.dragActivated && !this.touchMoved && itemElement) {
      // Находим ID категории и открываем ее
      const itemTitle = itemElement.querySelector('.items-item-title');
      if (itemTitle) {
        const item = this.items().find(i => i.title === itemTitle.textContent?.trim());
        if (item) {
          this.open(item.id);
        }
      }
    }
    
    // Сбрасываем состояние
    this.isDragging = false;
    this.dragActivated = false;
    this.touchStartTime = 0;
    this.touchMoved = false;
  }

  /**
   * Обработчик движения касания - определяет скроллинг или drag
   * КРИТИЧЕСКИ ВАЖНО: При вертикальном движении (скроллинге) сразу отменяем drag
   * @param event - событие touch
   */
  onTouchMove(event: TouchEvent): void {
    if (window.innerWidth <= 768 && !this.dragActivated) {
      const touch = event.touches[0];
      if (!touch) return;
      
      const deltaX = Math.abs(touch.clientX - this.touchStartX);
      const deltaY = Math.abs(touch.clientY - this.touchStartY);
      
      // Если есть ЛЮБОЕ движение (больше 2px) - отмечаем, что палец двигался
      if (deltaX > 2 || deltaY > 2) {
        this.touchMoved = true;
        
        // КРИТИЧЕСКИ ВАЖНО: Если есть вертикальное движение (скроллинг) - сразу отменяем drag
        // Приоритет скроллинга выше, чем drag-and-drop
        if (deltaY > 3) {
          // Это скроллинг, полностью отменяем drag и очищаем таймер
          if (this.longPressTimer !== null) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
          this.isDragging = false;
          this.dragActivated = false;
          // КРИТИЧЕСКИ ВАЖНО: НЕ вызываем preventDefault(), чтобы браузер мог обработать скроллинг
          return;
        }
        
        // Если движение преимущественно вертикальное (deltaY >= deltaX) - тоже скроллинг
        if (deltaY >= deltaX && deltaY > 2) {
          if (this.longPressTimer !== null) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
          return;
        }
        
        // Для любого значительного движения (больше 8px) также отменяем таймер
        // Это предотвращает активацию drag при любом движении пальца
        if ((deltaX > 8 || deltaY > 8) && this.longPressTimer !== null) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }
    }
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

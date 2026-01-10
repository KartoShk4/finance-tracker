import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Item } from './item.model';
import { ItemSupabaseRepository } from '../../core/repository/item-supabase.repository';
import { LocalItemRepository } from '../../core/repository/local-item.repository';
import { ItemRepository } from '../../core/repository/item.repository';
import { HistoryStore } from '../history/history.store';
import { VkAuthService } from '../../core/auth/auth.service';

/**
 * Store для управления состоянием категорий (items)
 * Использует Angular signals для реактивного управления данными
 * Работает в двух режимах:
 * - Демо-режим (LocalStorage) для неавторизованных пользователей
 * - Реальный режим (Supabase) для авторизованных пользователей
 */
@Injectable({ providedIn: 'root' })
export class ItemStore {
  private supabaseRepo = inject(ItemSupabaseRepository);
  private localRepo = inject(LocalItemRepository);
  private historyStore = inject(HistoryStore);
  private authService = inject(VkAuthService);

  /** Приватный signal для хранения списка категорий */
  private readonly _items = signal<Item[]>([]);
  
  /** Публичный computed signal для доступа к списку категорий */
  readonly items = computed(() => this._items());

  /** Текущий репозиторий в зависимости от состояния авторизации */
  private get repo(): ItemRepository {
    return this.authService.isAuthenticated() ? this.supabaseRepo : this.localRepo;
  }

  /** Флаг демо-режима */
  readonly isDemoMode = computed(() => !this.authService.isAuthenticated());

  /** Флаг для предотвращения бесконечных перезагрузок */
  private isReloading = false;

  /**
   * Конструктор - загружает данные при инициализации и реагирует на изменения авторизации
   */
  constructor() {
    this.load();
    
    // Реагируем на изменения авторизации и перезагружаем данные
    // Используем effect для отслеживания изменений состояния авторизации
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();
      // Перезагружаем данные при изменении состояния авторизации
      // Используем setTimeout чтобы избежать ошибок при инициализации
      if (!this.isReloading) {
        this.isReloading = true;
        setTimeout(() => {
          this.load().catch(error => console.error('Ошибка перезагрузки данных:', error))
            .finally(() => {
              // Небольшая задержка перед следующей возможной перезагрузкой
              setTimeout(() => {
                this.isReloading = false;
              }, 500);
            });
        }, 100);
      }
    });
  }

  /**
   * Загрузка всех категорий из соответствующего репозитория
   */
  async load(): Promise<void> {
    try {
      const data = await this.repo.getAll();
      
      // Если демо-режим, проверяем версию демо-данных
      if (this.isDemoMode()) {
        const demoItems = data.filter(item => item.id.startsWith('demo-'));
        const userItems = data.filter(item => !item.id.startsWith('demo-'));
        const hasNewDemoData = demoItems.length > 0 && demoItems.some(item => item.id === 'demo-7' || item.id === 'demo-8');
        
        // Если нет демо-данных или есть старые демо-данные (без demo-7 и demo-8), загружаем новые
        if (demoItems.length === 0 || (demoItems.length > 0 && !hasNewDemoData)) {
          console.log('Обнаружены старые демо-данные, обновляю...');
          // Загружаем новые демо-данные и сохраняем вместе с пользовательскими
          await this.loadDemoData();
          const newDemoItems = await this.localRepo.getAll();
          const combined = [...newDemoItems.filter(item => item.id.startsWith('demo-')), ...userItems];
          await this.localRepo.save(combined);
          this._items.set(combined);
          return;
        }
      }
      
      this._items.set(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      // В случае ошибки в демо-режиме загружаем демо-данные
      if (this.isDemoMode()) {
        await this.loadDemoData();
      }
    }
  }

  /**
   * Загрузка демо-данных для неавторизованных пользователей
   * Сохраняет существующие пользовательские категории
   */
  private async loadDemoData(): Promise<void> {
    console.log('Загрузка новых демо-данных категорий...');
    
    // Получаем существующие данные (включая пользовательские категории)
    const existingData = await this.localRepo.getAll();
    const existingUserItems = existingData.filter(item => !item.id.startsWith('demo-'));
    
    const now = new Date();
    const demoItems: Item[] = [
      {
        id: 'demo-1',
        title: 'Зарплата',
        category: 'income',
        total: 50000,
        lastUpdated: now.toISOString(),
        isFavorite: true,
        sortOrder: 0
      },
      {
        id: 'demo-2',
        title: 'Продукты',
        category: 'expense',
        total: 23500, // 8500 + 3200 + 4800 + 2900 + 4100
        lastUpdated: new Date(now.getTime() - 86400000).toISOString(),
        isFavorite: true,
        sortOrder: 1
      },
      {
        id: 'demo-3',
        title: 'Транспорт',
        category: 'expense',
        total: 4500, // 1500 + 500 + 800 + 1700
        lastUpdated: new Date(now.getTime() - 2 * 86400000).toISOString(),
        sortOrder: 2
      },
      {
        id: 'demo-4',
        title: 'Развлечения',
        category: 'expense',
        total: 12000, // 2500 + 4500 + 3000 + 2000
        lastUpdated: new Date(now.getTime() - 3 * 86400000).toISOString(),
        sortOrder: 3
      },
      {
        id: 'demo-5',
        title: 'Коммунальные услуги',
        category: 'expense',
        total: 8000, // 3500 + 2500 + 2000
        lastUpdated: new Date(now.getTime() - 5 * 86400000).toISOString(),
        isFavorite: true,
        sortOrder: 4
      },
      {
        id: 'demo-6',
        title: 'Одежда',
        category: 'expense',
        total: 15000, // 8500 + 3500 + 3000
        lastUpdated: new Date(now.getTime() - 7 * 86400000).toISOString(),
        sortOrder: 5
      },
      {
        id: 'demo-7',
        title: 'Фриланс',
        category: 'income',
        total: 25000, // 15000 + 10000
        lastUpdated: new Date(now.getTime() - 4 * 86400000).toISOString(),
        sortOrder: 6
      },
      {
        id: 'demo-8',
        title: 'Кафе и рестораны',
        category: 'expense',
        total: 8500, // 1200 + 1800 + 2500 + 900 + 2100
        lastUpdated: new Date(now.getTime() - 1 * 86400000).toISOString(),
        sortOrder: 7
      }
    ];
    
    // Объединяем демо-данные с пользовательскими категориями
    // Пользовательские категории должны быть после демо-категорий
    const combinedItems = [...demoItems, ...existingUserItems];
    
    // Сохраняем и обновляем состояние
    await this.repo.save(combinedItems);
    this._items.set(combinedItems);
    console.log('Демо-данные категорий загружены:', demoItems.length, 'демо-категорий,', existingUserItems.length, 'пользовательских категорий');
  }

  /**
   * Получение количества пользовательских категорий (не демо)
   */
  private getUserItemsCount(): number {
    return this._items().filter(item => !item.id.startsWith('demo-')).length;
  }

  /**
   * Проверка возможности создания категории в демо-режиме
   * @returns true, если можно создать, false - если достигнут лимит
   */
  canCreateInDemoMode(): boolean {
    if (!this.isDemoMode()) {
      return true; // В обычном режиме можно создавать без ограничений
    }
    return this.getUserItemsCount() < 2;
  }

  /**
   * Создание новой категории
   * @param title - название категории
   * @throws Error если в демо-режиме достигнут лимит созданных категорий
   */
  async create(title: string): Promise<void> {
    // В демо-режиме проверяем лимит на создание категорий
    if (this.isDemoMode()) {
      if (!this.canCreateInDemoMode()) {
        throw new Error('DEMO_LIMIT_REACHED');
      }
    }

    const item: Item = {
      id: crypto.randomUUID(),
      title,
      // category не устанавливается при создании - тип определяется транзакциями
      total: 0,
      lastUpdated: new Date().toISOString()
    };

    // Обновляем локальное состояние
    this._items.update(prev => [...prev, item]);
    
    // Сохраняем в базу данных
    await this.repo.save(this._items());

    // Добавляем запись в историю (только для авторизованных пользователей)
    if (!this.isDemoMode()) {
      this.historyStore.addEntry({
        action: 'created',
        entityType: 'item',
        entityId: item.id,
        entityTitle: title,
        details: `Категория создана`
      });
    }
  }

  /**
   * Применение изменения суммы к категории
   * Используется при добавлении транзакций
   * @param id - ID категории
   * @param delta - изменение суммы (положительное для дохода, отрицательное для расхода)
   */
  async applyDelta(id: string, delta: number): Promise<void> {
    // Обновляем сумму и дату обновления
    this._items.update(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, total: i.total + delta, lastUpdated: new Date().toISOString() }
          : i
      )
    );
    
    // Сохраняем изменения в базу данных
    await this.repo.save(this._items());
  }

  /**
   * Удаление категории
   * @param id - ID категории
   */
  async delete(id: string): Promise<void> {
    const item = this._items().find(i => i.id === id);
    if (!item) return;

    // В демо-режиме разрешаем удаление только пользовательских категорий (не демо)
    if (this.isDemoMode()) {
      if (item.id.startsWith('demo-')) {
        throw new Error('Демо-категории нельзя удалить. Войдите в систему, чтобы создавать и удалять свои категории.');
      }
      // Разрешаем удаление пользовательских категорий в демо-режиме
    }

    // Добавляем запись в историю перед удалением (только для авторизованных пользователей)
    if (!this.isDemoMode()) {
      this.historyStore.addEntry({
        action: 'deleted',
        entityType: 'item',
        entityId: id,
        entityTitle: item.title,
        details: `Категория "${item.category === 'income' ? 'Доход' : 'Расход'}" удалена`
      });
    }

    // Удаляем из локального состояния
    this._items.update(prev => prev.filter(i => i.id !== id));
    
    // Сохраняем в базу данных
    await this.repo.save(this._items());
  }

  /**
   * Переключение статуса избранного для категории
   * @param id - ID категории
   */
  async toggleFavorite(id: string): Promise<void> {
    this._items.update(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, isFavorite: !i.isFavorite }
          : i
      )
    );
    
    await this.repo.save(this._items());
  }

  /**
   * Обновление порядка сортировки категорий
   * @param items - массив категорий в новом порядке
   */
  async updateSortOrder(items: Item[]): Promise<void> {
    const updated = items.map((item, index) => ({
      ...item,
      sortOrder: index
    }));
    
    this._items.set(updated);
    await this.repo.save(this._items());
  }
}

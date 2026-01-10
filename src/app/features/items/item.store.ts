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
      this._items.set(data);
      
      // Если демо-режим и нет данных, загружаем демо-контент
      if (this.isDemoMode() && data.length === 0) {
        this.loadDemoData();
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      // В случае ошибки в демо-режиме загружаем демо-данные
      if (this.isDemoMode()) {
        this.loadDemoData();
      }
    }
  }

  /**
   * Загрузка демо-данных для неавторизованных пользователей
   */
  private async loadDemoData(): Promise<void> {
    const demoItems: Item[] = [
      {
        id: 'demo-1',
        title: 'Зарплата',
        category: 'income',
        total: 50000,
        lastUpdated: new Date().toISOString(),
        isFavorite: true,
        sortOrder: 0
      },
      {
        id: 'demo-2',
        title: 'Продукты',
        category: 'expense',
        total: 15000,
        lastUpdated: new Date().toISOString(),
        isFavorite: true,
        sortOrder: 1
      },
      {
        id: 'demo-3',
        title: 'Транспорт',
        category: 'expense',
        total: 3000,
        lastUpdated: new Date().toISOString(),
        sortOrder: 2
      },
      {
        id: 'demo-4',
        title: 'Развлечения',
        category: 'expense',
        total: 5000,
        lastUpdated: new Date().toISOString(),
        sortOrder: 3
      }
    ];
    
    this._items.set(demoItems);
    await this.repo.save(demoItems);
  }

  /**
   * Создание новой категории
   * @param title - название категории
   * @param category - тип категории (доход/расход)
   */
  async create(title: string, category: 'income' | 'expense'): Promise<void> {
    // В демо-режиме запрещаем создание новых категорий
    if (this.isDemoMode()) {
      throw new Error('Войдите в систему, чтобы создавать категории');
    }

    const item: Item = {
      id: crypto.randomUUID(),
      title,
      category,
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
        details: `Категория "${category === 'income' ? 'Доход' : 'Расход'}" создана`
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
    // В демо-режиме запрещаем удаление категорий
    if (this.isDemoMode()) {
      throw new Error('Войдите в систему, чтобы удалять категории');
    }

    const item = this._items().find(i => i.id === id);
    if (!item) return;

    // Добавляем запись в историю перед удалением
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

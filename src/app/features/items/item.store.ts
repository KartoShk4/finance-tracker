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
 * Работает только для авторизованных пользователей через Supabase
 */
@Injectable({ providedIn: 'root' })
export class ItemStore {
  private supabaseRepo = inject(ItemSupabaseRepository);
  private historyStore = inject(HistoryStore);
  private authService = inject(VkAuthService);

  /** Приватный signal для хранения списка категорий */
  private readonly _items = signal<Item[]>([]);
  
  /** Публичный computed signal для доступа к списку категорий */
  readonly items = computed(() => {
    // Для неавторизованных пользователей возвращаем пустой массив
    if (!this.authService.isAuthenticated()) {
      return [];
    }
    return this._items();
  });

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
   * Загрузка всех категорий из Supabase
   * Для неавторизованных пользователей возвращает пустой массив
   */
  async load(): Promise<void> {
    // Для неавторизованных пользователей не загружаем данные
    if (!this.authService.isAuthenticated()) {
      this._items.set([]);
      return;
    }

    try {
      const userId = this.authService.user()?.id;
      if (!userId) {
        console.warn('User ID не найден, пропускаем загрузку категорий');
        this._items.set([]);
        return;
      }
      
      const data = await this.supabaseRepo.getAll();
      console.log(`Загружено категорий для пользователя ${userId}:`, data.length);
      this._items.set(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      this._items.set([]);
    }
  }

  /**
   * Создание новой категории
   * @param title - название категории
   * @throws Error если пользователь не авторизован
   */
  async create(title: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Необходима авторизация для создания категорий');
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
    await this.supabaseRepo.save(this._items());

    // Добавляем запись в историю
    this.historyStore.addEntry({
      action: 'created',
      entityType: 'item',
      entityId: item.id,
      entityTitle: title,
      details: `Категория создана`
    });
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
    
    // Сохраняем изменения в базу данных (только для авторизованных)
    if (this.authService.isAuthenticated()) {
      await this.supabaseRepo.save(this._items());
    }
  }

  /**
   * Удаление категории
   * @param id - ID категории
   * @throws Error если пользователь не авторизован
   */
  async delete(id: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Необходима авторизация для удаления категорий');
    }

    const item = this._items().find(i => i.id === id);
    if (!item) return;

    // Добавляем запись в историю перед удалением
    this.historyStore.addEntry({
      action: 'deleted',
      entityType: 'item',
      entityId: id,
      entityTitle: item.title,
      details: `Категория "${item.category === 'income' ? 'Доход' : 'Расход'}" удалена`
    });

    // Удаляем из локального состояния
    this._items.update(prev => prev.filter(i => i.id !== id));
    
    // Сохраняем в базу данных
    await this.supabaseRepo.save(this._items());
  }

  /**
   * Переключение статуса избранного для категории
   * @param id - ID категории
   */
  async toggleFavorite(id: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Необходима авторизация для изменения избранного');
    }

    this._items.update(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, isFavorite: !i.isFavorite }
          : i
      )
    );
    
    await this.supabaseRepo.save(this._items());
  }

  /**
   * Обновление порядка сортировки категорий
   * @param items - массив категорий в новом порядке
   */
  async updateSortOrder(items: Item[]): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Необходима авторизация для изменения порядка');
    }

    const updated = items.map((item, index) => ({
      ...item,
      sortOrder: index
    }));
    
    this._items.set(updated);
    await this.supabaseRepo.save(this._items());
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { Item } from './item.model';
import { ItemSupabaseRepository } from '../../core/repository/item-supabase.repository';
import { HistoryStore } from '../history/history.store';

/**
 * Store для управления состоянием категорий (items)
 * Использует Angular signals для реактивного управления данными
 */
@Injectable({ providedIn: 'root' })
export class ItemStore {
  private repo = inject(ItemSupabaseRepository);
  private historyStore = inject(HistoryStore);

  /** Приватный signal для хранения списка категорий */
  private readonly _items = signal<Item[]>([]);
  
  /** Публичный computed signal для доступа к списку категорий */
  readonly items = computed(() => this._items());

  /**
   * Конструктор - загружает данные при инициализации
   */
  constructor() {
    this.load();
  }

  /**
   * Загрузка всех категорий из базы данных
   */
  async load(): Promise<void> {
    const data = await this.repo.getAll();
    this._items.set(data);
  }

  /**
   * Создание новой категории
   * @param title - название категории
   * @param category - тип категории (доход/расход)
   */
  async create(title: string, category: 'income' | 'expense'): Promise<void> {
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

    // Добавляем запись в историю
    this.historyStore.addEntry({
      action: 'created',
      entityType: 'item',
      entityId: item.id,
      entityTitle: title,
      details: `Категория "${category === 'income' ? 'Доход' : 'Расход'}" создана`
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

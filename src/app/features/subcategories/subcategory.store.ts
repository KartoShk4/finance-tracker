import { Injectable, signal, computed, inject } from '@angular/core';
import { Subcategory } from './subcategory.model';
import { SubcategorySupabaseRepository } from '../../core/repository/subcategory-supabase.repository';

/**
 * Store для управления состоянием подкатегорий
 * Использует Angular signals для реактивного управления данными
 */
@Injectable({ providedIn: 'root' })
export class SubcategoryStore {
  private repo = inject(SubcategorySupabaseRepository);

  /** Приватный signal для хранения всех подкатегорий */
  private readonly _subcategories = signal<Subcategory[]>([]);
  
  /** Публичный computed signal для доступа ко всем подкатегориям */
  readonly all = computed(() => this._subcategories());

  /**
   * Конструктор - загружает данные при инициализации
   */
  constructor() {
    this.load();
  }

  /**
   * Загрузка всех подкатегорий из базы данных
   */
  async load(): Promise<void> {
    const data = await this.repo.getAll();
    this._subcategories.set(data);
  }

  /**
   * Получение подкатегорий для конкретной категории
   * @param item_id - ID категории
   * @returns computed signal с отфильтрованными подкатегориями, отсортированными по sortOrder
   */
  byItemId(item_id: string) {
    return computed(() => {
      const all = this._subcategories();
      const filtered = all.filter(s => s.item_id === item_id);
      
      // Сортируем по sortOrder
      return [...filtered].sort((a, b) => {
        const orderA = a.sortOrder ?? Infinity;
        const orderB = b.sortOrder ?? Infinity;
        return orderA - orderB;
      });
    });
  }

  /**
   * Создание новой подкатегории
   * @param item_id - ID родительской категории
   * @param title - название подкатегории
   * @returns созданная подкатегория
   */
  async create(item_id: string, title: string): Promise<Subcategory> {
    const now = new Date().toISOString();
    const subcategories = this.byItemId(item_id)();
    
    const subcategory: Subcategory = {
      id: crypto.randomUUID(),
      item_id,
      title: title.trim(),
      sortOrder: subcategories.length,
      createdAt: now,
      updatedAt: now
    };

    // Сохраняем в базу данных
    await this.repo.save(subcategory);

    // Обновляем локальное состояние
    this._subcategories.update(prev => [...prev, subcategory]);

    return subcategory;
  }

  /**
   * Обновление подкатегории
   * @param id - ID подкатегории
   * @param updates - объект с полями для обновления
   */
  async update(id: string, updates: Partial<Subcategory>): Promise<void> {
    const subcategory = this._subcategories().find(s => s.id === id);
    if (!subcategory) return;

    const updated: Subcategory = {
      ...subcategory,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Сохраняем в базу данных
    await this.repo.update(id, updates);

    // Обновляем локальное состояние
    this._subcategories.update(prev =>
      prev.map(s => s.id === id ? updated : s)
    );
  }

  /**
   * Удаление подкатегории
   * @param id - ID подкатегории
   */
  async delete(id: string): Promise<void> {
    // Удаляем из базы данных
    await this.repo.delete(id);

    // Обновляем локальное состояние
    this._subcategories.update(prev => prev.filter(s => s.id !== id));
  }
}


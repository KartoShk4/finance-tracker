import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Item } from '../../features/items/item.model';
import { ItemRepository } from './item.repository';

/**
 * Интерфейс для данных в Supabase (snake_case)
 * Соответствует структуре таблицы в базе данных
 */
interface ItemRow {
  id: string;
  title: string;
  category: 'income' | 'expense';
  total: number;
  last_updated: string; // snake_case для Supabase
  is_favorite?: boolean;
  sort_order?: number;
}

/**
 * Репозиторий для работы с категориями (items) в Supabase
 * Обеспечивает преобразование данных между форматами TypeScript и Supabase
 * Используется для авторизованных пользователей
 */
@Injectable({ providedIn: 'root' })
export class ItemSupabaseRepository implements ItemRepository {
  constructor(private supabase: SupabaseService) {}

  /**
   * Преобразует данные из формата Supabase (snake_case) в формат TypeScript (camelCase)
   * @param row - строка данных из Supabase
   * @returns объект Item в формате TypeScript
   */
  private fromRow(row: ItemRow): Item {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      total: row.total,
      lastUpdated: row.last_updated, // Преобразование last_updated -> lastUpdated
      isFavorite: row.is_favorite ?? false, // Используем значение по умолчанию, если колонка не существует
      sortOrder: row.sort_order // Может быть undefined, если колонка не существует
    };
  }

  /**
   * Преобразует данные из формата TypeScript (camelCase) в формат Supabase (snake_case)
   * @param item - объект Item в формате TypeScript
   * @returns объект в формате Supabase
   */
  private toRow(item: Item): ItemRow {
    const row: ItemRow = {
      id: item.id,
      title: item.title,
      category: item.category,
      total: item.total,
      last_updated: item.lastUpdated, // Преобразование lastUpdated -> last_updated
      is_favorite: item.isFavorite ?? false,
      sort_order: item.sortOrder
    };
    
    return row;
  }

  /**
   * Получает все категории из базы данных
   * @returns массив всех категорий
   */
  async getAll(): Promise<Item[]> {
    const { data, error } = await this.supabase.client
      .from('items')
      .select('id, title, category, total, last_updated, is_favorite, sort_order');

    if (error) throw error;
    
    // Фильтруем только нужные поля через fromRow
    return (data ?? []).map(row => this.fromRow(row as ItemRow));
  }

  /**
   * Сохраняет список категорий в базу данных
   * Использует upsert для обновления существующих и вставки новых записей
   * @param items - массив категорий для сохранения
   */
  async save(items: Item[]): Promise<void> {
    // Если список пустой, удаляем все категории
    if (items.length === 0) {
      const { data: existingData, error: selectError } = await this.supabase.client
        .from('items')
        .select('id');
      
      if (selectError) throw selectError;
      
      if (existingData && existingData.length > 0) {
        const idsToDelete = existingData.map(item => item.id);
        const { error: deleteError } = await this.supabase.client
          .from('items')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) throw deleteError;
      }
      return;
    }

    // Преобразуем в формат Supabase
    const rows = items.map(item => this.toRow(item));
    
    // Используем upsert для обновления существующих и вставки новых записей
    const { error: upsertError } = await this.supabase.client
      .from('items')
      .upsert(rows, { onConflict: 'id' });
    
    if (upsertError) {
      console.error('Upsert error:', upsertError);
      console.error('Trying to upsert:', rows);
      throw upsertError;
    }
    
    // Удаляем категории, которых нет в новом списке
    const newIds = new Set(items.map(i => i.id));
    const { data: allItems, error: selectError } = await this.supabase.client
      .from('items')
      .select('id');
    
    if (selectError) throw selectError;
    
    if (allItems) {
      const idsToDelete = allItems
        .map(i => i.id)
        .filter(id => !newIds.has(id));
      
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await this.supabase.client
          .from('items')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) throw deleteError;
      }
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { VkAuthService } from '../auth/auth.service';
import { Item } from '../../features/items/item.model';
import { ItemRepository } from './item.repository';

  /**
   * Интерфейс для данных в Supabase (snake_case)
   * Соответствует структуре таблицы в базе данных
   */
interface ItemRow {
  id: string;
  title: string;
  category?: 'income' | 'expense' | null; // Опциональный, так как category теперь может быть null
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
  private authService = inject(VkAuthService);
  
  constructor(private supabase: SupabaseService) {}
  
  /**
   * Получает текущий user_id для фильтрации данных
   */
  private getUserId(): string | null {
    const user = this.authService.user();
    return user?.id || null;
  }

  /**
   * Преобразует данные из формата Supabase (snake_case) в формат TypeScript (camelCase)
   * @param row - строка данных из Supabase
   * @returns объект Item в формате TypeScript
   */
  private fromRow(row: ItemRow): Item {
    return {
      id: row.id,
      title: row.title,
      category: row.category || undefined, // Преобразуем null в undefined для опционального поля
      total: row.total,
      lastUpdated: row.last_updated, // Преобразование last_updated -> lastUpdated
      isFavorite: row.is_favorite ?? false, // Используем значение по умолчанию, если колонка не существует
      sortOrder: row.sort_order // Может быть undefined, если колонка не существует
    };
  }

  /**
   * Преобразует данные из формата TypeScript (camelCase) в формат Supabase (snake_case)
   * @param item - объект Item в формате TypeScript
   * @returns объект в формате Supabase с user_id (если доступен)
   */
  private toRow(item: Item): ItemRow & { user_id?: string } {
    const userId = this.getUserId();
    const row: ItemRow & { user_id?: string } = {
      id: item.id,
      title: item.title,
      category: item.category || 'income', // Значение по умолчанию, так как category теперь опциональный
      total: item.total,
      last_updated: item.lastUpdated, // Преобразование lastUpdated -> last_updated
      is_favorite: item.isFavorite ?? false,
      sort_order: item.sortOrder
    };
    
    // Добавляем user_id для фильтрации данных пользователя (только если поле существует в таблице)
    // Если поле user_id еще не добавлено в таблицу, оно будет проигнорировано при upsert
    if (userId) {
      row.user_id = userId;
    }
    
    return row;
  }

  /**
   * Получает все категории из базы данных для текущего пользователя
   * @returns массив всех категорий пользователя
   */
  async getAll(): Promise<Item[]> {
    const userId = this.getUserId();
    
    if (!userId) {
      console.warn('User ID not available, returning empty array');
      return [];
    }
    
    // Получаем категории с фильтрацией по user_id
    // Поле user_id существует в таблице items (тип text)
    const { data, error } = await this.supabase.client
      .from('items')
      .select('id, title, category, total, last_updated, is_favorite, sort_order, user_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
    
    // Фильтруем только нужные поля через fromRow
    return (data ?? []).map(row => this.fromRow(row as ItemRow));
  }

  /**
   * Сохраняет список категорий в базу данных
   * Использует upsert для обновления существующих и вставки новых записей
   * @param items - массив категорий для сохранения
   */
  async save(items: Item[]): Promise<void> {
    const userId = this.getUserId();
    
    if (!userId) {
      throw new Error('User ID not available, cannot save items');
    }
    
    // Если список пустой, удаляем все категории текущего пользователя
    if (items.length === 0) {
      const { data: existingData, error: selectError } = await this.supabase.client
        .from('items')
        .select('id')
        .eq('user_id', userId);
      
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
    // Поле user_id уже существует в таблице items (тип text)
    // Добавляем user_id к каждой строке перед сохранением
    const rows = items.map(item => {
      const rowWithUserId = this.toRow(item);
      return rowWithUserId as any; // Включаем user_id для сохранения
    });
    
    // Используем upsert с user_id, так как поле существует в таблице
    const { error: upsertError } = await this.supabase.client
      .from('items')
      .upsert(rows, { onConflict: 'id' });
    
    if (upsertError) {
      console.error('Upsert error:', upsertError);
      console.error('Trying to upsert:', rows);
      throw upsertError;
    }
    
    // Удаляем категории текущего пользователя, которых нет в новом списке
    const newIds = new Set(items.map(i => i.id));
    
    const { data: userItems, error: selectError } = await this.supabase.client
      .from('items')
      .select('id')
      .eq('user_id', userId);
    
    if (selectError) throw selectError;
    
    if (userItems) {
      const idsToDelete = userItems
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

import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Subcategory } from '../../features/subcategories/subcategory.model';

/**
 * Интерфейс для данных в Supabase (snake_case)
 * Соответствует структуре таблицы в базе данных
 */
interface SubcategoryRow {
  id: string;
  item_id: string;
  title: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Репозиторий для работы с подкатегориями в Supabase
 * Обеспечивает преобразование данных между форматами TypeScript и Supabase
 */
@Injectable({ providedIn: 'root' })
export class SubcategorySupabaseRepository {
  constructor(private supabase: SupabaseService) {}

  /**
   * Преобразует данные из формата Supabase (snake_case) в формат TypeScript (camelCase)
   * @param row - строка данных из Supabase
   * @returns объект Subcategory в формате TypeScript
   */
  private fromRow(row: SubcategoryRow): Subcategory {
    return {
      id: row.id,
      item_id: row.item_id,
      title: row.title,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Преобразует данные из формата TypeScript (camelCase) в формат Supabase (snake_case)
   * @param subcategory - объект Subcategory в формате TypeScript
   * @returns объект в формате Supabase
   */
  private toRow(subcategory: Subcategory): SubcategoryRow {
    const row: SubcategoryRow = {
      id: subcategory.id,
      item_id: subcategory.item_id,
      title: subcategory.title,
      created_at: subcategory.createdAt,
      updated_at: subcategory.updatedAt
    };
    
    if (subcategory.sortOrder !== undefined) {
      row.sort_order = subcategory.sortOrder;
    }
    
    return row;
  }

  /**
   * Получает все подкатегории для конкретной категории
   * @param item_id - ID категории
   * @returns массив подкатегорий, отсортированных по sortOrder
   */
  async getByItemId(item_id: string): Promise<Subcategory[]> {
    const { data, error } = await this.supabase.client
      .from('subcategories')
      .select('id, item_id, title, sort_order, created_at, updated_at')
      .eq('item_id', item_id)
      .order('sort_order', { ascending: true, nullsFirst: false });

    if (error) throw error;
    
    return (data ?? []).map(row => this.fromRow(row as SubcategoryRow));
  }

  /**
   * Получает все подкатегории
   * @returns массив всех подкатегорий
   */
  async getAll(): Promise<Subcategory[]> {
    const { data, error } = await this.supabase.client
      .from('subcategories')
      .select('id, item_id, title, sort_order, created_at, updated_at')
      .order('item_id', { ascending: true })
      .order('sort_order', { ascending: true, nullsFirst: false });

    if (error) throw error;
    
    return (data ?? []).map(row => this.fromRow(row as SubcategoryRow));
  }

  /**
   * Сохраняет подкатегорию в базу данных
   * @param subcategory - подкатегория для сохранения
   */
  async save(subcategory: Subcategory): Promise<void> {
    const row = this.toRow(subcategory);
    
    const { error } = await this.supabase.client
      .from('subcategories')
      .upsert(row, { onConflict: 'id' });
    
    if (error) {
      console.error('Error saving subcategory:', error);
      throw error;
    }
  }

  /**
   * Удаляет подкатегорию из базы данных
   * @param id - ID подкатегории
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('subcategories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  }

  /**
   * Обновляет подкатегорию
   * @param id - ID подкатегории
   * @param updates - объект с полями для обновления
   */
  async update(id: string, updates: Partial<Subcategory>): Promise<void> {
    const updateData: Partial<SubcategoryRow> = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    if (updates.sortOrder !== undefined) {
      updateData.sort_order = updates.sortOrder;
    }

    const { error } = await this.supabase.client
      .from('subcategories')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  }
}




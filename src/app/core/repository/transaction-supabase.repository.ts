import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Transaction } from '../../features/transactions/transaction.model';

/**
 * Репозиторий для работы с транзакциями в Supabase
 * Обеспечивает сохранение и загрузку транзакций с валидацией foreign key
 */
@Injectable({ providedIn: 'root' })
export class TransactionSupabaseRepository {
  constructor(private supabase: SupabaseService) {}

  /**
   * Получает все транзакции из базы данных
   * @returns массив всех транзакций
   */
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await this.supabase.client
      .from('transactions')
      .select('*');

    if (error) throw error;
    return (data ?? []) as Transaction[];
  }

  /**
   * Сохраняет список транзакций в базу данных
   * Использует upsert для обновления существующих и вставки новых записей
   * Валидирует наличие всех item_id в таблице items перед сохранением
   * @param list - массив транзакций для сохранения
   */
  async save(list: Transaction[]): Promise<void> {
    // Если список пустой, удаляем все транзакции
    if (list.length === 0) {
      const { data: existingData, error: selectError } = await this.supabase.client
        .from('transactions')
        .select('id');
      
      if (selectError) throw selectError;
      
      if (existingData && existingData.length > 0) {
        const idsToDelete = existingData.map(item => item.id);
        const { error: deleteError } = await this.supabase.client
          .from('transactions')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) throw deleteError;
      }
      return;
    }
    
    // Проверяем, что все item_id существуют в таблице items
    // Это необходимо для соблюдения foreign key constraint
    const uniqueItemIds = [...new Set(list.map(t => t.item_id))];
    
    if (uniqueItemIds.length > 0) {
      const { data: existingItems, error: itemsError } = await this.supabase.client
        .from('items')
        .select('id')
        .in('id', uniqueItemIds);
      
      if (itemsError) throw itemsError;
      
      const existingItemIds = new Set((existingItems || []).map(item => item.id));
      const missingItemIds = uniqueItemIds.filter(id => !existingItemIds.has(id));
      
      // Если есть транзакции с несуществующими item_id, фильтруем их
      if (missingItemIds.length > 0) {
        console.warn('Some item_ids do not exist in items table:', missingItemIds);
        console.warn('Make sure items are saved to Supabase before creating transactions');
        list = list.filter(t => existingItemIds.has(t.item_id));
        
        if (list.length === 0) {
          console.warn('No valid transactions to save after filtering');
          return;
        }
      }
    }
    
    // Используем upsert для обновления существующих и вставки новых записей
    const { error: upsertError } = await this.supabase.client
      .from('transactions')
      .upsert(list, { onConflict: 'id' });
    
    if (upsertError) {
      console.error('Upsert error:', upsertError);
      console.error('Trying to upsert:', list);
      throw upsertError;
    }
    
    // Удаляем транзакции, которых нет в новом списке
    // Это обеспечивает синхронизацию локального состояния с базой данных
    const newIds = new Set(list.map(t => t.id));
    const { data: allTransactions, error: selectError } = await this.supabase.client
      .from('transactions')
      .select('id');
    
    if (selectError) throw selectError;
    
    if (allTransactions) {
      const idsToDelete = allTransactions
        .map(t => t.id)
        .filter(id => !newIds.has(id));
      
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await this.supabase.client
          .from('transactions')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) throw deleteError;
      }
    }
  }
}

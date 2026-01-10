import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { VkAuthService } from '../auth/auth.service';
import { Transaction } from '../../features/transactions/transaction.model';
import { TransactionRepository } from './transaction.repository';

/**
 * Репозиторий для работы с транзакциями в Supabase
 * Используется для авторизованных пользователей
 */
@Injectable({ providedIn: 'root' })
export class TransactionSupabaseRepository implements TransactionRepository {
  private authService = inject(VkAuthService);
  
  constructor(private supabase: SupabaseService) {}
  
  /**
   * Получает текущий user_id для фильтрации данных
   */
  private getUserId(): string | null {
    const user = this.authService.user();
    return user?.id || null;
  }

  // Получаем все транзакции текущего пользователя
  async getAll(): Promise<Transaction[]> {
    const userId = this.getUserId();
    
    if (!userId) {
      console.warn('User ID not available, returning empty array');
      return [];
    }
    
    // Получаем транзакции с фильтрацией по user_id (поле существует в таблице)
    const { data, error } = await this.supabase.client
      .from('transactions')
      .select('id,item_id,subcategory_id,type,amount,date,notes,user_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    
    return (data ?? []) as Transaction[];
  }

  // Сохраняем все транзакции текущего пользователя
  async save(list: Transaction[]): Promise<void> {
    try {
      const userId = this.getUserId();
      
      if (!userId) {
        throw new Error('User ID not available, cannot save transactions');
      }
      
      // Добавляем user_id к каждой транзакции перед сохранением
      // Поле user_id существует в таблице transactions (тип text)
      const transactionsToSave = list.map(tx => ({
        ...tx,
        user_id: userId
      })) as any[];
      
      // Если список пустой, удаляем все транзакции текущего пользователя
      if (list.length === 0) {
        const { data: existingData, error: selectError } = await this.supabase.client
          .from('transactions')
          .select('id')
          .eq('user_id', userId);
        
        if (selectError) throw selectError;
        
        if (existingData && existingData.length > 0) {
          const idsToDelete = existingData.map(tx => tx.id);
          const { error: deleteError } = await this.supabase.client
            .from('transactions')
            .delete()
            .in('id', idsToDelete);
          
          if (deleteError) throw deleteError;
        }
        return;
      }

      // Используем upsert с user_id, так как поле существует в таблице
      const { error: upsertError } = await this.supabase.client
        .from('transactions')
        .upsert(transactionsToSave, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('Upsert error:', upsertError);
        console.error('Trying to upsert:', transactionsToSave);
        throw upsertError;
      }
      
      // Удаляем транзакции текущего пользователя, которых нет в новом списке
      const newIds = new Set(list.map(t => t.id));
      
      const { data: userTransactions, error: selectError } = await this.supabase.client
        .from('transactions')
        .select('id')
        .eq('user_id', userId);
      
      if (selectError) throw selectError;
      
      if (userTransactions) {
        const idsToDelete = userTransactions
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
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw error;
    }
  }
}

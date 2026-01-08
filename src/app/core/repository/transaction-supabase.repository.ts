import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Transaction } from '../../features/transactions/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionSupabaseRepository {
  constructor(private supabase: SupabaseService) {}

  // Получаем все транзакции
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await this.supabase.client
      .from('transactions')
      .select('id,item_id,subcategory_id,type,amount,date,notes'); // Включаем subcategory_id и notes

    if (error) throw error;
    return (data ?? []) as Transaction[];
  }

  // Сохраняем все транзакции (используем upsert для обновления существующих и вставки новых)
  async save(list: Transaction[]): Promise<void> {
    try {
      // Если список пустой, удаляем все транзакции
      if (list.length === 0) {
        const { data: existingData, error: selectError } = await this.supabase.client
          .from('transactions')
          .select('id');
        
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
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw error;
    }
  }
}

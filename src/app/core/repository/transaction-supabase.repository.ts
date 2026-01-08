import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Transaction } from '../../features/transactions/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionSupabaseRepository {
  constructor(private supabase: SupabaseService) {}

  async getAll(): Promise<Transaction[]> {
    const { data, error } = await this.supabase.client.from('transactions').select('*');
    if (error) throw error;
    return data as Transaction[];
  }

  async save(list: Transaction[]): Promise<void> {
    await this.supabase.client.from('transactions').delete().neq('id', '');
    await this.supabase.client.from('transactions').insert(list);
  }
}

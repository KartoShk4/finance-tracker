import { Injectable, signal, computed, inject } from '@angular/core';
import { Transaction } from './transaction.model';
import { TransactionSupabaseRepository } from '../../core/repository/transaction-supabase.repository';

@Injectable({ providedIn: 'root' })
export class TransactionStore {
  private repo = inject(TransactionSupabaseRepository);

  private readonly _tx = signal<Transaction[]>([]);
  readonly all = computed(() => this._tx());

  constructor() {
    this.load();
  }

  async load() {
    const data = await this.repo.getAll();
    this._tx.set(data);
  }

  byItem(itemId: string) {
    return computed(() => this._tx().filter(t => t.itemId === itemId));
  }

  async add(itemId: string, type: 'income' | 'expense', amount: number) {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      itemId,
      type,
      amount,
      date: new Date().toISOString()
    };

    this._tx.update(prev => [...prev, tx]);
    await this.repo.save(this._tx());

    return type === 'income' ? amount : -amount;
  }
}

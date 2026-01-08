import { Injectable, signal, computed, inject } from '@angular/core';
import { Transaction } from './transaction.model';
import { TransactionRepository } from '../../core/repository/transaction.repository';
import { LocalTransactionRepository } from '../../core/repository/local-transaction.repository';

@Injectable({ providedIn: 'root' })
export class TransactionStore {
  private repo: TransactionRepository = inject(LocalTransactionRepository);

  private readonly _tx = signal<Transaction[]>(this.repo.load());
  readonly all = computed(() => this._tx());

  private persist(list: Transaction[]): void {
    this._tx.set(list);
    this.repo.save(list);
  }

  byItem(itemId: string) {
    return computed(() => this._tx().filter(t => t.itemId === itemId));
  }

  add(
    itemId: string,
    type: 'income' | 'expense',
    amount: number
  ): number {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      itemId,
      type,
      amount,
      date: new Date().toISOString()
    };

    this.persist([...this._tx(), tx]);
    return type === 'income' ? amount : -amount;
  }
}

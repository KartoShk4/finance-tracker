import { Injectable, signal, computed, inject } from '@angular/core';
import { Transaction } from './transaction.model';
import { StorageService } from '../../core/storage/storage.service';

@Injectable({ providedIn: 'root' })
export class TransactionStore {
  private readonly KEY = 'transactions';

  private storage = inject(StorageService);

  private readonly _tx = signal<Transaction[]>(
    this.storage.get<Transaction>(this.KEY)
  );

  readonly all = computed(() => this._tx());

  private persist(list: Transaction[]): void {
    this._tx.set(list);
    this.storage.set(this.KEY, list);
  }

  byItem(itemId: string) {
    return computed(() =>
      this._tx().filter(t => t.itemId === itemId)
    );
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

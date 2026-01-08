import { Injectable } from '@angular/core';
import { Transaction } from './transaction.model';
import { StorageService } from '../../core/storage/storage.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {

  private readonly KEY = 'transactions';

  constructor(private storage: StorageService) {}

  // Получить операции по товару
  getByItem(itemId: string): Transaction[] {
    return this.storage
      .get<Transaction>(this.KEY)
      .filter(t => t.itemId === itemId);
  }

  // Добавить операцию
  add(itemId: string, type: 'income' | 'expense', amount: number): void {
    const transactions = this.storage.get<Transaction>(this.KEY);

    transactions.push({
      id: crypto.randomUUID(),
      itemId,
      type,
      amount,
      date: new Date().toISOString()
    });

    this.storage.set(this.KEY, transactions);
  }
}

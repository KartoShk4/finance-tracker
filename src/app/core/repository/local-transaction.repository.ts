import { Injectable } from '@angular/core';
import { TransactionRepository } from './transaction.repository';
import { Transaction } from '../../features/transactions/transaction.model';
import { StorageService } from '../storage/storage.service';

@Injectable({ providedIn: 'root' })
export class LocalTransactionRepository implements TransactionRepository {
  private readonly KEY = 'transactions';

  constructor(private storage: StorageService) {}

  load(): Transaction[] {
    return this.storage.get<Transaction>(this.KEY);
  }

  save(list: Transaction[]): void {
    this.storage.set(this.KEY, list);
  }
}

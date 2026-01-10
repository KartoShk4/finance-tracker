import { Injectable } from '@angular/core';
import { TransactionRepository } from './transaction.repository';
import { Transaction } from '../../features/transactions/transaction.model';
import { StorageService } from '../storage/storage.service';

/**
 * Локальный репозиторий для демо-режима (localStorage)
 * Используется для неавторизованных пользователей
 */
@Injectable({ providedIn: 'root' })
export class LocalTransactionRepository implements TransactionRepository {
  private readonly KEY = 'demo_transactions';

  constructor(private storage: StorageService) {}

  async getAll(): Promise<Transaction[]> {
    return this.storage.get<Transaction>(this.KEY) || [];
  }

  async save(list: Transaction[]): Promise<void> {
    this.storage.set(this.KEY, list);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.KEY);
  }
}


import { Transaction } from '../../features/transactions/transaction.model';

/**
 * Контракт репозитория транзакций.
 * Любая реализация (LocalStorage / Supabase / API) обязана его соблюдать.
 */
export interface TransactionRepository {
  getAll(): Promise<Transaction[]>;
  save(list: Transaction[]): Promise<void>;
}

import { Transaction } from '../../features/transactions/transaction.model';

export interface TransactionRepository {
  load(): Transaction[];
  save(list: Transaction[]): void;
}

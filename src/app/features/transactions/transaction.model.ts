// Описывает одну операцию (доход или расход)
export interface Transaction {
  id: string;        // ID транзакции
  itemId: string;    // Связь с Item
  type: 'income' | 'expense';
  amount: number;
  date: string;      // Дата операции
}

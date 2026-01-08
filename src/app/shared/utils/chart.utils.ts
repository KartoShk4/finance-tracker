import { Transaction } from '../../features/transactions/transaction.model';

/**
 * Агрегирует транзакции по датам (YYYY-MM-DD)
 * Возвращает массив дат и сумм
 */
export function aggregateByDate(transactions: Transaction[]) {
  const map = new Map<string, number>();

  for (const t of transactions) {
    // Приводим дату к дню без времени
    const day = t.date.slice(0, 10);

    // Доход +, расход -
    const value = t.type === 'income' ? t.amount : -t.amount;

    map.set(day, (map.get(day) ?? 0) + value);
  }

  // Сортируем по дате
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));

  return {
    labels: sorted.map(([date]) => date),
    data: sorted.map(([, value]) => value)
  };
}

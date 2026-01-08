// Описывает агрегат (товар / статью учета)
export interface Item {
  id: string;             // Уникальный идентификатор
  title: string;          // Название
  category: 'income' | 'expense'; // Тип
  total: number;          // Итоговая сумма
  lastUpdated: string;    // Последняя дата изменения (ISO)
}

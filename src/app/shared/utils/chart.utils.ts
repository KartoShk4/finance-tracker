import { Transaction } from '../../features/transactions/transaction.model';

/**
 * Типы периодов для агрегации данных
 */
export type PeriodType = 'day' | 'month' | 'year' | 'week';

/**
 * Агрегирует транзакции по выбранному периоду
 * @param transactions - массив транзакций
 * @param period - тип периода (день, неделя, месяц, год)
 * @returns объект с метками (labels) и данными (data)
 */
export function aggregateByPeriod(
  transactions: Transaction[],
  period: PeriodType = 'day'
): { labels: string[]; data: number[] } {
  const map = new Map<string, number>();

  for (const t of transactions) {
    const date = new Date(t.date);
    // Проверяем валидность даты
    if (isNaN(date.getTime())) continue;
    
    let key: string;

    switch (period) {
      case 'day':
        // Группировка по дням: YYYY-MM-DD (используем локальное время)
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        key = `${year}-${month}-${day}`;
        break;
      
      case 'week':
        // Группировка по неделям: YYYY-WW (год-неделя, используем локальное время)
        const week = getWeekNumber(date);
        key = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
        break;
      
      case 'month':
        // Группировка по месяцам: YYYY-MM (используем локальное время)
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      
      case 'year':
        // Группировка по годам: YYYY (используем локальное время)
        key = date.getFullYear().toString();
        break;
      
      default:
        // По умолчанию группируем по дням (локальное время)
        const defYear = date.getFullYear();
        const defMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const defDay = date.getDate().toString().padStart(2, '0');
        key = `${defYear}-${defMonth}-${defDay}`;
    }

    // Доход +, расход -
    const value = t.type === 'income' ? t.amount : -t.amount;
    map.set(key, (map.get(key) ?? 0) + value);
  }

  // Сортируем по ключу (дате)
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));

  // Форматируем метки для отображения
  const labels = sorted.map(([key]) => formatPeriodLabel(key, period));
  const data = sorted.map(([, value]) => value);

  return { labels, data };
}

/**
 * Форматирует метку периода для отображения
 * @param key - ключ периода
 * @param period - тип периода
 * @returns отформатированная строка
 */
function formatPeriodLabel(key: string, period: PeriodType): string {
  switch (period) {
    case 'day':
      // YYYY-MM-DD -> DD.MM.YYYY
      const [year, month, day] = key.split('-');
      return `${day}.${month}.${year}`;
    
    case 'week':
      // YYYY-WW -> Неделя WW, YYYY
      const [y, w] = key.split('-W');
      return `Неделя ${w}, ${y}`;
    
    case 'month':
      // YYYY-MM -> MM.YYYY
      const [y2, m] = key.split('-');
      const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];
      return `${monthNames[parseInt(m) - 1]} ${y2}`;
    
    case 'year':
      // YYYY -> YYYY
      return key;
    
    default:
      return key;
  }
}

/**
 * Вычисляет номер недели в году (использует локальное время)
 * @param date - дата
 * @returns номер недели (1-53)
 */
function getWeekNumber(date: Date): number {
  // Создаем копию даты, чтобы не изменять оригинал
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Получаем день недели (0 = воскресенье, 1 = понедельник, ...)
  // Преобразуем к формату ISO (1 = понедельник, 7 = воскресенье)
  const dayNum = d.getDay() || 7;
  // Смещаем дату на четверг той же недели (ISO неделя начинается с понедельника)
  d.setDate(d.getDate() + 4 - dayNum);
  // Начало года для расчета недели
  const yearStart = new Date(d.getFullYear(), 0, 1);
  // Вычисляем количество дней от начала года и делим на 7
  const days = Math.floor((d.getTime() - yearStart.getTime()) / 86400000);
  return Math.ceil((days + 1) / 7);
}

/**
 * Агрегирует транзакции по датам (для обратной совместимости)
 * @deprecated Используйте aggregateByPeriod вместо этой функции
 */
export function aggregateByDate(transactions: Transaction[]) {
  return aggregateByPeriod(transactions, 'day');
}

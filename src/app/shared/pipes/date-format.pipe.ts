import { Pipe, PipeTransform } from '@angular/core';

/**
 * Пайп для форматирования даты без AM/PM
 * Использует локальное время компьютера
 */
@Pipe({
  name: 'localDate',
  standalone: true
})
export class LocalDatePipe implements PipeTransform {
  /**
   * Форматирует дату в локальный формат без AM/PM
   * @param value - дата в формате ISO string или Date
   * @param format - формат отображения ('short', 'medium', 'long', 'full')
   * @returns отформатированная строка
   */
  transform(value: string | Date | null | undefined, format: 'short' | 'medium' | 'long' | 'full' = 'short'): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const weekDays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

    switch (format) {
      case 'short':
        return `${day}.${month}.${year} ${hours}:${minutes}`;
      case 'medium':
        return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
      case 'long':
        return `${day} ${monthNames[date.getMonth()]} ${year} ${hours}:${minutes}`;
      case 'full':
        return `${weekDays[date.getDay()]}, ${day} ${monthNames[date.getMonth()]} ${year} ${hours}:${minutes}:${seconds}`;
      default:
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }
  }
}


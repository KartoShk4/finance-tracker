import { Injectable, signal } from '@angular/core';
import { SnackbarType } from './snackbar.component';

/**
 * Сервис для управления Snackbar уведомлениями
 * Предоставляет методы для показа различных типов уведомлений
 */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly snackbarRef = signal<{
    show: (message: string, type: SnackbarType, duration?: number) => void;
  } | null>(null);

  /**
   * Регистрация компонента Snackbar
   * @param ref - ссылка на компонент Snackbar
   */
  register(ref: { show: (message: string, type: SnackbarType, duration?: number) => void }): void {
    this.snackbarRef.set(ref);
  }

  /**
   * Показать уведомление об успехе
   * @param message - текст сообщения
   * @param duration - длительность показа в миллисекундах (по умолчанию 3000)
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Показать уведомление об ошибке
   * @param message - текст сообщения
   * @param duration - длительность показа в миллисекундах (по умолчанию 4000)
   */
  error(message: string, duration: number = 4000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Показать информационное уведомление
   * @param message - текст сообщения
   * @param duration - длительность показа в миллисекундах (по умолчанию 3000)
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Показать предупреждающее уведомление
   * @param message - текст сообщения
   * @param duration - длительность показа в миллисекундах (по умолчанию 3500)
   */
  warning(message: string, duration: number = 3500): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Показать уведомление с указанным типом
   * @param message - текст сообщения
   * @param type - тип уведомления
   * @param duration - длительность показа в миллисекундах
   */
  show(message: string, type: SnackbarType = 'info', duration?: number): void {
    const ref = this.snackbarRef();
    if (ref) {
      ref.show(message, type, duration);
    } else {
      console.warn('Snackbar component not registered. Message:', message);
    }
  }
}



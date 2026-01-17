import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';

/**
 * Подавление ошибок от расширений браузера
 * Эти ошибки не влияют на работу приложения и засоряют консоль
 */
(function suppressExtensionErrors() {
  // Сохраняем оригинальную функцию console.error
  const originalError = console.error;
  const originalWarn = console.warn;

  // Переопределяем console.error для фильтрации ошибок расширений
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (
      message.includes('runtime.lastError') ||
      message.includes('Unchecked runtime.lastError') ||
      message.includes('message port closed') ||
      message.includes('Extension context invalidated') ||
      message.includes('The message port closed before a response was received') ||
      message.includes('Could not establish connection')
    ) {
      // Игнорируем эти ошибки - они от расширений браузера
      return;
    }
    // Для всех остальных ошибок используем оригинальный console.error
    originalError.apply(console, args);
  };

  // Переопределяем console.warn для фильтрации предупреждений расширений
  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    if (
      message.includes('runtime.lastError') ||
      message.includes('Unchecked runtime.lastError') ||
      message.includes('message port closed') ||
      message.includes('Extension context invalidated') ||
      message.includes('The message port closed before a response was received') ||
      message.includes('Could not establish connection')
    ) {
      // Игнорируем эти предупреждения
      return;
    }
    // Для всех остальных предупреждений используем оригинальный console.warn
    originalWarn.apply(console, args);
  };
})();

window.addEventListener('error', (event: ErrorEvent) => {
  // Фильтруем ошибки от расширений браузера (runtime.lastError)
  const errorMessage = event.message || '';
  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('Unchecked runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('The message port closed before a response was received') ||
    errorMessage.includes('Could not establish connection')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  return true;
});

/**
 * Обработчик необработанных промисов
 * Фильтрует предупреждения от расширений браузера
 */
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  // Фильтруем ошибки от расширений браузера
  const reason = event.reason;
  const errorMessage =
    (typeof reason === 'string' ? reason : '') ||
    (reason?.message || '') ||
    (reason?.toString?.() || '');

  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('Unchecked runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('The message port closed before a response was received') ||
    errorMessage.includes('Could not establish connection')
  ) {
    event.preventDefault();
    return false;
  }
  return true;
});

/**
 * Точка входа в приложение
 * Инициализирует Angular приложение с маршрутизацией
 */
bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    // Hash-роутинг для GitHub Pages
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
}).catch((error) => {
  console.error('Ошибка при запуске приложения:', error);
});

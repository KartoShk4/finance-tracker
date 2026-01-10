import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
window.addEventListener('error', (event: ErrorEvent) => {
  // Фильтруем ошибки от расширений браузера (runtime.lastError)
  const errorMessage = event.message || '';
  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('The message port closed before a response was received')
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
    errorMessage.includes('message port closed') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('The message port closed before a response was received')
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

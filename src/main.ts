import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

/**
 * Точка входа в приложение
 * Инициализирует Angular приложение с маршрутизацией
 */
bootstrapApplication(App, {
  providers: [provideRouter(routes)]
}).then();

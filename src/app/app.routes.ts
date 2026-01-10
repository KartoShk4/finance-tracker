import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { ItemDetailsPage } from './pages/item-details/item-details.page';
import { HistoryPage } from './pages/history/history.page';
import { FaqPage } from './pages/faq/faq.page';
import { AboutPage } from './pages/about/about.page';

/**
 * Маршруты приложения
 * Определяет структуру навигации
 */
export const routes: Routes = [
  /** Главная страница - список всех категорий */
  { path: '', component: HomePage },

  /** Страница деталей категории - транзакции и график */
  { path: 'item/:id', component: ItemDetailsPage },

  /** Страница истории изменений */
  { path: 'history', component: HistoryPage },

  /** Страница FAQ (Часто задаваемые вопросы) */
  { path: 'faq', component: FaqPage },

  /** Страница "О нас" */
  { path: 'about', component: AboutPage },
];

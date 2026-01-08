import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { ItemDetailsPage } from './pages/item-details/item-details.page';
import { HistoryPage } from './pages/history/history.page';

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
  { path: 'history', component: HistoryPage }
];

import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { ItemDetailsPage } from './pages/item-details/item-details.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'item/:id', component: ItemDetailsPage }
];

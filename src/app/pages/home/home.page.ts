import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemService } from '../../features/items/item.service';
import { Item } from '../../features/items/item.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.page.html'
})
export class HomePage {

  title = '';
  amount = 0;
  category: 'income' | 'expense' = 'income';

  items: Item[] = [];

  constructor(
    private itemService: ItemService,
    private router: Router
  ) {
    // Загрузка данных при инициализации
    this.items = this.itemService.getAll();
  }

  // Добавление новой записи
  add(): void {
    if (!this.title) return;

    this.itemService.create(this.title, this.category);
    this.items = this.itemService.getAll();

    // Сброс формы
    this.title = '';
  }

  // Переход к деталке
  open(item: Item): void {
    this.router.navigate(['/item', item.id]).then();
  }
}

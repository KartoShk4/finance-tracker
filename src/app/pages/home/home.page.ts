import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemStore } from '../../features/items/item.store';

/**
 * Компонент главной страницы
 * Отображает список всех категорий (items) и форму для создания новых
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  private itemStore = inject(ItemStore);
  private router = inject(Router);

  /** Название новой категории */
  title = '';
  
  /** Тип категории (доход/расход) */
  category: 'income' | 'expense' = 'income';

  /** Список всех категорий */
  items = this.itemStore.items;

  /**
   * Создание новой категории
   */
  add(): void {
    if (!this.title.trim()) return;
    
    this.itemStore.create(this.title.trim(), this.category);
    this.title = '';
  }

  /**
   * Переход на страницу деталей категории
   * @param id - ID категории
   */
  open(id: string): void {
    this.router.navigate(['/item', id]);
  }

  /**
   * Удаление категории
   * @param id - ID категории
   * @param event - событие клика (для предотвращения всплытия)
   */
  async delete(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    if (confirm('Вы уверены, что хотите удалить эту категорию? Все транзакции также будут удалены.')) {
      await this.itemStore.delete(id);
    }
  }
}

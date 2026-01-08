import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemStore } from '../../features/items/item.store';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.page.html'
})
export class HomePage {
  private itemStore = inject(ItemStore);
  private router = inject(Router);

  title = '';
  category: 'income' | 'expense' = 'income';

  items = this.itemStore.items;

  add(): void {
    if (!this.title) return;
    this.itemStore.create(this.title, this.category);
    this.title = '';
  }

  open(id: string): void {
    this.router.navigate(['/item', id]);
  }
}

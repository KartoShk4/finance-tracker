import { Injectable } from '@angular/core';
import { Item } from './item.model';
import { StorageService } from '../../core/storage/storage.service';

@Injectable({ providedIn: 'root' })
export class ItemService {

  private readonly KEY = 'items';

  constructor(private storage: StorageService) {}

  // Получить все товары
  getAll(): Item[] {
    return this.storage.get<Item>(this.KEY);
  }

  // Получить один товар по ID
  getById(id: string): Item | undefined {
    return this.getAll().find(i => i.id === id);
  }

  // Создать новый товар
  create(title: string, category: 'income' | 'expense', amount: number): void {
    const items = this.getAll();

    items.push({
      id: crypto.randomUUID(),
      title,
      category,
      total: amount,
      lastUpdated: new Date().toISOString()
    });

    this.storage.set(this.KEY, items);
  }

  // Обновление суммы и даты
  updateTotal(id: string, delta: number): void {
    const items = this.getAll();

    const item = items.find(i => i.id === id);
    if (!item) return;

    item.total += delta;
    item.lastUpdated = new Date().toISOString();

    this.storage.set(this.KEY, items);
  }
}

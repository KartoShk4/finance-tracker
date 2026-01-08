import { Injectable } from '@angular/core';
import { Item } from './item.model';
import { StorageService } from '../../core/storage/storage.service';

@Injectable({ providedIn: 'root' })
export class ItemService {

  private readonly KEY = 'items';

  constructor(private storage: StorageService) {}

  getAll(): Item[] {
    return this.storage.get<Item>(this.KEY);
  }

  getById(id: string): Item | undefined {
    return this.getAll().find(i => i.id === id);
  }

  create(title: string, category: 'income' | 'expense'): Item {
    const items = this.getAll();

    const item: Item = {
      id: crypto.randomUUID(),
      title,
      category,
      total: 0,
      lastUpdated: new Date().toISOString()
    };

    items.push(item);
    this.storage.set(this.KEY, items);

    return item;
  }

  /**
   * Применяет финансовую дельту к Item
   */
  applyDelta(id: string, delta: number): void {
    const items = this.getAll();
    const item = items.find(i => i.id === id);
    if (!item) return;

    item.total += delta;
    item.lastUpdated = new Date().toISOString();

    this.storage.set(this.KEY, items);
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { Item } from './item.model';
import { ItemRepository } from '../../core/repository/item.repository';
import { LocalItemRepository } from '../../core/repository/local-item.repository';

@Injectable({ providedIn: 'root' })
export class ItemStore {
  // Пока используем LocalStorage-реализацию
  private repo: ItemRepository = inject(LocalItemRepository);

  private readonly _items = signal<Item[]>(this.repo.load());
  readonly items = computed(() => this._items());

  private persist(items: Item[]): void {
    this._items.set(items);
    this.repo.save(items);
  }

  create(title: string, category: 'income' | 'expense'): Item {
    const item: Item = {
      id: crypto.randomUUID(),
      title,
      category,
      total: 0,
      lastUpdated: new Date().toISOString()
    };

    this.persist([...this._items(), item]);
    return item;
  }

  applyDelta(id: string, delta: number): void {
    this.persist(
      this._items().map(i =>
        i.id === id
          ? { ...i, total: i.total + delta, lastUpdated: new Date().toISOString() }
          : i
      )
    );
  }
}

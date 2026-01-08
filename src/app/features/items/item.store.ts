import { Injectable, signal, computed, inject } from '@angular/core';
import { Item } from './item.model';
import { StorageService } from '../../core/storage/storage.service';

@Injectable({ providedIn: 'root' })
export class ItemStore {
  private readonly KEY = 'items';

  // inject работает ДО инициализации полей
  private storage = inject(StorageService);

  // теперь storage гарантированно доступен
  private readonly _items = signal<Item[]>(
    this.storage.get<Item>(this.KEY)
  );

  readonly items = computed(() => this._items());

  private persist(items: Item[]): void {
    this._items.set(items);
    this.storage.set(this.KEY, items);
  }

  getById(id: string): Item | undefined {
    return this._items().find(i => i.id === id);
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

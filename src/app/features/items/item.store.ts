import { Injectable, signal, computed, inject } from '@angular/core';
import { Item } from './item.model';
import { ItemSupabaseRepository } from '../../core/repository/item-supabase.repository';

@Injectable({ providedIn: 'root' })
export class ItemStore {
  private repo = inject(ItemSupabaseRepository);

  private readonly _items = signal<Item[]>([]);
  readonly items = computed(() => this._items());

  constructor() {
    this.load();
  }

  async load() {
    const data = await this.repo.getAll();
    this._items.set(data);
  }

  async create(title: string, category: 'income' | 'expense') {
    const item: Item = {
      id: crypto.randomUUID(),
      title,
      category,
      total: 0,
      lastUpdated: new Date().toISOString()
    };

    this._items.update(prev => [...prev, item]);
    await this.repo.save(this._items());
  }

  async applyDelta(id: string, delta: number) {
    this._items.update(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, total: i.total + delta, lastUpdated: new Date().toISOString() }
          : i
      )
    );
    await this.repo.save(this._items());
  }
}

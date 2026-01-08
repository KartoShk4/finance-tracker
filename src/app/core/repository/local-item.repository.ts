import { Injectable } from '@angular/core';
import { ItemRepository } from './item.repository';
import { Item } from '../../features/items/item.model';
import { StorageService } from '../storage/storage.service';

@Injectable({ providedIn: 'root' })
export class LocalItemRepository implements ItemRepository {
  private readonly KEY = 'items';

  constructor(private storage: StorageService) {}

  load(): Item[] {
    return this.storage.get<Item>(this.KEY);
  }

  save(items: Item[]): void {
    this.storage.set(this.KEY, items);
  }
}

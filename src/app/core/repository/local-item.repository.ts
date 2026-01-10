import { Injectable } from '@angular/core';
import { ItemRepository } from './item.repository';
import { Item } from '../../features/items/item.model';
import { StorageService } from '../storage/storage.service';

/**
 * Локальный репозиторий для демо-режима (localStorage)
 * Используется для неавторизованных пользователей
 */
@Injectable({ providedIn: 'root' })
export class LocalItemRepository implements ItemRepository {
  private readonly KEY = 'demo_items';

  constructor(private storage: StorageService) {}

  async getAll(): Promise<Item[]> {
    return this.storage.get<Item>(this.KEY) || [];
  }

  async save(items: Item[]): Promise<void> {
    this.storage.set(this.KEY, items);
  }
}

import { Item } from '../../features/items/item.model';

/**
 * Контракт репозитория товаров.
 * Любая реализация (LocalStorage / Supabase / API) обязана его соблюдать.
 */
export interface ItemRepository {
  getAll(): Promise<Item[]>;
  save(items: Item[]): Promise<void>;
}

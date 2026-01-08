import { Item } from '../../features/items/item.model';

/**
 * Контракт репозитория товаров.
 * Любая реализация (LocalStorage / Firebase / API) обязана его соблюдать.
 */
export interface ItemRepository {
  load(): Item[];
  save(items: Item[]): void;
}

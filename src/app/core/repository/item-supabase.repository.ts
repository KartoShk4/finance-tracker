import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Item } from '../../features/items/item.model';

@Injectable({ providedIn: 'root' })
export class ItemSupabaseRepository {
  constructor(private supabase: SupabaseService) {} // теперь должно работать

  async getAll(): Promise<Item[]> {
    const { data, error } = await this.supabase.client.from('items').select('*');
    if (error) throw error;
    return data as Item[];
  }

  async save(items: Item[]): Promise<void> {
    await this.supabase.client.from('items').delete().neq('id', '');
    await this.supabase.client.from('items').insert(items);
  }
}

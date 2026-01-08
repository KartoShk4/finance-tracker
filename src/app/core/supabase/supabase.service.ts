import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Сервис для работы с Supabase
 * Предоставляет клиент для взаимодействия с базой данных
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** Клиент Supabase для выполнения запросов к базе данных */
  readonly client: SupabaseClient;

  /**
   * Конструктор - инициализирует клиент Supabase
   */
  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
}

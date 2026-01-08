import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {

  // Получение данных по ключу
  get<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  // Сохранение данных по ключу
  set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

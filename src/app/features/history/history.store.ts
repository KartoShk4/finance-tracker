import { Injectable, signal, computed } from '@angular/core';
import { HistoryEntry } from './history.model';

/**
 * Store для управления историей изменений
 * Хранит историю в локальном хранилище браузера
 */
@Injectable({ providedIn: 'root' })
export class HistoryStore {
  private readonly STORAGE_KEY = 'finance_tracker_history';
  
  /** Приватный signal для хранения истории */
  private readonly _history = signal<HistoryEntry[]>([]);
  
  /** Публичный computed signal для доступа к истории */
  readonly history = computed(() => this._history());

  /**
   * Конструктор - загружает историю из localStorage
   */
  constructor() {
    this.load();
  }

  /**
   * Загрузка истории из localStorage
   */
  private load(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored) as HistoryEntry[];
        this._history.set(history);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  /**
   * Сохранение истории в localStorage
   */
  private save(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._history()));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  /**
   * Добавление записи в историю
   */
  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    const historyEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    this._history.update(prev => {
      const updated = [historyEntry, ...prev];
      // Ограничиваем историю последними 100 записями
      return updated.slice(0, 100);
    });
    
    this.save();
  }

  /**
   * Очистка истории
   */
  clear(): void {
    this._history.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}






import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Transaction } from './transaction.model';
import { TransactionSupabaseRepository } from '../../core/repository/transaction-supabase.repository';
import { LocalTransactionRepository } from '../../core/repository/local-transaction.repository';
import { TransactionRepository } from '../../core/repository/transaction.repository';
import { HistoryStore } from '../history/history.store';
import { VkAuthService } from '../../core/auth/auth.service';

/**
 * Store для управления состоянием транзакций
 * Использует Angular signals для реактивного управления данными
 * Работает только для авторизованных пользователей через Supabase
 */
@Injectable({ providedIn: 'root' })
export class TransactionStore {
  private supabaseRepo = inject(TransactionSupabaseRepository);
  private historyStore = inject(HistoryStore);
  private authService = inject(VkAuthService);

  /** Приватный signal для хранения всех транзакций */
  private readonly _tx = signal<Transaction[]>([]);

  /** Публичный computed signal для доступа ко всем транзакциям */
  readonly all = computed(() => {
    // Для неавторизованных пользователей возвращаем пустой массив
    if (!this.authService.isAuthenticated()) {
      return [];
    }
    return this._tx();
  });

  /** Флаг для предотвращения бесконечных перезагрузок */
  private isReloading = false;

  /**
   * Конструктор - загружает данные при инициализации и реагирует на изменения авторизации
   */
  constructor() {
    this.load();

    // Реагируем на изменения авторизации и перезагружаем данные
    // Используем effect для отслеживания изменений состояния авторизации
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();
      // Перезагружаем данные при изменении состояния авторизации
      // Используем setTimeout чтобы избежать ошибок при инициализации
      if (!this.isReloading) {
        this.isReloading = true;
        setTimeout(() => {
          this.load().catch(error => console.error('Ошибка перезагрузки транзакций:', error))
            .finally(() => {
              // Небольшая задержка перед следующей возможной перезагрузкой
              setTimeout(() => {
                this.isReloading = false;
              }, 500);
            });
        }, 100);
      }
    });
  }

  /**
   * Загрузка всех транзакций из Supabase
   * Для неавторизованных пользователей возвращает пустой массив
   */
  async load(): Promise<void> {
    // Для неавторизованных пользователей не загружаем данные
    if (!this.authService.isAuthenticated()) {
      this._tx.set([]);
      return;
    }

    try {
      const userId = this.authService.user()?.id;
      if (!userId) {
        console.warn('User ID не найден, пропускаем загрузку транзакций');
        this._tx.set([]);
        return;
      }
      
      const data = await this.supabaseRepo.getAll();
      console.log(`Загружено транзакций для пользователя ${userId}:`, data.length);
      this._tx.set(data);
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
      this._tx.set([]);
    }
  }

  /**
   * Получение транзакций для конкретной категории
   * @param item_id - ID категории
   * @returns computed signal с отфильтрованными транзакциями
   */
  byItem(item_id: string) {
    return computed(() => this._tx().filter(t => t.item_id === item_id));
  }

  /**
   * Добавление новой транзакции
   * @param item_id - ID категории
   * @param type - тип транзакции (доход/расход)
   * @param amount - сумма транзакции
   * @param date - дата и время транзакции (ISO string), по умолчанию текущее время
   * @param notes - примечание к транзакции (необязательное)
   * @returns дельта для обновления общей суммы категории (положительная для дохода, отрицательная для расхода)
   */
  async add(item_id: string, type: 'income' | 'expense', amount: number, date?: string, notes?: string, subcategory_id?: string): Promise<number> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Необходима авторизация для добавления транзакций');
    }

    const tx: Transaction = {
      id: crypto.randomUUID(),
      item_id,
      type,
      amount,
      date: date || new Date().toISOString(),
      notes: notes?.trim() || undefined,
      subcategory_id: subcategory_id || undefined
    };

    // Обновляем локальное состояние
    this._tx.update(prev => [...prev, tx]);

    // Сохраняем в базу данных
    await this.supabaseRepo.save(this._tx());

    // Добавляем запись в историю
    this.historyStore.addEntry({
      action: 'created',
      entityType: 'transaction',
      entityId: tx.id,
      entityTitle: `${type === 'income' ? 'Доход' : 'Расход'}: ${amount} ₽`,
      details: `Транзакция добавлена`
    });

    // Возвращаем дельту для обновления общей суммы категории
    return type === 'income' ? amount : -amount;
  }

  /**
   * Удаление транзакции
   * @param id - ID транзакции
   * @returns дельта для обновления общей суммы категории (отрицательная для дохода, положительная для расхода)
   */
  async delete(id: string): Promise<number> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Необходима авторизация для удаления транзакций');
    }

    const tx = this._tx().find(t => t.id === id);
    if (!tx) return 0;

    // Вычисляем дельту для отката изменений в категории
    const delta = tx.type === 'income' ? -tx.amount : tx.amount;

    // Удаляем из локального состояния
    this._tx.update(prev => prev.filter(t => t.id !== id));

    // Сохраняем в базу данных
    await this.supabaseRepo.save(this._tx());

    // Добавляем запись в историю
    this.historyStore.addEntry({
      action: 'deleted',
      entityType: 'transaction',
      entityId: id,
      entityTitle: `${tx.type === 'income' ? 'Доход' : 'Расход'}: ${tx.amount} ₽`,
      details: `Транзакция удалена`
    });

    return delta;
  }

  /**
   * Обновление существующей транзакции
   * @param id - ID транзакции
   * @param updates - объект с полями для обновления (amount, date, notes)
   * @returns новая дельта для обновления общей суммы категории
   */
  async update(id: string, updates: { amount?: number; date?: string; notes?: string; subcategory_id?: string }): Promise<number> {
    const tx = this._tx().find(t => t.id === id);
    if (!tx) return 0;

    // Сохраняем старую дельту для отката
    const oldDelta = tx.type === 'income' ? -tx.amount : tx.amount;

    // Обновляем транзакцию
    const updatedTx: Transaction = {
      ...tx,
      ...(updates.amount !== undefined && { amount: updates.amount }),
      // Убеждаемся, что дата в формате ISO string
      ...(updates.date !== undefined && { date: updates.date ? new Date(updates.date).toISOString() : tx.date }),
      ...(updates.notes !== undefined && { notes: updates.notes?.trim() || undefined }),
      ...(updates.subcategory_id !== undefined && { subcategory_id: updates.subcategory_id || undefined })
    };

    // Обновляем локальное состояние
    this._tx.update(prev => prev.map(t => t.id === id ? updatedTx : t));

    // Сохраняем в базу данных (только для авторизованных)
    if (this.authService.isAuthenticated()) {
      await this.supabaseRepo.save(this._tx());
    }

    // Вычисляем новую дельту
    const newDelta = updatedTx.type === 'income' ? updatedTx.amount : -updatedTx.amount;

    // Возвращаем разницу для обновления общей суммы категории
    return newDelta + oldDelta;
  }
}

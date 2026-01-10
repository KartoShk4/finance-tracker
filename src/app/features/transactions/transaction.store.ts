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
 * Работает в двух режимах:
 * - Демо-режим (LocalStorage) для неавторизованных пользователей
 * - Реальный режим (Supabase) для авторизованных пользователей
 */
@Injectable({ providedIn: 'root' })
export class TransactionStore {
  private supabaseRepo = inject(TransactionSupabaseRepository);
  private localRepo = inject(LocalTransactionRepository);
  private historyStore = inject(HistoryStore);
  private authService = inject(VkAuthService);

  /** Приватный signal для хранения всех транзакций */
  private readonly _tx = signal<Transaction[]>([]);
  
  /** Публичный computed signal для доступа ко всем транзакциям */
  readonly all = computed(() => this._tx());

  /** Текущий репозиторий в зависимости от состояния авторизации */
  private get repo(): TransactionRepository {
    return this.authService.isAuthenticated() ? this.supabaseRepo : this.localRepo;
  }

  /** Флаг демо-режима */
  readonly isDemoMode = computed(() => !this.authService.isAuthenticated());

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
   * Загрузка всех транзакций из соответствующего репозитория
   */
  async load(): Promise<void> {
    try {
      const data = await this.repo.getAll();
      this._tx.set(data);
      
      // Если демо-режим и нет данных, загружаем демо-транзакции для демо-категорий
      if (this.isDemoMode() && data.length === 0) {
        this.loadDemoTransactions();
      }
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
      // В случае ошибки в демо-режиме загружаем демо-данные
      if (this.isDemoMode()) {
        this.loadDemoTransactions();
      }
    }
  }

  /**
   * Загрузка демо-транзакций для неавторизованных пользователей
   */
  private async loadDemoTransactions(): Promise<void> {
    const demoTransactions: Transaction[] = [
      {
        id: 'demo-tx-1',
        item_id: 'demo-1',
        type: 'income',
        amount: 50000,
        date: new Date().toISOString(),
        notes: 'Зарплата за месяц'
      },
      {
        id: 'demo-tx-2',
        item_id: 'demo-2',
        type: 'expense',
        amount: 5000,
        date: new Date(Date.now() - 86400000).toISOString(),
        notes: 'Продукты на неделю'
      },
      {
        id: 'demo-tx-3',
        item_id: 'demo-2',
        type: 'expense',
        amount: 3000,
        date: new Date(Date.now() - 172800000).toISOString(),
        notes: 'Овощи и фрукты'
      },
      {
        id: 'demo-tx-4',
        item_id: 'demo-3',
        type: 'expense',
        amount: 1500,
        date: new Date(Date.now() - 259200000).toISOString(),
        notes: 'Проездной'
      },
      {
        id: 'demo-tx-5',
        item_id: 'demo-4',
        type: 'expense',
        amount: 2000,
        date: new Date(Date.now() - 345600000).toISOString(),
        notes: 'Кино'
      }
    ];
    
    this._tx.set(demoTransactions);
    await this.repo.save(demoTransactions);
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
    // В демо-режиме запрещаем добавление транзакций
    if (this.isDemoMode()) {
      throw new Error('Войдите в систему, чтобы добавлять транзакции');
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
    await this.repo.save(this._tx());

    // Добавляем запись в историю (только для авторизованных пользователей)
    if (!this.isDemoMode()) {
      this.historyStore.addEntry({
        action: 'created',
        entityType: 'transaction',
        entityId: tx.id,
        entityTitle: `${type === 'income' ? 'Доход' : 'Расход'}: ${amount} ₽`,
        details: `Транзакция добавлена`
      });
    }

    // Возвращаем дельту для обновления общей суммы категории
    return type === 'income' ? amount : -amount;
  }

  /**
   * Удаление транзакции
   * @param id - ID транзакции
   * @returns дельта для обновления общей суммы категории (отрицательная для дохода, положительная для расхода)
   */
  async delete(id: string): Promise<number> {
    // В демо-режиме запрещаем удаление транзакций
    if (this.isDemoMode()) {
      throw new Error('Войдите в систему, чтобы удалять транзакции');
    }

    const tx = this._tx().find(t => t.id === id);
    if (!tx) return 0;

    // Вычисляем дельту для отката изменений в категории
    const delta = tx.type === 'income' ? -tx.amount : tx.amount;

    // Удаляем из локального состояния
    this._tx.update(prev => prev.filter(t => t.id !== id));

    // Сохраняем в базу данных
    await this.repo.save(this._tx());

    // Добавляем запись в историю (только для авторизованных пользователей)
    if (!this.isDemoMode()) {
      this.historyStore.addEntry({
        action: 'deleted',
        entityType: 'transaction',
        entityId: id,
        entityTitle: `${tx.type === 'income' ? 'Доход' : 'Расход'}: ${tx.amount} ₽`,
        details: `Транзакция удалена`
      });
    }

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

    // Сохраняем в базу данных
    await this.repo.save(this._tx());

    // Вычисляем новую дельту
    const newDelta = updatedTx.type === 'income' ? updatedTx.amount : -updatedTx.amount;

    // Возвращаем разницу для обновления общей суммы категории
    return newDelta + oldDelta;
  }
}

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
   * Создаем больше транзакций с разными датами для демонстрации графиков
   */
  private async loadDemoTransactions(): Promise<void> {
    const now = new Date();
    const demoTransactions: Transaction[] = [];

    // Функция для создания даты N дней назад
    const daysAgo = (days: number): string => {
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      date.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0);
      return date.toISOString();
    };

    // Доходы - Зарплата (demo-1)
    demoTransactions.push(
      { id: 'demo-tx-1', item_id: 'demo-1', type: 'income', amount: 50000, date: daysAgo(2), notes: 'Зарплата за январь' }
    );

    // Доходы - Фриланс (demo-7)
    demoTransactions.push(
      { id: 'demo-tx-f1', item_id: 'demo-7', type: 'income', amount: 15000, date: daysAgo(4), notes: 'Проект #1' },
      { id: 'demo-tx-f2', item_id: 'demo-7', type: 'income', amount: 10000, date: daysAgo(8), notes: 'Проект #2' }
    );

    // Расходы - Продукты (demo-2) - несколько транзакций для графика
    demoTransactions.push(
      { id: 'demo-tx-p1', item_id: 'demo-2', type: 'expense', amount: 8500, date: daysAgo(0), notes: 'Большой магазин на неделю' },
      { id: 'demo-tx-p2', item_id: 'demo-2', type: 'expense', amount: 3200, date: daysAgo(3), notes: 'Овощи и фрукты' },
      { id: 'demo-tx-p3', item_id: 'demo-2', type: 'expense', amount: 4800, date: daysAgo(7), notes: 'Молочные продукты' },
      { id: 'demo-tx-p4', item_id: 'demo-2', type: 'expense', amount: 2900, date: daysAgo(10), notes: 'Хлеб и выпечка' },
      { id: 'demo-tx-p5', item_id: 'demo-2', type: 'expense', amount: 4100, date: daysAgo(14), notes: 'Мясо и рыба' }
    );

    // Расходы - Транспорт (demo-3)
    demoTransactions.push(
      { id: 'demo-tx-t1', item_id: 'demo-3', type: 'expense', amount: 1500, date: daysAgo(0), notes: 'Проездной на месяц' },
      { id: 'demo-tx-t2', item_id: 'demo-3', type: 'expense', amount: 500, date: daysAgo(5), notes: 'Такси' },
      { id: 'demo-tx-t3', item_id: 'demo-3', type: 'expense', amount: 800, date: daysAgo(12), notes: 'Бензин' },
      { id: 'demo-tx-t4', item_id: 'demo-3', type: 'expense', amount: 1700, date: daysAgo(15), notes: 'Проездной предыдущий месяц' }
    );

    // Расходы - Развлечения (demo-4)
    demoTransactions.push(
      { id: 'demo-tx-e1', item_id: 'demo-4', type: 'expense', amount: 2500, date: daysAgo(1), notes: 'Кинотеатр' },
      { id: 'demo-tx-e2', item_id: 'demo-4', type: 'expense', amount: 4500, date: daysAgo(4), notes: 'Ресторан' },
      { id: 'demo-tx-e3', item_id: 'demo-4', type: 'expense', amount: 3000, date: daysAgo(9), notes: 'Концерт' },
      { id: 'demo-tx-e4', item_id: 'demo-4', type: 'expense', amount: 2000, date: daysAgo(13), notes: 'Боулинг' }
    );

    // Расходы - Коммунальные услуги (demo-5)
    demoTransactions.push(
      { id: 'demo-tx-u1', item_id: 'demo-5', type: 'expense', amount: 3500, date: daysAgo(5), notes: 'Электричество' },
      { id: 'demo-tx-u2', item_id: 'demo-5', type: 'expense', amount: 2500, date: daysAgo(6), notes: 'Вода и канализация' },
      { id: 'demo-tx-u3', item_id: 'demo-5', type: 'expense', amount: 2000, date: daysAgo(7), notes: 'Отопление' }
    );

    // Расходы - Одежда (demo-6)
    demoTransactions.push(
      { id: 'demo-tx-c1', item_id: 'demo-6', type: 'expense', amount: 8500, date: daysAgo(7), notes: 'Куртка' },
      { id: 'demo-tx-c2', item_id: 'demo-6', type: 'expense', amount: 3500, date: daysAgo(8), notes: 'Обувь' },
      { id: 'demo-tx-c3', item_id: 'demo-6', type: 'expense', amount: 3000, date: daysAgo(9), notes: 'Джинсы' }
    );

    // Расходы - Кафе и рестораны (demo-8)
    demoTransactions.push(
      { id: 'demo-tx-r1', item_id: 'demo-8', type: 'expense', amount: 1200, date: daysAgo(0), notes: 'Кофе на работе' },
      { id: 'demo-tx-r2', item_id: 'demo-8', type: 'expense', amount: 1800, date: daysAgo(2), notes: 'Обед в кафе' },
      { id: 'demo-tx-r3', item_id: 'demo-8', type: 'expense', amount: 2500, date: daysAgo(4), notes: 'Ужин в ресторане' },
      { id: 'demo-tx-r4', item_id: 'demo-8', type: 'expense', amount: 900, date: daysAgo(6), notes: 'Быстрый обед' },
      { id: 'demo-tx-r5', item_id: 'demo-8', type: 'expense', amount: 2100, date: daysAgo(8), notes: 'Кофе и десерт' }
    );

    // Сортируем по дате (от новых к старым)
    demoTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
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

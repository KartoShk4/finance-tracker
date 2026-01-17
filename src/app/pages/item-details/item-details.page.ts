import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ItemStore } from '../../features/items/item.store';
import { TransactionStore } from '../../features/transactions/transaction.store';
import { SubcategoryStore } from '../../features/subcategories/subcategory.store';
import { VkAuthService } from '../../core/auth/auth.service';
import { DateTimePickerComponent } from '../../shared/components/date-time-picker/date-time-picker.component';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { aggregateByPeriod, PeriodType } from '../../shared/utils/chart.utils';

/**
 * Компонент страницы деталей item
 * Отображает транзакции для конкретной категории и график
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DateTimePickerComponent, LocalDatePipe, ChartComponent, ModalComponent],
  templateUrl: './item-details.page.html',
  styleUrls: ['./item-details.page.scss']
})
export class ItemDetailsPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private txStore = inject(TransactionStore);
  private itemStore = inject(ItemStore);
  private subcategoryStore = inject(SubcategoryStore);
  private authService = inject(VkAuthService);

  /** Флаг демо-режима */
  isDemoMode = this.itemStore.isDemoMode;

  /** ID текущего item из параметров маршрута */
  itemId = this.route.snapshot.paramMap.get('id')!;

  /** Сумма для новой транзакции */
  amount = 0;

  /** Тип транзакции (выбирается пользователем) */
  transactionType: 'income' | 'expense' = 'income';

  /** Дата и время транзакции */
  transactionDate: string = new Date().toISOString();

  /** Примечание к транзакции */
  notes = '';

  /** Выбранная подкатегория для транзакции */
  selectedSubcategoryId: string | null = null;

  /** Название новой подкатегории (для быстрого создания) */
  newSubcategoryName = '';

  /** ID транзакции, которая редактируется (null если не редактируется) */
  editingTransactionId: string | null = null;

  /** Поля для редактирования транзакции */
  editAmount = 0;
  editTransactionType: 'income' | 'expense' = 'income';
  editDate: string = '';
  editNotes = '';
  editSubcategoryId: string | null = null;

  /** Выбранный период для графика */
  selectedPeriod = signal<PeriodType>('day');

  /** Подкатегории для текущей категории */
  subcategories = this.subcategoryStore.byItemId(this.itemId);

  /** Фильтр по типу транзакции */
  transactionFilter = signal<'all' | 'income' | 'expense'>('all');

  /** Флаг процесса сохранения транзакции */
  private _isSaving = signal<boolean>(false);
  isSaving = computed(() => this._isSaving());

  /** Состояние модальных окон */
  showDeleteCategoryModal = false;
  showDeleteSubcategoryModal = false;
  subcategoryToDelete: string | null = null;

  /**
   * Получение названия подкатегории по ID
   */
  getSubcategoryName(subcategoryId: string): string {
    const sub = this.subcategories().find(s => s.id === subcategoryId);
    return sub?.title || '';
  }

  /** Текущая категория */
  currentItem = computed(() => {
    return this.itemStore.items().find(item => item.id === this.itemId);
  });

  /** Отфильтрованные транзакции */
  filteredTransactions = computed(() => {
    let filtered = this.transactions();

    // Фильтрация по типу транзакции
    if (this.transactionFilter() !== 'all') {
      filtered = filtered.filter(tx => tx.type === this.transactionFilter());
    }

    return filtered;
  });

  /** Все транзакции для текущего item */
  transactions = this.txStore.byItem(this.itemId);

  /** Данные для графика, агрегированные по выбранному периоду */
  chartData = computed(() => {
    const transactions = this.transactions();
    if (transactions.length === 0) {
      return { labels: [], data: [] };
    }
    return aggregateByPeriod(transactions, this.selectedPeriod());
  });

  /**
   * Проверка возможности создания транзакции в демо-режиме
   */
  canCreateTransactionInDemo(): boolean {
    if (!this.isDemoMode()) return true;
    // Считаем только пользовательские транзакции (не демо)
    const userTransactions = this.transactions().filter(tx => !tx.id.startsWith('demo-tx-'));
    return userTransactions.length < 2;
  }

  /**
   * Добавление новой транзакции
   * Тип транзакции выбирается пользователем
   * @param event - событие submit формы
   */
  async addTransaction(event?: Event): Promise<void> {
    // Предотвращаем стандартное поведение формы
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Защита от повторных отправок
    if (this._isSaving()) {
      return;
    }

    // Валидация: проверяем сумму
    if (!this.amount || this.amount <= 0) {
      alert('Введите сумму транзакции');
      return;
    }

    // В демо-режиме проверяем лимит
    if (this.isDemoMode()) {
      if (!this.canCreateTransactionInDemo()) {
        alert('В демо-режиме можно создать только 2 транзакции. Войдите в систему для создания неограниченного количества транзакций.');
        return;
      }
    }

    const item = this.currentItem();
    if (!item) {
      alert('Категория не найдена');
      return;
    }

    // Устанавливаем флаг сохранения
    this._isSaving.set(true);

    try {
      // Тип транзакции выбирается пользователем
      const type = this.transactionType;

      let subcategoryId: string | undefined =
        this.selectedSubcategoryId || undefined;

      // Добавляем транзакцию с выбранной датой, примечанием и подкатегорией, получаем дельту (изменение суммы)
      const delta = await this.txStore.add(
        this.itemId,
        type,
        this.amount,
        this.transactionDate,
        this.notes,
        subcategoryId
      );

      // Обновляем общую сумму item
      await this.itemStore.applyDelta(this.itemId, delta);

      // Сбрасываем форму только после успешного создания
      this.resetForm();
    } catch (error: any) {
      if (error.message === 'DEMO_TRANSACTION_LIMIT_REACHED') {
        alert('В демо-режиме можно создать только 2 транзакции. Войдите в систему для создания неограниченного количества транзакций.');
      } else {
        alert(error.message || 'Ошибка при добавлении транзакции');
      }
    } finally {
      // Снимаем флаг сохранения в любом случае
      this._isSaving.set(false);
    }
  }

  /**
   * Создание новой подкатегории по кнопке-галочке
   */
  async createSubcategory(): Promise<void> {
    if (this.isSaving()) return;

    const name = this.newSubcategoryName.trim();
    if (!name) return;

    this._isSaving.set(true);

    try {
      const subcategory = await this.subcategoryStore.create(this.itemId, name);

      // сразу выбираем созданный тег
      this.selectedSubcategoryId = subcategory.id;

      // очищаем инпут
      this.newSubcategoryName = '';
    } finally {
      this._isSaving.set(false);
    }
  }

  /**
   * Сброс формы добавления транзакции
   */
  private resetForm(): void {
    this.amount = 0;
    this.transactionType = 'income';
    this.transactionDate = new Date().toISOString();
    this.notes = '';
    this.selectedSubcategoryId = null;
    this.newSubcategoryName = '';
  }

  /**
   * Удаление транзакции
   * @param id - ID транзакции
   */
  async deleteTransaction(id: string): Promise<void> {
    // В демо-режиме запрещаем удаление транзакций
    if (this.isDemoMode()) {
      alert('Войдите в систему, чтобы удалять транзакции');
      return;
    }

    try {
      // Удаляем транзакцию и получаем дельту для отката изменений
      const delta = await this.txStore.delete(id);

      // Обновляем общую сумму item (откатываем изменения)
      await this.itemStore.applyDelta(this.itemId, delta);
    } catch (error: any) {
      alert(error.message || 'Ошибка при удалении транзакции');
    }
  }

  /**
   * Начало редактирования транзакции
   * @param transaction - транзакция для редактирования
   */
  startEdit(transaction: { id: string; type: 'income' | 'expense'; amount: number; date: string; notes?: string; subcategory_id?: string }): void {
    this.editingTransactionId = transaction.id;
    this.editTransactionType = transaction.type;
    this.editAmount = transaction.amount;
    this.editDate = transaction.date;
    this.editNotes = transaction.notes || '';
    this.editSubcategoryId = transaction.subcategory_id || null;
  }

  /**
   * Отмена редактирования
   */
  cancelEdit(): void {
    this.editingTransactionId = null;
    this.editAmount = 0;
    this.editTransactionType = 'income';
    this.editDate = '';
    this.editNotes = '';
    this.editSubcategoryId = null;
  }

  /**
   * Сохранение изменений транзакции
   * @param id - ID транзакции
   */
  async saveEdit(id: string): Promise<void> {
    // В демо-режиме запрещаем редактирование транзакций
    if (this.isDemoMode()) {
      alert('Войдите в систему, чтобы редактировать транзакции');
      return;
    }

    if (this.editAmount <= 0) return;

    // Убеждаемся, что дата валидна и в формате ISO
    let validDate = this.editDate;
    if (!validDate || validDate.trim() === '') {
      // Если дата не указана, используем текущую дату
      validDate = new Date().toISOString();
    } else {
      // Проверяем, что дата валидна
      const dateObj = new Date(validDate);
      if (isNaN(dateObj.getTime())) {
        validDate = new Date().toISOString();
      } else {
        validDate = dateObj.toISOString();
      }
    }

    // Получаем текущую транзакцию для определения старого типа
    const currentTx = this.transactions().find(tx => tx.id === id);
    if (!currentTx) return;

    // Если тип изменился, нужно пересчитать дельту
    // Для этого удаляем старую транзакцию и создаем новую с новым типом
    if (currentTx.type !== this.editTransactionType) {
      // Удаляем старую транзакцию
      const deleteDelta = await this.txStore.delete(id);
      await this.itemStore.applyDelta(this.itemId, deleteDelta);

      // Создаем новую транзакцию с новым типом
      const addDelta = await this.txStore.add(
        this.itemId,
        this.editTransactionType,
        this.editAmount,
        validDate,
        this.editNotes,
        this.editSubcategoryId || undefined
      );
      await this.itemStore.applyDelta(this.itemId, addDelta);
    } else {
      // Тип не изменился, обновляем транзакцию как обычно
      const delta = await this.txStore.update(id, {
        amount: this.editAmount,
        date: validDate,
        notes: this.editNotes,
        subcategory_id: this.editSubcategoryId || undefined
      });
      await this.itemStore.applyDelta(this.itemId, delta);
    }

    // Сбрасываем состояние редактирования
    this.cancelEdit();
  }


  /**
   * Открытие модального окна удаления категории
   */
  openDeleteCategoryModal(): void {
    this.showDeleteCategoryModal = true;
  }

  /**
   * Удаление категории
   */
  async confirmDeleteCategory(): Promise<void> {
    try {
      await this.itemStore.delete(this.itemId);
      this.showDeleteCategoryModal = false;
      this.router.navigate(['/']);
    } catch (error: any) {
      alert(error.message || 'Ошибка при удалении категории');
      this.showDeleteCategoryModal = false;
    }
  }

  /**
   * Открытие модального окна удаления подкатегории
   * @param id - ID подкатегории
   */
  openDeleteSubcategoryModal(id: string): void {
    this.subcategoryToDelete = id;
    this.showDeleteSubcategoryModal = true;
  }

  /**
   * Удаление подкатегории
   */
  async confirmDeleteSubcategory(): Promise<void> {
    if (this.subcategoryToDelete) {
      await this.subcategoryStore.delete(this.subcategoryToDelete);
      this.subcategoryToDelete = null;
    }
    this.showDeleteSubcategoryModal = false;
  }
}
